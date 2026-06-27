/**
 * Apply the blended model portfolio (held Robinhood sleeve + new-money sleeve).
 * Writes holdings.csv and appends synthetic transactions for the new tranche.
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
const AS_OF = '2026-06-26';

const HELD_SHARES: Record<
  string,
  { shares: number; costBasis: number; name: string; sector: string }
> = {
  VOO: { shares: 0.0872, costBasis: 573.39, name: 'Vanguard S&P 500 ETF', sector: 'US Equity' },
  C: { shares: 0.37442, costBasis: 69.15, name: 'Citigroup', sector: 'Financials' },
  JPM: { shares: 0.07952, costBasis: 314.39, name: 'JPMorgan Chase', sector: 'Financials' },
  AXP: { shares: 0.07748, costBasis: 258.13, name: 'American Express', sector: 'Financials' },
  NOC: { shares: 0.0448, costBasis: 603.77, name: 'Northrop Grumman', sector: 'Industrials' },
  NVDA: { shares: 0.09369, costBasis: 162.66, name: 'NVIDIA', sector: 'Technology' },
  EOSE: { shares: 2.42857, costBasis: 6.09, name: 'Eos Energy Enterprises', sector: 'Energy' },
  OKLO: { shares: 0.21699, costBasis: 46.09, name: 'Oklo', sector: 'Energy' },
  VTIP: {
    shares: 0.19916,
    costBasis: 50.21,
    name: 'Vanguard Short-Term TIPS ETF',
    sector: 'Fixed Income',
  },
  QQQ: { shares: 0.01227, costBasis: 720.69, name: 'Invesco QQQ Trust', sector: 'US Equity' },
  RVI: { shares: 0.16129, costBasis: 62.0, name: 'Robinhood Ventures Fund I', sector: 'Private Markets' },
};

/** Target weight (% of total portfolio) for new-money sleeve positions. */
const NEW_TARGETS: Record<
  string,
  { weightPct: number; name: string; sector: string }
> = {
  VEA: { weightPct: 9.0, name: 'Vanguard FTSE Developed Markets ETF', sector: 'International' },
  BND: { weightPct: 8.0, name: 'Vanguard Total Bond Market ETF', sector: 'Fixed Income' },
  GOVT: { weightPct: 5.0, name: 'iShares U.S. Treasury Bond ETF', sector: 'Fixed Income' },
  VWO: { weightPct: 4.5, name: 'Vanguard FTSE Emerging Markets ETF', sector: 'International' },
  UNH: { weightPct: 3.0, name: 'UnitedHealth Group', sector: 'Healthcare' },
  LLY: { weightPct: 3.0, name: 'Eli Lilly', sector: 'Healthcare' },
  NEE: { weightPct: 3.0, name: 'NextEra Energy', sector: 'Utilities' },
  TSM: { weightPct: 3.0, name: 'Taiwan Semiconductor', sector: 'International' },
  PLD: { weightPct: 2.5, name: 'Prologis', sector: 'Real Estate' },
  PG: { weightPct: 2.5, name: 'Procter & Gamble', sector: 'Consumer Staples' },
  CEG: { weightPct: 2.5, name: 'Constellation Energy', sector: 'Utilities' },
  PHO: { weightPct: 2.0, name: 'Invesco Water Resources ETF', sector: 'Thematic' },
  CGW: { weightPct: 2.0, name: 'Invesco S&P Global Water ETF', sector: 'Thematic' },
};

const allTickers = [...Object.keys(HELD_SHARES), ...Object.keys(NEW_TARGETS)];
const { quotes } = await fetchYahooQuotes(allTickers);

function price(ticker: string): number {
  const p = quotes[ticker];
  if (p == null || !Number.isFinite(p)) throw new Error(`No quote for ${ticker}`);
  return p;
}

function roundShares(shares: number): number {
  return Math.round(shares * 1e5) / 1e5;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

const heldRows: HoldingRow[] = Object.entries(HELD_SHARES).map(([ticker, meta]) => {
  const currentPrice = price(ticker);
  const marketValue = roundMoney(meta.shares * currentPrice);
  return {
    ticker,
    name: meta.name,
    shares: meta.shares,
    costBasis: meta.costBasis,
    currentPrice,
    marketValue,
    weightPct: 0,
    sector: meta.sector,
  };
});

const heldTotal = heldRows.reduce((s, h) => s + h.marketValue, 0);
const portfolioTotal = roundMoney(heldTotal * 2);

const newRows: HoldingRow[] = Object.entries(NEW_TARGETS).map(([ticker, meta]) => {
  const targetValue = roundMoney((meta.weightPct / 100) * portfolioTotal);
  const currentPrice = price(ticker);
  const shares = roundShares(targetValue / currentPrice);
  const marketValue = roundMoney(shares * currentPrice);
  return {
    ticker,
    name: meta.name,
    shares,
    costBasis: currentPrice,
    currentPrice,
    marketValue,
    weightPct: 0,
    sector: meta.sector,
  };
});

const allRows = [...heldRows, ...newRows].sort(
  (a, b) => b.marketValue - a.marketValue || a.ticker.localeCompare(b.ticker)
);

const marketSum = allRows.reduce((s, h) => s + h.marketValue, 0);
for (const h of allRows) {
  h.weightPct = roundMoney((h.marketValue / marketSum) * 100);
}

const existingTx = parseTransactionsCsv(readFileSync(resolve(base, 'transactions.csv'), 'utf8'));

const newTrancheTotal = newRows.reduce((s, h) => s + h.marketValue, 0);
const newTx: TransactionRow[] = [
  {
    date: AS_OF,
    type: 'deposit',
    ticker: '—',
    shares: null,
    price: null,
    amount: roundMoney(newTrancheTotal),
    notes: 'Model portfolio — new-money sleeve (50/50 blend)',
  },
  ...newRows.map((h) => ({
    date: AS_OF,
    type: 'buy' as const,
    ticker: h.ticker,
    shares: h.shares,
    price: h.currentPrice,
    amount: -h.marketValue,
    notes: 'Model portfolio — lump-sum entry',
  })),
];

const mergedTx = [...newTx, ...existingTx];

writeFileSync(resolve(base, 'holdings.csv'), serializeHoldingsCsv(allRows));
writeFileSync(resolve(base, 'transactions.csv'), serializeTransactionsCsv(mergedTx));

writePortfolioMetaFile({
  asOf: AS_OF,
  asOfDisplay: 'June 26, 2026',
  syncedAt: new Date().toISOString(),
  holdingCount: allRows.length,
  transactionCount: mergedTx.length,
});

console.log('Model portfolio applied');
console.log('  Held sleeve:', roundMoney(heldTotal), `(${allRows.filter((h) => h.ticker in HELD_SHARES).length} positions)`);
console.log('  New sleeve:', roundMoney(newTrancheTotal), `(${newRows.length} positions)`);
console.log('  Total:', roundMoney(marketSum), `(${allRows.length} positions)`);
console.log('');
console.log('Top weights:');
for (const h of allRows.slice(0, 8)) {
  console.log(`  ${h.ticker.padEnd(5)} ${h.weightPct.toFixed(2)}%  $${h.marketValue.toFixed(2)}`);
}
