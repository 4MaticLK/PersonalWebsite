/**
 * Sanity-check portfolio CSVs and analytics (requires network for Yahoo history).
 * Usage: npm run verify:portfolio
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  parseHoldingsCsv,
  parseTransactionsCsv,
  normalizeHoldingsWeights,
} from '../src/utils/parsePersonalPortfolioCsv.ts';
import {
  computePortfolioAnalytics,
  backtestSymbols,
} from '../src/utils/computePortfolioAnalytics.ts';
import { fetchYahooChartHistory } from '../lib/yahooQuotes.ts';
import type { PortfolioVerifyWarning } from '../src/utils/portfolioMeta.ts';
import {
  portfolioAsOfFromTransactions,
  writePortfolioMetaFile,
} from './portfolioMetaFile.ts';

const base = resolve(process.cwd(), 'public/data/personal-portfolio');
const holdings = normalizeHoldingsWeights(
  parseHoldingsCsv(readFileSync(resolve(base, 'holdings.csv'), 'utf8'))
);
const tx = parseTransactionsCsv(readFileSync(resolve(base, 'transactions.csv'), 'utf8'));

const sortedTx = [...tx].sort((a, b) => a.date.localeCompare(b.date));
const inception = sortedTx[0]?.date ?? 'unknown';
const range = inception.startsWith('2023') || inception < '2024-06-01' ? 'max' : '2y';

const spy = await fetchYahooChartHistory('SPY', range as '2y' | 'max');
const historyByTicker = new Map<string, { date: string; close: number }[]>();
for (const { ticker, symbol } of backtestSymbols(tx)) {
  try {
    historyByTicker.set(ticker, await fetchYahooChartHistory(symbol, range as '2y' | 'max'));
  } catch {
    console.warn(`  skip history: ${ticker}`);
  }
}

const a = computePortfolioAnalytics(holdings, tx, {
  benchmarkHistory: spy,
  holdingsHistory: historyByTicker,
});

const listed = holdings.filter((h) => h.ticker !== 'CASH' && h.ticker !== 'OTHER');
const weightSum = listed.reduce((s, h) => s + h.weightPct, 0);
const warnings: PortfolioVerifyWarning[] = [];

if (!a.depositsComplete) warnings.push('deposits_incomplete');
if (a.untrackedSellCount > 0) warnings.push('untracked_sells');
if (Math.abs(weightSum - 100) > 0.5) warnings.push('holdings_weight_drift');

const verifyPassed = warnings.length === 0;
const now = new Date().toISOString();
const asOf = portfolioAsOfFromTransactions(tx.map((row) => row.date));

writePortfolioMetaFile({
  asOf,
  syncedAt: now,
  verifiedAt: now,
  verifyPassed,
  verifyWarnings: warnings,
  transactionCount: tx.length,
  holdingCount: listed.length,
});

const f = (n: number | null | undefined, d = 2) => (n == null ? 'null' : n.toFixed(d));

console.log('Portfolio verification');
console.log('====================');
console.log('Transactions:', tx.length, '· Inception:', inception);
console.log('Holdings:', listed.length);
console.log('Verify:', verifyPassed ? 'PASSED' : 'PASSED WITH WARNINGS');
if (warnings.length) console.log('Warnings:', warnings.join(', '));
console.log('');
console.log('Current book');
console.log('  Unrealized return:', f(a.unrealizedGainPct), '%');
console.log('  Positions:', a.positions.length);
console.log('');
console.log('Lifetime');
console.log('  Net return (MW):', f(a.moneyWeightedReturnPct), '%');
console.log('  Realized return:', f(a.realizedReturnPct), '%');
console.log('  Alpha vs SPY:', f(a.alphaPct), '%');
console.log('  Untracked sells:', a.untrackedSellCount);
console.log('  Deposits complete:', a.depositsComplete);
console.log('');
console.log('Risk');
console.log('  Beta:', f(a.risk.beta));
console.log('  Ann. vol:', f(a.risk.annualizedVolatilityPct), '%');
console.log('  Max drawdown:', f(a.maxDrawdownPct), '%');
console.log('');
console.log('Updated public/data/personal-portfolio/meta.json');
console.log(verifyPassed ? 'OK' : 'OK (see warnings)');
