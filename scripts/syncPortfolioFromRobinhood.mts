/**
 * Merge a Robinhood account activity CSV into site portfolio data.
 *
 * Usage:
 *   npm run sync:portfolio -- --export path/to/robinhood-activity.csv
 *   npm run sync:portfolio -- --export path/to/robinhood-activity.csv --write
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  parseHoldingsCsv,
  parseTransactionsCsv,
} from '../src/utils/parsePersonalPortfolioCsv.ts';
import { parseRobinhoodActivityCsv } from '../src/utils/robinhoodActivityCsv.ts';
import { mergePortfolioTransactions } from '../src/utils/mergePortfolioTransactions.ts';
import {
  rebuildHoldingsFromTransactions,
  serializeHoldingsCsv,
  serializeTransactionsCsv,
} from '../src/utils/rebuildHoldingsFromTransactions.ts';
import { computePortfolioAnalytics, backtestSymbols } from '../src/utils/computePortfolioAnalytics.ts';
import { fetchYahooChartHistory } from '../lib/yahooQuotes.ts';
import {
  portfolioAsOfFromTransactions,
  writePortfolioMetaFile,
} from './portfolioMetaFile.ts';

const base = resolve(process.cwd(), 'public/data/personal-portfolio');

function argValue(flag: string): string | null {
  const idx = process.argv.indexOf(flag);
  if (idx < 0 || idx + 1 >= process.argv.length) return null;
  return process.argv[idx + 1] ?? null;
}

const exportPath = argValue('--export');
const write = process.argv.includes('--write');

if (!exportPath) {
  console.error('Usage: npm run sync:portfolio -- --export <robinhood-activity.csv> [--write]');
  process.exit(1);
}

const exportFile = resolve(process.cwd(), exportPath);
const incoming = parseRobinhoodActivityCsv(readFileSync(exportFile, 'utf8'));
const existing = parseTransactionsCsv(readFileSync(resolve(base, 'transactions.csv'), 'utf8'));
const previousHoldings = parseHoldingsCsv(readFileSync(resolve(base, 'holdings.csv'), 'utf8'));

const { merged, added } = mergePortfolioTransactions(existing, incoming);
const holdings = await rebuildHoldingsFromTransactions(merged, previousHoldings);

const sortedTx = [...merged].sort((a, b) => a.date.localeCompare(b.date));
const inception = sortedTx[0]?.date ?? 'unknown';
const range = inception.startsWith('2023') || inception < '2024-06-01' ? 'max' : '2y';

const spy = await fetchYahooChartHistory('SPY', range as '2y' | 'max');
const historyByTicker = new Map<string, { date: string; close: number }[]>();
for (const { ticker, symbol } of backtestSymbols(merged)) {
  try {
    historyByTicker.set(ticker, await fetchYahooChartHistory(symbol, range as '2y' | 'max'));
  } catch {
    console.warn(`  skip history: ${ticker}`);
  }
}

const analytics = computePortfolioAnalytics(holdings, merged, {
  benchmarkHistory: spy,
  holdingsHistory: historyByTicker,
});

console.log('Portfolio sync preview');
console.log('======================');
console.log('Robinhood export:', exportFile);
console.log('Parsed rows:', incoming.length);
console.log('New transactions:', added.length);
console.log('Total transactions:', merged.length);
console.log('Open positions:', holdings.length);
console.log('');
console.log('Sanity check');
console.log('  Unrealized return:', analytics.unrealizedGainPct.toFixed(2), '%');
console.log('  Untracked sells:', analytics.untrackedSellCount);
console.log('');

if (added.length) {
  console.log('New activity:');
  for (const tx of added.slice(0, 10)) {
    console.log(`  ${tx.date}  ${tx.type.padEnd(10)}  ${tx.ticker}`);
  }
  if (added.length > 10) console.log(`  … and ${added.length - 10} more`);
  console.log('');
}

if (analytics.untrackedSellCount > 0) {
  console.warn(
    'Warning: untracked sells remain — export a longer date range or add missing buys manually.'
  );
}

if (!write) {
  console.log('Dry run only. Re-run with --write to update CSV files.');
  console.log('');
  console.log('Next: npm run sync:portfolio -- --export', exportPath, '--write');
  console.log('      npm run verify:portfolio');
  process.exit(0);
}

writeFileSync(resolve(base, 'transactions.csv'), serializeTransactionsCsv(merged), 'utf8');
writeFileSync(resolve(base, 'holdings.csv'), serializeHoldingsCsv(holdings), 'utf8');

const listed = holdings.filter((h) => h.ticker !== 'CASH' && h.ticker !== 'OTHER');
writePortfolioMetaFile({
  asOf: portfolioAsOfFromTransactions(merged.map((row) => row.date)),
  syncedAt: new Date().toISOString(),
  transactionCount: merged.length,
  holdingCount: listed.length,
  verifyPassed: false,
  verifyWarnings: ['verify_stale'],
});

console.log('Updated:');
console.log('  public/data/personal-portfolio/transactions.csv');
console.log('  public/data/personal-portfolio/holdings.csv');
console.log('  public/data/personal-portfolio/meta.json');
console.log('');
console.log('Next steps:');
console.log('  1. npm run verify:portfolio');
console.log('  2. npm run dev  (or deploy)');
