/**
 * Portfolio performance analytics from transaction history + live holdings.
 *
 * Design notes / data caveats:
 * - Robinhood activity exports omit crypto buys and early cash deposits. We therefore do NOT
 *   trust "return vs deposits" or a cash-replay NAV. Returns are money-weighted on the capital we
 *   can actually account for (cost basis of buys), which is robust to missing deposit rows.
 * - Sells with no matching buy lot (e.g. ETH/DOGE bought before the export window) are flagged as
 *   "untracked" and excluded from realized P/L, win rate, and returns so they can't create phantom
 *   gains.
 * - The cumulative chart replays the ACTUAL share counts through time from the transaction log,
 *   valued at real historical prices, with daily flow adjustment so buys/sells aren't read as gains.
 *   Early history therefore reflects the book as it was then, not today's allocation.
 */

import type { HoldingRow, NavHistoryRow, TransactionRow } from './parsePersonalPortfolioCsv';
import { quotePriceForTicker, toYahooSymbol, type QuoteMap } from './yahooSymbols';

export interface PositionPerformance {
  ticker: string;
  name: string;
  sector: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  weightPct: number;
  unrealizedGain: number;
  unrealizedGainPct: number;
  dayChangePct: number | null;
  dayChangeUsd: number | null;
}

export interface ClosedTrade {
  ticker: string;
  sellDate: string;
  sharesSold: number;
  proceeds: number;
  costBasis: number;
  gain: number;
  gainPct: number;
  tracked: boolean;
}

export interface PortfolioAnalytics {
  inceptionDate: string;
  currentValue: number;
  statementValue: number;
  dayChangeUsd: number | null;
  dayChangePct: number | null;

  netDeposits: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalDividends: number;
  totalBuyVolume: number;
  totalSellProceeds: number;
  depositsComplete: boolean;

  openCostBasis: number;
  totalCostDeployed: number;

  unrealizedGain: number;
  unrealizedGainPct: number;
  realizedGain: number;
  realizedReturnPct: number | null;
  totalGain: number;

  /** Money-weighted return on deployed capital, including dividends. */
  moneyWeightedReturnPct: number;
  /** Same, excluding dividends (for a fair vs-benchmark comparison). */
  moneyWeightedReturnExDivPct: number;
  /** SPY return with the same dollars invested at the same dates. */
  benchmarkReturnPct: number | null;
  alphaPct: number | null;
  dividendYieldPct: number;

  /** Transaction-replay backtest of the book at real historical prices, plus a live end point. */
  navHistory: NavHistoryRow[];
  backtestReturnPct: number | null;
  backtestBenchmarkPct: number | null;
  backtestExcludes: string[];
  maxDrawdownPct: number | null;

  positions: PositionPerformance[];
  topPerformers: PositionPerformance[];
  bottomPerformers: PositionPerformance[];
  closedTrades: ClosedTrade[];
  winRatePct: number | null;
  tradeCount: number;
  untrackedSellCount: number;

  risk: PortfolioRiskMetrics;
}

export interface PositionRisk {
  ticker: string;
  weightPct: number;
  beta: number | null;
  annualizedVolPct: number | null;
}

export interface PortfolioRiskMetrics {
  /** Annualized std dev of daily time-weighted returns (%). */
  annualizedVolatilityPct: number | null;
  benchmarkVolatilityPct: number | null;
  /** OLS beta vs benchmark on daily returns. */
  beta: number | null;
  /** Annualized alpha from regression (%). */
  alphaAnnualPct: number | null;
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  /** Annualized std dev of active daily returns vs benchmark (%). */
  trackingErrorPct: number | null;
  correlationWithBenchmark: number | null;
  rSquared: number | null;
  /** Historical 1-day 95% VaR (%). */
  var95DailyPct: number | null;
  calmarRatio: number | null;
  /** Herfindahl index on current weights (0–1; higher = more concentrated). */
  concentrationHhi: number;
  top3WeightPct: number;
  effectiveHoldings: number;
  largestSector: string | null;
  largestSectorWeightPct: number;
  /** Weighted average of constituent betas (current book). */
  weightedBeta: number | null;
  positionRisks: PositionRisk[];
  observationDays: number;
  riskFreeRatePct: number;
}

interface CostLot {
  shares: number;
  costPerShare: number;
  date: string;
}

interface BenchmarkLeg {
  amount: number;
  buyDate: string;
  sellDate: string | null;
}

function txAmount(tx: TransactionRow): number {
  return Math.abs(tx.amount);
}

function sharesFromTx(tx: TransactionRow): number {
  if (tx.shares != null && tx.shares > 0) return tx.shares;
  if (tx.price != null && tx.price > 0) return txAmount(tx) / tx.price;
  return 0;
}

/** Returns a function giving the close on or before a date (forward-filled). */
function makeCloseLookup(
  history: { date: string; close: number }[]
): (iso: string) => number | null {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  return (iso: string) => {
    let best: number | null = null;
    for (const p of sorted) {
      if (p.date <= iso) best = p.close;
      else break;
    }
    return best;
  };
}

