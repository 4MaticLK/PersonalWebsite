/**
 * Refresh holdings.csv prices from Yahoo (no Robinhood export needed).
 * Updates tickers already listed in holdings.csv — does not add new positions.
 * Usage: npm run refresh:portfolio-prices [--write]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fetchYahooQuotes } from '../lib/yahooQuotes.ts';
import { buildAvgCostMap } from '../src/utils/computePortfolioAnalytics.ts';
import {
  normalizeHoldingsWeights,
  parseHoldingsCsv,
  parseTransactionsCsv,
  type HoldingRow,
} from '../src/utils/parsePersonalPortfolioCsv.ts';
import { serializeHoldingsCsv } from '../src/utils/rebuildHoldingsFromTransactions.ts';
import { quotableTickers, quotePriceForTicker } from '../src/utils/yahooSymbols.ts';

const base = resolve(process.cwd(), 'public/data/personal-portfolio');
const write = process.argv.includes('--write');

const transactions = parseTransactionsCsv(
  readFileSync(resolve(base, 'transactions.csv'), 'utf8')
);
const previousHoldings = parseHoldingsCsv(
  readFileSync(resolve(base, 'holdings.csv'), 'utf8')
);
const openLots = buildAvgCostMap(transactions);

const tickers = previousHoldings
  .filter((h) => h.ticker !== 'CASH' && h.ticker !== 'OTHER')
  .map((h) => h.ticker);

let quotes: Record<string, number> = {};
const yahooSymbols = quotableTickers(tickers);
if (yahooSymbols.length) {
  try {
    quotes = (await fetchYahooQuotes(yahooSymbols)).quotes;
  } catch {
    /* keep CSV prices */
  }
}

const updated: HoldingRow[] = previousHoldings
  .filter((h) => h.ticker !== 'CASH' && h.ticker !== 'OTHER')
  .map((h) => {
    const lot = openLots.get(h.ticker);
    const shares = lot && lot.shares > 1e-6 ? lot.shares : h.shares;
    const costBasis =
      lot && lot.shares > 1e-6 ? lot.totalCost / lot.shares : h.costBasis;
    const live = quotePriceForTicker(h.ticker, quotes);
    const currentPrice = live ?? h.currentPrice;
    const marketValue = currentPrice > 0 && shares > 0 ? shares * currentPrice : h.marketValue;

    return {
      ...h,
      shares,
      costBasis,
      currentPrice,
      marketValue,
    };
  });

const holdings = normalizeHoldingsWeights(updated);

console.log('Holdings price refresh');
console.log('======================');
for (const h of holdings) {
  console.log(`  ${h.ticker.padEnd(6)}  $${h.currentPrice.toFixed(2)}  (${h.weightPct.toFixed(1)}%)`);
}

if (!write) {
  console.log('');
  console.log('Dry run. Re-run with --write to update holdings.csv.');
  process.exit(0);
}

writeFileSync(resolve(base, 'holdings.csv'), serializeHoldingsCsv(holdings), 'utf8');
console.log('');
console.log('Updated public/data/personal-portfolio/holdings.csv');
