/**
 * Rebalance the imaginary $100K model portfolio: exit the speculative sleeve
 * (EOSE, OKLO, RVI), de-concentrate Citigroup/Financials, add bonds + three
 * diversifiers (USMV, GLD, VOX), and scale the whole book to $100,000.
 * Writes holdings.csv, appends synthetic sell/buy/deposit transactions, and
 * updates meta.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fetchYahooQuotes } from '../lib/yahooQuotes.ts';
import {
  parseHoldingsCsv,
  parseTransactionsCsv,
  type HoldingRow,
  type TransactionRow,
} from '../src/utils/parsePersonalPortfolioCsv.ts';
import {
  serializeHoldingsCsv,
  serializeTransactionsCsv,
} from '../src/utils/rebuildHoldingsFromTransactions.ts';
import { writePortfolioMetaFile } from './portfolioMetaFile.ts';

const base = resolve(process.cwd(), 'public/data/personal-portfolio');
const REBALANCE_DATE = '2026-08-15';
const TOTAL_TARGET = 100_000;

const EXIT_TICKERS = ['EOSE', 'OKLO', 'RVI'];

const TARGETS: Record<string, { weightPct: number; name: string; sector: string }> = {
  VOO: { weightPct: 11.0, name: 'Vanguard S&P 500 ETF', sector: 'US Equity' },
  QQQ: { weightPct: 2.0, name: 'Invesco QQQ Trust', sector: 'US Equity' },
  USMV: { weightPct: 5.5, name: 'iShares MSCI USA Min Vol Factor ETF', sector: 'US Equity' },
  BND: { weightPct: 10.0, name: 'Vanguard Total Bond Market ETF', sector: 'Fixed Income' },
  GOVT: { weightPct: 6.5, name: 'iShares U.S. Treasury Bond ETF', sector: 'Fixed Income' },
  VTIP: { weightPct: 2.5, name: 'Vanguard Short-Term TIPS ETF', sector: 'Fixed Income' },
  VEA: { weightPct: 9.0, name: 'Vanguard FTSE Developed Markets ETF', sector: 'International' },
  VWO: { weightPct: 4.5, name: 'Vanguard FTSE Emerging Markets ETF', sector: 'International' },
  TSM: { weightPct: 2.5, name: 'Taiwan Semiconductor', sector: 'International' },
  CGW: { weightPct: 2.0, name: 'Invesco S&P Global Water ETF', sector: 'Thematic' },
  C: { weightPct: 5.0, name: 'Citigroup', sector: 'Financials' },
  JPM: { weightPct: 5.0, name: 'JPMorgan Chase', sector: 'Financials' },
  AXP: { weightPct: 5.0, name: 'American Express', sector: 'Financials' },
  NOC: { weightPct: 4.0, name: 'Northrop Grumman', sector: 'Industrials' },
  UNH: { weightPct: 3.0, name: 'UnitedHealth Group', sector: 'Healthcare' },
  LLY: { weightPct: 3.0, name: 'Eli Lilly', sector: 'Healthcare' },
  PG: { weightPct: 2.5, name: 'Procter & Gamble', sector: 'Consumer Staples' },
  NEE: { weightPct: 2.0, name: 'NextEra Energy', sector: 'Utilities' },
  CEG: { weightPct: 1.5, name: 'Constellation Energy', sector: 'Utilities' },
  PLD: { weightPct: 2.5, name: 'Prologis', sector: 'Real Estate' },
  PHO: { weightPct: 2.0, name: 'Invesco Water Resources ETF', sector: 'Thematic' },
  NVDA: { weightPct: 2.5, name: 'NVIDIA', sector: 'Technology' },
  GLD: { weightPct: 4.0, name: 'SPDR Gold Shares', sector: 'Commodities' },
  VOX: { weightPct: 2.5, name: 'Vanguard Communication Services ETF', sector: 'Communication Services' },
};

const targetSum = Object.values(TARGETS).reduce((s, t) => s + t.weightPct, 0);
if (Math.abs(targetSum - 100) > 0.01) {
  throw new Error(`Target weights sum to ${targetSum}, expected 100`);
}

function roundShares(shares: number): number {
  return Math.round(shares * 1e5) / 1e5;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

const existingHoldings = parseHoldingsCsv(readFileSync(resolve(base, 'holdings.csv'), 'utf8'));
const existingByTicker = new Map(existingHoldings.map((h) => [h.ticker, h]));
const existingTx = parseTransactionsCsv(readFileSync(resolve(base, 'transactions.csv'), 'utf8'));

for (const ticker of EXIT_TICKERS) {
  if (!existingByTicker.has(ticker)) throw new Error(`Expected to hold ${ticker} before exiting it`);
}

const allTickers = [...new Set([...Object.keys(TARGETS), ...EXIT_TICKERS])];
const { quotes } = await fetchYahooQuotes(allTickers);

function price(ticker: string): number {
  const p = quotes[ticker];
  if (p == null || !Number.isFinite(p)) throw new Error(`No quote for ${ticker}`);
  return p;
}

let cashIn = 0;
let cashOut = 0;
const sellTx: TransactionRow[] = [];
const buyTx: TransactionRow[] = [];

for (const ticker of EXIT_TICKERS) {
  const existing = existingByTicker.get(ticker)!;
  const p = price(ticker);
  const proceeds = roundMoney(existing.shares * p);
  cashIn += proceeds;
  sellTx.push({
    date: REBALANCE_DATE,
    type: 'sell',
    ticker,
    shares: existing.shares,
    price: p,
    amount: -proceeds,
    notes: 'Rebalance — exit speculative sleeve',
  });
}

const finalRows: HoldingRow[] = [];

for (const [ticker, meta] of Object.entries(TARGETS)) {
  const existing = existingByTicker.get(ticker);
  const p = price(ticker);
  const oldShares = existing?.shares ?? 0;
  const oldCostBasis = existing?.costBasis ?? 0;
  const oldValue = oldShares * p;
  const targetValue = (meta.weightPct / 100) * TOTAL_TARGET;
  const deltaValue = targetValue - oldValue;

  let finalShares = oldShares;
  let finalCostBasis = oldCostBasis;

  if (deltaValue > 0.01) {
    const addedShares = roundShares(deltaValue / p);
    const cost = roundMoney(addedShares * p);
    cashOut += cost;
    buyTx.push({
      date: REBALANCE_DATE,
      type: 'buy',
      ticker,
      shares: addedShares,
      price: p,
      amount: -cost,
      notes: existing ? 'Rebalance — top up to target weight' : 'Rebalance — new diversifier',
    });
    finalShares = oldShares + addedShares;
    finalCostBasis =
      finalShares > 0 ? (oldShares * oldCostBasis + addedShares * p) / finalShares : p;
  } else if (deltaValue < -0.01) {
    const trimmedShares = roundShares(Math.min(oldShares, -deltaValue / p));
    const proceeds = roundMoney(trimmedShares * p);
    cashIn += proceeds;
    sellTx.push({
      date: REBALANCE_DATE,
      type: 'sell',
      ticker,
      shares: trimmedShares,
      price: p,
      amount: -proceeds,
      notes: 'Rebalance — trim to target weight',
    });
    finalShares = oldShares - trimmedShares;
    // avg cost basis is unchanged by a partial sell
  }

  const marketValue = roundMoney(finalShares * p);
  finalRows.push({
    ticker,
    name: meta.name,
    shares: finalShares,
    costBasis: roundMoney(finalCostBasis),
    currentPrice: p,
    marketValue,
    weightPct: 0,
    sector: meta.sector,
  });
}

const depositAmount = roundMoney(cashOut - cashIn);
if (depositAmount <= 0) {
  throw new Error(`Expected a net new deposit, got ${depositAmount}`);
}

const depositTx: TransactionRow = {
  date: REBALANCE_DATE,
  type: 'deposit',
  ticker: '—',
  shares: null,
  price: null,
  amount: depositAmount,
  notes: 'Rebalance — new capital to reach $100K model portfolio',
};

const sortedRows = [...finalRows].sort(
  (a, b) => b.marketValue - a.marketValue || a.ticker.localeCompare(b.ticker)
);
const marketSum = sortedRows.reduce((s, h) => s + h.marketValue, 0);
for (const h of sortedRows) {
  h.weightPct = roundMoney((h.marketValue / marketSum) * 100);
}

const newTx: TransactionRow[] = [depositTx, ...sellTx, ...buyTx];
const mergedTx = [...newTx, ...existingTx];

writeFileSync(resolve(base, 'holdings.csv'), serializeHoldingsCsv(sortedRows));
writeFileSync(resolve(base, 'transactions.csv'), serializeTransactionsCsv(mergedTx));

writePortfolioMetaFile({
  asOf: REBALANCE_DATE,
  asOfDisplay: 'August 15, 2026',
  syncedAt: new Date().toISOString(),
  holdingCount: sortedRows.length,
  transactionCount: mergedTx.length,
});

console.log('Rebalance applied');
console.log('  Sold (exits):', EXIT_TICKERS.join(', '));
console.log('  Cash in (sells):', roundMoney(cashIn));
console.log('  Cash out (buys):', roundMoney(cashOut));
console.log('  New deposit:', depositAmount);
console.log('  Final total:', roundMoney(marketSum), `(${sortedRows.length} positions)`);
console.log('');
console.log('Final weights:');
for (const h of sortedRows) {
  console.log(`  ${h.ticker.padEnd(6)} ${h.weightPct.toFixed(2)}%  $${h.marketValue.toFixed(2)}`);
}