interface LotResult {
  openAvgCost: Map<string, { shares: number; totalCost: number }>;
  realizedGain: number;
  trackedClosedCost: number;
  closedTrades: ClosedTrade[];
  untrackedSellCount: number;
  untrackedProceeds: number;
  legs: BenchmarkLeg[];
}

/** FIFO cost-basis engine. Same-day buys are processed before sells. */
function computeLots(transactions: TransactionRow[]): LotResult {
  const typeRank: Record<string, number> = { buy: 0, sell: 1 };
  const sorted = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (typeRank[a.type] ?? 2) - (typeRank[b.type] ?? 2);
  });

  const lots = new Map<string, CostLot[]>();
  let realizedGain = 0;
  let trackedClosedCost = 0;
  let untrackedSellCount = 0;
  let untrackedProceeds = 0;
  const closedTrades: ClosedTrade[] = [];
  const legs: BenchmarkLeg[] = [];

  for (const tx of sorted) {
    const ticker = tx.ticker;
    if (ticker === '—') continue;

    if (tx.type === 'buy') {
      const shares = sharesFromTx(tx);
      if (shares <= 0) continue;
      const amt = txAmount(tx);
      const queue = lots.get(ticker) ?? [];
      queue.push({ shares, costPerShare: amt / shares, date: tx.date });
      lots.set(ticker, queue);
    } else if (tx.type === 'sell') {
      const proceeds = txAmount(tx);
      let sharesToSell = tx.shares ?? sharesFromTx(tx);
      const sharesSold = sharesToSell;
      const queue = lots.get(ticker) ?? [];
      let costSold = 0;
      const matchedLegs: BenchmarkLeg[] = [];

      while (sharesToSell > 1e-8 && queue.length) {
        const lot = queue[0]!;
        const take = Math.min(sharesToSell, lot.shares);
        const legCost = take * lot.costPerShare;
        costSold += legCost;
        matchedLegs.push({ amount: legCost, buyDate: lot.date, sellDate: tx.date });
        lot.shares -= take;
        sharesToSell -= take;
        if (lot.shares <= 1e-8) queue.shift();
      }
      lots.set(ticker, queue);

      const tracked = costSold > 0;
      if (tracked) {
        const gain = proceeds - costSold;
        realizedGain += gain;
        trackedClosedCost += costSold;
        legs.push(...matchedLegs);
        closedTrades.push({
          ticker,
          sellDate: tx.date,
          sharesSold,
          proceeds,
          costBasis: costSold,
          gain,
          gainPct: costSold > 0 ? (gain / costSold) * 100 : 0,
          tracked: true,
        });
      } else {
        untrackedSellCount += 1;
        untrackedProceeds += proceeds;
        closedTrades.push({
          ticker,
          sellDate: tx.date,
          sharesSold,
          proceeds,
          costBasis: 0,
          gain: 0,
          gainPct: 0,
          tracked: false,
        });
      }
    }
  }

  const openAvgCost = new Map<string, { shares: number; totalCost: number }>();
  for (const [ticker, queue] of lots) {
    let shares = 0;
    let totalCost = 0;
    for (const lot of queue) {
      if (lot.shares <= 1e-8) continue;
      shares += lot.shares;
      totalCost += lot.shares * lot.costPerShare;
      legs.push({ amount: lot.shares * lot.costPerShare, buyDate: lot.date, sellDate: null });
    }
    if (shares > 1e-8) openAvgCost.set(ticker, { shares, totalCost });
  }

  return {
    openAvgCost,
    realizedGain,
    trackedClosedCost,
    closedTrades,
    untrackedSellCount,
    untrackedProceeds,
    legs,
  };
}

function computeCashFlowTotals(transactions: TransactionRow[]) {
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let totalDividends = 0;
  let totalBuyVolume = 0;
  let totalSellProceeds = 0;

  for (const tx of transactions) {
    const amt = txAmount(tx);
    switch (tx.type) {
      case 'deposit':
        totalDeposits += amt;
        break;
      case 'withdrawal':
        totalWithdrawals += amt;
        break;
      case 'dividend':
        totalDividends += amt;
        break;
      case 'buy':
        totalBuyVolume += amt;
        break;
      case 'sell':
        totalSellProceeds += amt;
        break;
    }
  }

  return {
    totalDeposits,
    totalWithdrawals,
    totalDividends,
    totalBuyVolume,
    totalSellProceeds,
    netDeposits: totalDeposits - totalWithdrawals,
  };
}

