import { PERSONAL_PORTFOLIO } from '../data/personalPortfolio';
import type { TransactionRow } from './parsePersonalPortfolioCsv';

const ACTIVITY_EXCLUDED = new Set<string>(PERSONAL_PORTFOLIO.activityExcludedTickers);

/** Public activity feed: deposits, withdrawals, and trades for the current book only. */
export function transactionsForPublicDisplay(
  transactions: TransactionRow[],
  currentTickers: Iterable<string>
): TransactionRow[] {
  const held = new Set(currentTickers);

  return transactions.filter((tx) => {
    if (tx.type === 'dividend') return false;
    if (tx.type === 'deposit' || tx.type === 'withdrawal') return true;
    if (tx.ticker === '—') return true;
    if (ACTIVITY_EXCLUDED.has(tx.ticker)) return false;
    return held.has(tx.ticker);
  });
}

/** Index + broad ETF tickers treated as portfolio anchor (ballast). */
export const INDEX_ETF_TICKERS = new Set(['VOO', 'VTI', 'SPY', 'QQQ', 'VTIP', 'IVV']);

export function isAnchorTicker(ticker: string): boolean {
  return INDEX_ETF_TICKERS.has(ticker);
}

/** Index + broad ETF weight in the current book (%). */
export function indexEtfWeightPct(tickers: { ticker: string; weightPct: number }[]): number {
  return tickers
    .filter((h) => isAnchorTicker(h.ticker))
    .reduce((sum, h) => sum + h.weightPct, 0);
}
