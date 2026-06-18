/**
 * Independent audit of Current book metrics.
 * Usage: npx tsx scripts/auditCurrentBook.mts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fetchYahooQuotes } from '../lib/yahooQuotes.ts';
import {
  parseHoldingsCsv,
  parseTransactionsCsv,
  normalizeHoldingsWeights,
} from '../src/utils/parsePersonalPortfolioCsv.ts';
import {
  buildAvgCostMap,
  computePortfolioAnalytics,
  enrichHoldingsWithCostBasis,
  backtestSymbols,
} from '../src/utils/computePortfolioAnalytics.ts';
import { mergeLiveQuotesIntoHoldings } from '../src/utils/applyLiveQuotes.ts';
import { indexEtfWeightPct } from '../src/utils/portfolioDisplay.ts';
import { fetchYahooChartHistory } from '../lib/yahooQuotes.ts';
import { quotableTickers, quotePriceForTicker } from '../src/utils/yahooSymbols.ts';

const base = resolve(process.cwd(), 'public/data/personal-portfolio');
const holdingsRaw = normalizeHoldingsWeights(
  parseHoldingsCsv(readFileSync(resolve(base, 'holdings.csv'), 'utf8'))
);
const transactions = parseTransactionsCsv(readFileSync(resolve(base, 'transactions.csv'), 'utf8'));

const tickers = holdingsRaw.map((h) => h.ticker);
const { quotes, previousCloses } = await fetchYahooQuotes(quotableTickers(tickers));
const { holdings } = mergeLiveQuotesIntoHoldings(holdingsRaw, quotes);

const openLots = buildAvgCostMap(transactions);
const listed = holdings.filter((h) => h.ticker !== 'CASH' && h.ticker !== 'OTHER');

console.log('=== Share & cost basis audit ===');
let issues = 0;
for (const h of listed) {
  const lot = openLots.get(h.ticker);
  const fifoShares = lot?.shares ?? 0;
  const fifoAvg = lot && lot.shares > 0 ? lot.totalCost / lot.shares : 0;
  const shareDiff = Math.abs(h.shares - fifoShares);
  const costDiff = h.costBasis > 0 && fifoAvg > 0 ? Math.abs(h.costBasis - fifoAvg) : 0;

  if (shareDiff > 0.0001) {
    console.log(`  SHARE MISMATCH ${h.ticker}: holdings=${h.shares} fifo=${fifoShares.toFixed(8)}`);
    issues++;
  }
  if (costDiff > 0.05) {
    console.log(
      `  COST MISMATCH ${h.ticker}: csv=${h.costBasis.toFixed(2)} fifo=${fifoAvg.toFixed(2)}`
    );
    issues++;
  }
}

console.log('\n=== Per-position (live prices) ===');
let manualCost = 0;
let manualValue = 0;
let manualDayUsd = 0;
let manualPrevValue = 0;

for (const h of listed) {
  const lot = openLots.get(h.ticker);
  const fifoAvg = lot && lot.shares > 0 ? lot.totalCost / lot.shares : 0;
  const avg = fifoAvg > 0 ? fifoAvg : h.costBasis > 0 ? h.costBasis : 0;
  const shareDrift =
    lot && lot.shares > 0 ? Math.abs(h.shares - lot.shares) / Math.max(h.shares, lot.shares) : 0;
  const trackedShares =
    lot && lot.shares > 0 && shareDrift > 0.001 ? Math.min(h.shares, lot.shares) : h.shares;
  const costTotal = avg * trackedShares;
  const valueForReturn =
    trackedShares < h.shares && h.shares > 0
      ? h.marketValue * (trackedShares / h.shares)
      : h.marketValue;
  const gain = valueForReturn - costTotal;
  const gainPct = costTotal > 0 ? (gain / costTotal) * 100 : 0;
  manualCost += costTotal;
  manualValue += h.marketValue;

  const prev = quotePriceForTicker(h.ticker, previousCloses);
  const dayUsd = prev != null ? (h.currentPrice - prev) * h.shares : null;
  if (dayUsd != null) {
    manualDayUsd += dayUsd;
    manualPrevValue += prev * h.shares;
  }

  console.log(
    `  ${h.ticker.padEnd(5)} sh=${h.shares.toFixed(5)} $${h.currentPrice.toFixed(2)} mv=$${h.marketValue.toFixed(2)} wt=${h.weightPct.toFixed(2)}% avg=$${avg.toFixed(2)} ret=${gainPct.toFixed(2)}%`
  );
}

const manualUnrealPct = manualCost > 0 ? ((manualValue - manualCost) / manualCost) * 100 : 0;
const weightSum = listed.reduce((s, h) => s + h.weightPct, 0);
const indexManual = indexEtfWeightPct(listed);
const manualDayPct = manualPrevValue > 0 ? (manualDayUsd / manualPrevValue) * 100 : null;

console.log('\n=== Manual totals ===');
console.log('  Market value:', manualValue.toFixed(2));
console.log('  Cost basis:', manualCost.toFixed(2));
console.log('  Unrealized return:', manualUnrealPct.toFixed(2), '%');
console.log('  Today:', manualDayPct?.toFixed(2) ?? 'n/a', '%');
console.log('  Weight sum:', weightSum.toFixed(2), '%');
console.log('  Index ETFs:', indexManual.toFixed(2), '%');

const sortedTx = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
const inception = sortedTx[0]?.date ?? '2024-01-01';
const range = inception < '2024-06-01' ? 'max' : '2y';
const spy = await fetchYahooChartHistory('SPY', range as '2y' | 'max');
const historyByTicker = new Map<string, { date: string; close: number }[]>();
for (const { ticker, symbol } of backtestSymbols(transactions)) {
  try {
    historyByTicker.set(ticker, await fetchYahooChartHistory(symbol, range as '2y' | 'max'));
  } catch {
    /* skip */
  }
}

const a = computePortfolioAnalytics(holdings, transactions, {
  benchmarkHistory: spy,
  holdingsHistory: historyByTicker,
  previousCloses,
});

console.log('\n=== Analytics engine ===');
console.log('  Unrealized return:', a.unrealizedGainPct.toFixed(2), '%');
console.log('  Today:', a.dayChangePct?.toFixed(2) ?? 'n/a', '%');
console.log('  Positions:', a.positions.length);
console.log('  Index ETFs:', indexEtfWeightPct(a.positions).toFixed(2), '%');
console.log('  Effective holdings:', a.risk.effectiveHoldings.toFixed(2));
console.log('  Beta:', a.risk.beta?.toFixed(2) ?? 'n/a');

console.log('\n=== Diff (engine vs manual) ===');
const dUnreal = Math.abs(a.unrealizedGainPct - manualUnrealPct);
const dIndex = Math.abs(indexEtfWeightPct(a.positions) - indexManual);
console.log('  Unrealized delta:', dUnreal.toFixed(4), '%');
console.log('  Index ETF delta:', dIndex.toFixed(4), '%');
if (a.dayChangePct != null && manualDayPct != null) {
  console.log('  Today delta:', Math.abs(a.dayChangePct - manualDayPct).toFixed(4), '%');
}

if (issues === 0 && dUnreal < 0.01 && dIndex < 0.01) {
  console.log('\nOK — Current book numbers match independent replay.');
} else {
  console.log('\nISSUES FOUND — see above.');
  process.exitCode = 1;
}