/** Money-weighted SPY return: same dollars invested on the same dates (and exited on sell dates). */
function moneyWeightedBenchmark(
  legs: BenchmarkLeg[],
  benchmarkHistory: { date: string; close: number }[]
): number | null {
  if (!benchmarkHistory.length || !legs.length) return null;
  const closeAt = makeCloseLookup(benchmarkHistory);
  const sorted = [...benchmarkHistory].sort((a, b) => a.date.localeCompare(b.date));
  const spyNow = sorted[sorted.length - 1]!.close;

  let wsum = 0;
  let wret = 0;
  for (const leg of legs) {
    const buy = closeAt(leg.buyDate);
    const end = leg.sellDate ? closeAt(leg.sellDate) : spyNow;
    if (buy == null || end == null || buy <= 0) continue;
    wsum += leg.amount;
    wret += leg.amount * (end / buy - 1);
  }
  if (wsum <= 0) return null;
  return (wret / wsum) * 100;
}

function lastTradingDayOfMonth(
  rows: { date: string; value: number }[]
): { date: string; value: number }[] {
  const byMonth = new Map<string, { date: string; value: number }>();
  for (const r of rows) {
    byMonth.set(r.date.slice(0, 7), r);
  }
  const out = [...byMonth.values()].sort((a, b) => a.date.localeCompare(b.date));
  const last = rows[rows.length - 1];
  if (last && out[out.length - 1]?.date !== last.date) out.push(last);
  return out;
}

/** Days of daily-granularity history kept at the end of the nav series (for 1M/3M chart windows). */
const NAV_DAILY_TAIL_DAYS = 92;

/**
 * Monthly points for older history, daily points for the recent tail. Keeps the "All" view light
 * while giving the 1M/3M chart ranges enough resolution to be meaningful.
 */
function sampleNavRows(
  rows: { date: string; value: number }[]
): { date: string; value: number }[] {
  const last = rows[rows.length - 1];
  if (!last) return [];
  const cutoffDate = new Date(last.date + 'T12:00:00');
  cutoffDate.setDate(cutoffDate.getDate() - NAV_DAILY_TAIL_DAYS);
  const cutoff = cutoffDate.toISOString().slice(0, 10);

  const monthly = lastTradingDayOfMonth(rows.filter((r) => r.date < cutoff));
  const dailyTail = rows.filter((r) => r.date >= cutoff);
  const lastMonthly = monthly[monthly.length - 1];
  if (lastMonthly && dailyTail[0]?.date === lastMonthly.date) monthly.pop();
  return [...monthly, ...dailyTail];
}

interface BacktestResult {
  navHistory: NavHistoryRow[];
  returnPct: number | null;
  benchmarkPct: number | null;
  maxDrawdownPct: number | null;
  excludes: string[];
  alignedReturns: { port: number; spy: number }[];
  lastDailyIndex: number;
  /** Portfolio value (eligible tickers only) priced at the last daily bar's closes. */
  lastDailyValue: number;
  /** Tickers priced in the backtest; the live point must value the same set. */
  eligibleTickers: Set<string>;
  spyBase: number | null;
  lastHistoricalDate: string;
}

/**
 * Extend the monthly series with a live point.
 *
 * The index is re-based on the *value* of the last daily bar rather than on the day change, because
 * that bar already reflects the latest session (Yahoo returns a bar for the session in progress, and
 * on a weekend the last bar is Friday while `previousClose` is Thursday). Scaling the index by the
 * day change would therefore count the latest session's move twice. Comparing live value against
 * the last bar's value is correct mid-session, after hours, and on weekends alike.
 */
function appendLiveNavPoint(
  navHistory: NavHistoryRow[],
  ctx: {
    lastDailyIndex: number;
    lastDailyValue: number;
    liveValue: number;
    spyBase: number | null;
    liveBenchmarkPrice: number | null;
  }
): NavHistoryRow[] {
  if (ctx.lastDailyIndex <= 0 || !navHistory.length) return navHistory;
  if (ctx.lastDailyValue <= 0 || ctx.liveValue <= 0) return navHistory;

  // A single session cannot plausibly reprice the book this much. If it did, the backtested book and
  // the live book have diverged (missing price history, unrecorded trades) and extrapolating would
  // draw a wildly wrong point — better to end the series at the last real bar.
  const ratio = ctx.liveValue / ctx.lastDailyValue;
  if (ratio < 0.5 || ratio > 2) return navHistory;

  const today = new Date().toISOString().slice(0, 10);
  const last = navHistory[navHistory.length - 1]!;
  const liveIndex = ctx.lastDailyIndex * ratio;
  const benchCumulative =
    ctx.spyBase != null && ctx.spyBase > 0 && ctx.liveBenchmarkPrice != null
      ? (ctx.liveBenchmarkPrice / ctx.spyBase - 1) * 100
      : last.benchmarkReturnPct;

  const liveRow: NavHistoryRow = {
    date: today,
    portfolioValue: liveIndex,
    cumulativeReturnPct: (liveIndex - 1) * 100,
    benchmarkReturnPct: benchCumulative,
    isLive: true,
  };

  if (last.date === today) {
    return [...navHistory.slice(0, -1), liveRow];
  }
  if (last.date < today) {
    return [...navHistory, liveRow];
  }
  return navHistory;
}

