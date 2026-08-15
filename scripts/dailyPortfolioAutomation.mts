/**
 * Daily portfolio automation:
 *   1. Refresh holdings.csv prices from Yahoo (same as refresh:portfolio-prices).
 *   2. Check each position's drift vs PORTFOLIO_TARGET_WEIGHTS using the exact
 *      same band logic the site displays (src/utils/portfolioRebalancing.ts).
 *   3. For any position outside its band, trade it back to its target weight
 *      (trims fund adds — no new capital, weights sum to 100% either way).
 *   4. Update meta.json.
 *
 * Defaults to dry run (prints what it would do). Pass --write to persist.
 * Usage: npx tsx scripts/dailyPortfolioAutomation.mts [--write]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fetchYahooQuotes } from '../lib/yahooQuotes.ts';
import { PORTFOLIO_TARGET_WEIGHTS } from '../src/data/portfolioTargets.ts';
import {
  parseHoldingsCsv,
  parseTransactionsCsv,
  type HoldingRow,
  type TransactionRow,
} from '../src/utils/parsePersonalPortfolioCsv.ts';
import { rebalanceTriggered } from '../src/utils/portfolioRebalancing.ts';
import {
  serializeHoldingsCsv,
  serializeTransactionsCsv,
} from '../src/utils/rebuildHoldingsFromTransactions.ts';
import { quotableTickers, quotePriceForTicker } from '../src/utils/yahooSymbols.ts';
import { writePortfolioMetaFile } from './portfolioMetaFile.ts';

const base = resolve(process.cwd(), 'public/data/personal-portfolio');
const write = process.argv.includes('--write');
const RUN_DATE = new Date().toISOString().slice(0, 10);
const MIN_QUOTE_COVERAGE = 0.9;

function roundShares(shares: number): number {
  return Math.round(shares * 1e5) / 1e5;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

const holdings = parseHoldingsCsv(readFileSync(resolve(base, 'holdings.csv'), 'utf8'));
const existingTx = parseTransactionsCsv(readFileSync(resolve(base, 'transactions.csv'), 'utf8'));
const listed = holdings.filter((h) => h.ticker !== 'CASH' && h.ticker !== 'OTHER');
const tickers = listed.map((h) => h.ticker);

const yahooSymbols = quotableTickers(tickers);
const { quotes } = await fetchYahooQuotes(yahooSymbols);
const coverage = yahooSymbols.length ? Object.keys(quotes).length / yahooSymbols.length : 0;

if (coverage < MIN_QUOTE_COVERAGE) {
  console.error(
    `Only got quotes for ${(coverage * 100).toFixed(0)}% of holdings (need ${MIN_QUOTE_COVERAGE * 100}%). Aborting without writing — Yahoo may be degraded today.`
  );
  process.exit(1);
}

// Step 1: refresh prices.
const priced: HoldingRow[] = listed.map((h) => {
  const live = quotePriceForTicker(h.ticker, quotes);
  const currentPrice = live ?? h.currentPrice;
  const marketValue = currentPrice > 0 ? h.shares * currentPrice : h.marketValue;
  return { ...h, currentPrice, marketValue };
});

const totalValue = priced.reduce((s, h) => s + h.marketValue, 0);
for (const h of priced) {
  h.weightPct = totalValue > 0 ? (h.marketValue / totalValue) * 100 : 0;
}

// Step 2: check drift using the same logic the Rebalancing panel uses.
const byTicker = new Map(priced.map((h) => [h.ticker, h]));
const triggeredTickers = [...byTicker.values()].filter((h) => {
  const target = PORTFOLIO_TARGET_WEIGHTS[h.ticker] ?? 0;
  return target > 0 && rebalanceTriggered(h.weightPct, target);
});

console.log(`Daily portfolio automation — ${RUN_DATE}`);
console.log(`Quote coverage: ${(coverage * 100).toFixed(0)}% (${Object.keys(quotes).length}/${yahooSymbols.length})`);
console.log(`Total value: $${roundMoney(totalValue).toFixed(2)}`);
console.log('');

const tradeTx: TransactionRow[] = [];

if (!triggeredTickers.length) {
  console.log('No positions outside their rebalance band — prices refreshed only.');
} else {
  console.log(`${triggeredTickers.length} position(s) outside band — rebalancing back to target:`);
  for (const h of triggeredTickers) {
    const target = PORTFOLIO_TARGET_WEIGHTS[h.ticker]!;
    const targetValue = (target / 100) * totalValue;
    const delta = targetValue - h.marketValue;
    const p = h.currentPrice;
    if (p <= 0) continue;

    if (delta > 0.01) {
      const addedShares = roundShares(delta / p);
      const cost = roundMoney(addedShares * p);
      tradeTx.push({
        date: RUN_DATE,
        type: 'buy',
        ticker: h.ticker,
        shares: addedShares,
        price: p,
        amount: -cost,
        notes: 'Auto-rebalance — drift outside band',
      });
      const newShares = h.shares + addedShares;
      h.costBasis = newShares > 0 ? (h.shares * h.costBasis + addedShares * p) / newShares : p;
      h.shares = newShares;
      console.log(`  ${h.ticker}: ${h.weightPct.toFixed(2)}% -> ${target.toFixed(2)}%  BUY ${addedShares} sh ($${cost.toFixed(2)})`);
    } else if (delta < -0.01) {
      const trimmedShares = roundShares(Math.min(h.shares, -delta / p));
      const proceeds = roundMoney(trimmedShares * p);
      tradeTx.push({
        date: RUN_DATE,
        type: 'sell',
        ticker: h.ticker,
        shares: trimmedShares,
        price: p,
        amount: -proceeds,
        notes: 'Auto-rebalance — drift outside band',
      });
      h.shares = h.shares - trimmedShares;
      console.log(`  ${h.ticker}: ${h.weightPct.toFixed(2)}% -> ${target.toFixed(2)}%  SELL ${trimmedShares} sh ($${proceeds.toFixed(2)})`);
    }
    h.marketValue = roundMoney(h.shares * p);
  }
}

// Recompute final weights after any trades.
const finalTotal = priced.reduce((s, h) => s + h.marketValue, 0);
for (const h of priced) {
  h.weightPct = roundMoney((h.marketValue / finalTotal) * 100);
}

const sortedRows = [...priced].sort(
  (a, b) => b.marketValue - a.marketValue || a.ticker.localeCompare(b.ticker)
);
const mergedTx = [...tradeTx, ...existingTx];

console.log('');
if (!write) {
  console.log('Dry run — no files written. Re-run with --write to persist.');
  process.exit(0);
}

writeFileSync(resolve(base, 'holdings.csv'), serializeHoldingsCsv(sortedRows));
if (tradeTx.length) {
  writeFileSync(resolve(base, 'transactions.csv'), serializeTransactionsCsv(mergedTx));
}
writePortfolioMetaFile({
  asOf: RUN_DATE,
  syncedAt: new Date().toISOString(),
  holdingCount: sortedRows.length,
  transactionCount: mergedTx.length,
});

console.log('Wrote holdings.csv' + (tradeTx.length ? ', transactions.csv' : '') + ', and meta.json.');