/** Approximate current 3-month T-bill yield for Sharpe/Sortino (annualized %). */
const RISK_FREE_RATE_PCT = 4.5;
const TRADING_DAYS = 252;

function mean(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

function std(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const v = xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(Math.max(0, v));
}

function olsBetaAlpha(
  x: number[],
  y: number[]
): { beta: number; alpha: number; r2: number; correlation: number } {
  if (x.length < 5 || x.length !== y.length) {
    return { beta: 0, alpha: 0, r2: 0, correlation: 0 };
  }
  const mx = mean(x);
  const my = mean(y);
  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < x.length; i++) {
    const dx = x[i]! - mx;
    const dy = y[i]! - my;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  const n = x.length;
  cov /= n - 1;
  varX /= n - 1;
  varY /= n - 1;
  const beta = varX > 1e-18 ? cov / varX : 0;
  const alpha = my - beta * mx;
  const correlation = varX > 0 && varY > 0 ? cov / Math.sqrt(varX * varY) : 0;
  const r2 = correlation ** 2;
  return { beta, alpha, r2, correlation };
}

function historicalVar95(dailyReturns: number[]): number | null {
  if (dailyReturns.length < 20) return null;
  const sorted = [...dailyReturns].sort((a, b) => a - b);
  const idx = Math.floor(0.05 * sorted.length);
  return sorted[Math.max(0, idx)]! * 100;
}

function dailyReturnsFromCloses(
  history: { date: string; close: number }[],
  spyByDate: Map<string, number>
): { asset: number; spy: number }[] {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const out: { asset: number; spy: number }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    const spyPrev = spyByDate.get(prev.date);
    const spyCur = spyByDate.get(cur.date);
    if (prev.close <= 0 || spyPrev == null || spyCur == null || spyPrev <= 0) continue;
    out.push({
      asset: cur.close / prev.close - 1,
      spy: spyCur / spyPrev - 1,
    });
  }
  return out;
}

function computeConcentrationRisk(positions: PositionPerformance[]): {
  concentrationHhi: number;
  top3WeightPct: number;
  effectiveHoldings: number;
  largestSector: string | null;
  largestSectorWeightPct: number;
} {
  const weights = positions.map((p) => p.weightPct / 100);
  const concentrationHhi = weights.reduce((s, w) => s + w * w, 0);
  const sorted = [...positions].sort((a, b) => b.weightPct - a.weightPct);
  const top3WeightPct = sorted.slice(0, 3).reduce((s, p) => s + p.weightPct, 0);

  const sectorMap = new Map<string, number>();
  for (const p of positions) {
    sectorMap.set(p.sector, (sectorMap.get(p.sector) ?? 0) + p.weightPct);
  }
  let largestSector: string | null = null;
  let largestSectorWeightPct = 0;
  for (const [sector, w] of sectorMap) {
    if (w > largestSectorWeightPct) {
      largestSector = sector;
      largestSectorWeightPct = w;
    }
  }

  return {
    concentrationHhi,
    top3WeightPct,
    effectiveHoldings: concentrationHhi > 0 ? 1 / concentrationHhi : positions.length,
    largestSector,
    largestSectorWeightPct,
  };
}

function computePositionRisks(
  positions: PositionPerformance[],
  historyByTicker: Map<string, { date: string; close: number }[]>,
  benchmarkHistory: { date: string; close: number }[]
): PositionRisk[] {
  const spyByDate = new Map(
    [...benchmarkHistory].sort((a, b) => a.date.localeCompare(b.date)).map((p) => [p.date, p.close])
  );

  return positions.map((p) => {
    const hist = historyByTicker.get(p.ticker);
    if (!hist || hist.length < 10) {
      return { ticker: p.ticker, weightPct: p.weightPct, beta: null, annualizedVolPct: null };
    }
    const aligned = dailyReturnsFromCloses(hist, spyByDate);
    if (aligned.length < 20) {
      return { ticker: p.ticker, weightPct: p.weightPct, beta: null, annualizedVolPct: null };
    }
    const assetRets = aligned.map((r) => r.asset);
    const spyRets = aligned.map((r) => r.spy);
    const { beta } = olsBetaAlpha(spyRets, assetRets);
    return {
      ticker: p.ticker,
      weightPct: p.weightPct,
      beta,
      annualizedVolPct: std(assetRets) * Math.sqrt(TRADING_DAYS) * 100,
    };
  });
}

function computeRiskMetrics(
  alignedReturns: { port: number; spy: number }[],
  positions: PositionPerformance[],
  maxDrawdownPct: number | null,
  backtestReturnPct: number | null,
  historyByTicker: Map<string, { date: string; close: number }[]>,
  benchmarkHistory: { date: string; close: number }[]
): PortfolioRiskMetrics {
  const concentration = computeConcentrationRisk(positions);
  const positionRisks = computePositionRisks(positions, historyByTicker, benchmarkHistory);

  const emptyRisk: PortfolioRiskMetrics = {
    annualizedVolatilityPct: null,
    benchmarkVolatilityPct: null,
    beta: null,
    alphaAnnualPct: null,
    sharpeRatio: null,
    sortinoRatio: null,
    trackingErrorPct: null,
    correlationWithBenchmark: null,
    rSquared: null,
    var95DailyPct: null,
    calmarRatio: null,
    ...concentration,
    weightedBeta: null,
    positionRisks,
    observationDays: alignedReturns.length,
    riskFreeRatePct: RISK_FREE_RATE_PCT,
  };

  if (alignedReturns.length < 20) return emptyRisk;

  const portRets = alignedReturns.map((r) => r.port);
  const spyRets = alignedReturns.map((r) => r.spy);
  const activeRets = portRets.map((p, i) => p - spyRets[i]!);

  const portVol = std(portRets) * Math.sqrt(TRADING_DAYS);
  const spyVol = std(spyRets) * Math.sqrt(TRADING_DAYS);
  const { beta, alpha, r2, correlation } = olsBetaAlpha(spyRets, portRets);

  const years = alignedReturns.length / TRADING_DAYS;
  const totalReturn =
    backtestReturnPct != null
      ? backtestReturnPct / 100
      : portRets.reduce((acc, r) => acc * (1 + r), 1) - 1;
  const annualReturn =
    years > 0 ? (1 + totalReturn) ** (1 / years) - 1 : mean(portRets) * TRADING_DAYS;
  const rf = RISK_FREE_RATE_PCT / 100;

  // Textbook downside deviation: sqrt(mean(min(r, 0)^2)) over ALL observations,
  // not just losing days (dividing by losing days only overstates downside vol).
  const downsideDev =
    Math.sqrt(portRets.reduce((s, r) => s + Math.min(0, r) ** 2, 0) / portRets.length) *
    Math.sqrt(TRADING_DAYS);

  const sharpeRatio = portVol > 1e-8 ? (annualReturn - rf) / portVol : null;
  const sortinoRatio = downsideDev > 1e-8 ? (annualReturn - rf) / downsideDev : null;
  const maxDd = maxDrawdownPct != null ? Math.abs(maxDrawdownPct) / 100 : 0;
  const calmarRatio = maxDd > 1e-6 ? annualReturn / maxDd : null;

  const betasWithWeight = positionRisks.filter((p) => p.beta != null);
  const weightedBeta =
    betasWithWeight.length > 0
      ? betasWithWeight.reduce((s, p) => s + (p.weightPct / 100) * p.beta!, 0) /
        betasWithWeight.reduce((s, p) => s + p.weightPct / 100, 0)
      : beta;

  return {
    annualizedVolatilityPct: portVol * 100,
    benchmarkVolatilityPct: spyVol * 100,
    beta,
    alphaAnnualPct: alpha * TRADING_DAYS * 100,
    sharpeRatio,
    sortinoRatio,
    trackingErrorPct: std(activeRets) * Math.sqrt(TRADING_DAYS) * 100,
    correlationWithBenchmark: correlation,
    rSquared: r2,
    var95DailyPct: historicalVar95(portRets),
    calmarRatio,
    ...concentration,
    weightedBeta,
    positionRisks: positionRisks.sort((a, b) => b.weightPct - a.weightPct),
    observationDays: alignedReturns.length,
    riskFreeRatePct: RISK_FREE_RATE_PCT,
  };
}

/**
 * Time-weighted return of the ACTUAL share holdings over time, valued at real historical prices,
 * with daily cash-flow adjustment so buys/sells aren't counted as gains. Only tickers with both a
 * buy in history and price data are included (so flows are consistent); others are noted.
 */
function buildBacktest(
  holdings: HoldingRow[],
  transactions: TransactionRow[],
  historyByTicker: Map<string, { date: string; close: number }[]>,
  benchmarkHistory: { date: string; close: number }[],
  inceptionDate: string
): BacktestResult {
  const empty: BacktestResult = {
    navHistory: [],
    returnPct: null,
    benchmarkPct: null,
    maxDrawdownPct: null,
    excludes: [],
    alignedReturns: [],
    lastDailyIndex: 1,
    lastDailyValue: 0,
    eligibleTickers: new Set<string>(),
    spyBase: null,
    lastHistoricalDate: inceptionDate,
  };
  if (!benchmarkHistory.length) return empty;

  const buyTickers = new Set(
    transactions.filter((t) => t.type === 'buy' && t.ticker !== '—').map((t) => t.ticker)
  );

  // Eligible = has a buy we can track AND has price history.
  const closes = new Map<string, Map<string, number>>();
  const eligible = new Set<string>();
  for (const ticker of buyTickers) {
    const hist = historyByTicker.get(ticker);
    if (hist && hist.length) {
      closes.set(
        ticker,
        new Map(
          [...hist].sort((a, b) => a.date.localeCompare(b.date)).map((p) => [p.date, p.close])
        )
      );
      eligible.add(ticker);
    }
  }

  // Tickers in current holdings that we couldn't price (e.g. illiquid/manual) → note as excluded.
  const excludes = holdings
    .filter(
      (h) => h.ticker !== 'CASH' && h.ticker !== 'OTHER' && h.shares > 0 && !eligible.has(h.ticker)
    )
    .map((h) => h.ticker);

  if (!eligible.size) return { ...empty, excludes, eligibleTickers: eligible };

  const spy = [...benchmarkHistory].sort((a, b) => a.date.localeCompare(b.date));
  const spyClose = new Map(spy.map((p) => [p.date, p.close]));
  const calendar = spy.map((p) => p.date).filter((d) => d >= inceptionDate);

  // Share-change + cash-flow events for eligible tickers.
  const events = transactions
    .filter((t) => eligible.has(t.ticker) && (t.type === 'buy' || t.type === 'sell'))
    .map((t) => {
      const shares = t.shares ?? sharesFromTx(t);
      const amt = txAmount(t);
      return t.type === 'buy'
        ? { date: t.date, ticker: t.ticker, delta: shares, flow: amt }
        : { date: t.date, ticker: t.ticker, delta: -shares, flow: -amt };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const shares = new Map<string, number>();
  const lastClose = new Map<string, number>();
  let evIdx = 0;
  let prevValue: number | null = null;
  let index = 1;

  const daily: { date: string; index: number; value: number }[] = [];

  const lastCalendarDate = calendar[calendar.length - 1] ?? '';

  for (const date of calendar) {
    // Trades dated after the last price bar (a weekend/after-hours rebalance) still belong to the
    // book. Drain them on the final bar and price them at its closes; the flow adjustment keeps the
    // return neutral. Without this the whole trade is dropped and the backtest replays a stale book.
    const cutoff = date === lastCalendarDate ? '9999-12-31' : date;
    let flowToday = 0;
    while (evIdx < events.length && events[evIdx]!.date <= cutoff) {
      const e = events[evIdx]!;
      shares.set(e.ticker, (shares.get(e.ticker) ?? 0) + e.delta);
      flowToday += e.flow;
      evIdx++;
    }

    let value = 0;
    for (const ticker of eligible) {
      const c = closes.get(ticker)!.get(date) ?? lastClose.get(ticker);
      if (c == null) continue;
      lastClose.set(ticker, c);
      const sh = shares.get(ticker) ?? 0;
      if (sh > 1e-9) value += sh * c;
    }

    // Start the series only once there is a meaningful base (avoids dust-lot blow-ups).
    if (prevValue == null || prevValue < 1) {
      if (value >= 1) {
        prevValue = value;
        index = 1;
        daily.push({ date, index, value });
      }
      continue;
    }

    // Start-of-day flow convention: contributions earn the day's return (stable for small bases).
    const denom = prevValue + flowToday;
    if (denom > 0) {
      const r = value / denom - 1;
      index *= 1 + r;
      daily.push({ date, index, value });
    }
    prevValue = value;
  }

  if (daily.length < 2) return { ...empty, excludes, eligibleTickers: eligible };

  const startDate = daily[0]!.date;
  const spyBase = spyClose.get(startDate) ?? spy.find((p) => p.date >= startDate)?.close ?? null;

  let peak = daily[0]!.index;
  let maxDd = 0;
  for (const d of daily) {
    if (d.index > peak) peak = d.index;
    const dd = ((d.index - peak) / peak) * 100;
    if (dd < maxDd) maxDd = dd;
  }

  const sampled = sampleNavRows(daily.map((d) => ({ date: d.date, value: d.index })));
  const navHistory: NavHistoryRow[] = sampled.map((d) => {
    const spyC = spyClose.get(d.date) ?? null;
    return {
      date: d.date,
      portfolioValue: d.value,
      cumulativeReturnPct: (d.value - 1) * 100,
      benchmarkReturnPct:
        spyBase != null && spyC != null && spyBase > 0 ? (spyC / spyBase - 1) * 100 : 0,
    };
  });

  const lastDay = daily[daily.length - 1]!;
  const lastSpy = spyClose.get(lastDay.date) ?? spy[spy.length - 1]!.close;

  const alignedReturns: { port: number; spy: number }[] = [];
  for (let i = 1; i < daily.length; i++) {
    const portRet = daily[i]!.index / daily[i - 1]!.index - 1;
    const spyToday = spyClose.get(daily[i]!.date);
    const spyPrev = spyClose.get(daily[i - 1]!.date);
    if (spyToday != null && spyPrev != null && spyPrev > 0) {
      alignedReturns.push({ port: portRet, spy: spyToday / spyPrev - 1 });
    }
  }

  return {
    navHistory,
    returnPct: (lastDay.index - 1) * 100,
    benchmarkPct: spyBase != null && spyBase > 0 ? (lastSpy / spyBase - 1) * 100 : null,
    maxDrawdownPct: maxDd,
    excludes,
    alignedReturns,
    lastDailyIndex: lastDay.index,
    lastDailyValue: lastDay.value,
    eligibleTickers: eligible,
    spyBase,
    lastHistoricalDate: lastDay.date,
  };
}

export function enrichHoldingsWithCostBasis(
  holdings: HoldingRow[],
  avgCost: Map<string, { shares: number; totalCost: number }>
): HoldingRow[] {
  return holdings.map((h) => {
    if (h.costBasis > 0 || h.ticker === 'CASH' || h.ticker === 'OTHER') return h;
    const ac = avgCost.get(h.ticker);
    if (!ac || ac.shares <= 0) return h;
    return { ...h, costBasis: ac.totalCost / ac.shares };
  });
}

export function buildAvgCostMap(
  transactions: TransactionRow[]
): Map<string, { shares: number; totalCost: number }> {
  return computeLots(transactions).openAvgCost;
}

export function computePortfolioAnalytics(
  holdings: HoldingRow[],
  transactions: TransactionRow[],
  options: {
    benchmarkHistory: { date: string; close: number }[];
    holdingsHistory?: Map<string, { date: string; close: number }[]>;
    previousCloses?: QuoteMap;
    liveBenchmarkPrice?: number | null;
    statementValue?: number;
  }
): PortfolioAnalytics {
  const listed = holdings.filter((h) => h.ticker !== 'CASH' && h.ticker !== 'OTHER');
  const currentValue = listed.reduce((s, h) => s + h.marketValue, 0);
  const statementValue = options.statementValue ?? currentValue;

  const cashFlows = computeCashFlowTotals(transactions);
  const lots = computeLots(transactions);
  const holdingsWithCost = enrichHoldingsWithCostBasis(holdings, lots.openAvgCost);

  const positions: PositionPerformance[] = listed.map((h) => {
    const enriched = holdingsWithCost.find((x) => x.ticker === h.ticker) ?? h;
    const ac = lots.openAvgCost.get(h.ticker);
    const fifoAvg = ac && ac.shares > 0 ? ac.totalCost / ac.shares : 0;
    const avg = fifoAvg > 0 ? fifoAvg : enriched.costBasis > 0 ? enriched.costBasis : 0;

    const shareDrift =
      ac && ac.shares > 0 ? Math.abs(h.shares - ac.shares) / Math.max(h.shares, ac.shares) : 0;
    const trackedShares =
      ac && ac.shares > 0 && shareDrift > 0.001 ? Math.min(h.shares, ac.shares) : h.shares;
    const costTotal = avg > 0 ? avg * trackedShares : 0;
    const valueForReturn =
      trackedShares < h.shares && h.shares > 0
        ? h.marketValue * (trackedShares / h.shares)
        : h.marketValue;
    const unrealizedGain = costTotal > 0 ? valueForReturn - costTotal : 0;
    const unrealizedGainPct = costTotal > 0 ? (unrealizedGain / costTotal) * 100 : 0;

    const prevClose = options.previousCloses
      ? quotePriceForTicker(h.ticker, options.previousCloses)
      : null;
    const dayChangePct =
      prevClose != null && prevClose > 0 ? ((h.currentPrice - prevClose) / prevClose) * 100 : null;
    const dayChangeUsd =
      dayChangePct != null && prevClose != null ? (h.currentPrice - prevClose) * h.shares : null;

    return {
      ticker: h.ticker,
      name: h.name,
      sector: h.sector,
      shares: h.shares,
      avgCost: avg,
      currentPrice: h.currentPrice,
      marketValue: h.marketValue,
      weightPct: h.weightPct,
      unrealizedGain,
      unrealizedGainPct,
      dayChangePct,
      dayChangeUsd,
    };
  });

  const costedPositions = positions.filter((p) => p.avgCost > 0);
  const openCostBasis = costedPositions.reduce((s, p) => s + p.avgCost * p.shares, 0);
  const unrealizedGain = costedPositions.reduce((s, p) => s + p.unrealizedGain, 0);
  const unrealizedGainPct = openCostBasis > 0 ? (unrealizedGain / openCostBasis) * 100 : 0;

  const realizedGain = lots.realizedGain;
  const realizedReturnPct =
    lots.trackedClosedCost > 0 ? (realizedGain / lots.trackedClosedCost) * 100 : null;
  const totalCostDeployed = openCostBasis + lots.trackedClosedCost;
  const totalGain = unrealizedGain + realizedGain + cashFlows.totalDividends;

  const moneyWeightedReturnPct = totalCostDeployed > 0 ? (totalGain / totalCostDeployed) * 100 : 0;
  const moneyWeightedReturnExDivPct =
    totalCostDeployed > 0 ? ((unrealizedGain + realizedGain) / totalCostDeployed) * 100 : 0;

  const benchmarkReturnPct = moneyWeightedBenchmark(lots.legs, options.benchmarkHistory);
  const alphaPct =
    benchmarkReturnPct != null ? moneyWeightedReturnExDivPct - benchmarkReturnPct : null;

  const dividendYieldPct = currentValue > 0 ? (cashFlows.totalDividends / currentValue) * 100 : 0;

  // Day change at the portfolio level.
  let dayChangeUsd: number | null = null;
  let dayChangePct: number | null = null;
  const dayParts = positions.filter((p) => p.dayChangeUsd != null);
  if (dayParts.length) {
    dayChangeUsd = dayParts.reduce((s, p) => s + (p.dayChangeUsd ?? 0), 0);
    const prevValue = currentValue - dayChangeUsd;
    dayChangePct = prevValue > 0 ? (dayChangeUsd / prevValue) * 100 : null;
  }

  const sortedTx = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  const inceptionDate = sortedTx[0]?.date ?? new Date().toISOString().slice(0, 10);
  const backtest = buildBacktest(
    holdingsWithCost,
    transactions,
    options.holdingsHistory ?? new Map(),
    options.benchmarkHistory,
    inceptionDate
  );

  // Value the same ticker set the backtest priced, so the live ratio isn't skewed by holdings
  // the backtest had to exclude.
  const liveValue = positions
    .filter((p) => backtest.eligibleTickers.has(p.ticker))
    .reduce((s, p) => s + p.marketValue, 0);

  const navHistory =
    options.liveBenchmarkPrice != null && dayChangeUsd != null
      ? appendLiveNavPoint(backtest.navHistory, {
          lastDailyIndex: backtest.lastDailyIndex,
          lastDailyValue: backtest.lastDailyValue,
          liveValue,
          spyBase: backtest.spyBase,
          liveBenchmarkPrice: options.liveBenchmarkPrice,
        })
      : backtest.navHistory;

  const sortedByReturn = [...positions]
    .filter((p) => p.avgCost > 0)
    .sort((a, b) => b.unrealizedGainPct - a.unrealizedGainPct);

  const trackedClosed = lots.closedTrades.filter((t) => t.tracked);
  const winners = trackedClosed.filter((t) => t.gain > 0).length;
  const winRatePct = trackedClosed.length > 0 ? (winners / trackedClosed.length) * 100 : null;

  const depositsComplete = cashFlows.netDeposits >= cashFlows.totalBuyVolume * 0.8;

  const risk = computeRiskMetrics(
    backtest.alignedReturns,
    positions,
    backtest.maxDrawdownPct,
    backtest.returnPct,
    options.holdingsHistory ?? new Map(),
    options.benchmarkHistory
  );

  return {
    inceptionDate,
    currentValue,
    statementValue,
    dayChangeUsd,
    dayChangePct,
    ...cashFlows,
    depositsComplete,
    openCostBasis,
    totalCostDeployed,
    unrealizedGain,
    unrealizedGainPct,
    realizedGain,
    realizedReturnPct,
    totalGain,
    moneyWeightedReturnPct,
    moneyWeightedReturnExDivPct,
    benchmarkReturnPct,
    alphaPct,
    dividendYieldPct,
    navHistory,
    backtestReturnPct: backtest.returnPct,
    backtestBenchmarkPct: backtest.benchmarkPct,
    backtestExcludes: backtest.excludes,
    maxDrawdownPct: backtest.maxDrawdownPct,
    positions,
    topPerformers: sortedByReturn.slice(0, 3),
    bottomPerformers: [...sortedByReturn].reverse().slice(0, 3),
    closedTrades: lots.closedTrades.sort((a, b) => b.sellDate.localeCompare(a.sellDate)),
    winRatePct,
    tradeCount: trackedClosed.length,
    untrackedSellCount: lots.untrackedSellCount,
    risk,
  };
}

export function analyticsToSummary(analytics: PortfolioAnalytics) {
  return {
    totalValue: analytics.currentValue,
    listedHoldingsValue: analytics.currentValue,
    holdingsCoveragePct: 100,
    totalCostBasis: analytics.openCostBasis,
    costBasisAvailable: analytics.positions.some((p) => p.avgCost > 0),
    unrealizedGain: analytics.unrealizedGain,
    unrealizedGainPct: analytics.unrealizedGainPct,
    ytdReturnPct: null,
    inceptionReturnPct: analytics.moneyWeightedReturnPct,
    benchmarkYtdReturnPct: null,
    benchmarkInceptionReturnPct: analytics.benchmarkReturnPct,
    alphaSinceInceptionPct: analytics.alphaPct,
    maxDrawdownPct: analytics.maxDrawdownPct,
  };
}

/** Yahoo symbols for every ticker ever bought (for the historical backtest fetches). */
export function backtestSymbols(
  transactions: TransactionRow[]
): { ticker: string; symbol: string }[] {
  const seen = new Set<string>();
  const out: { ticker: string; symbol: string }[] = [];
  for (const tx of transactions) {
    if (tx.type !== 'buy' || tx.ticker === '—' || seen.has(tx.ticker)) continue;
    seen.add(tx.ticker);
    const symbol = toYahooSymbol(tx.ticker);
    if (symbol) out.push({ ticker: tx.ticker, symbol });
  }
  return out;
}
