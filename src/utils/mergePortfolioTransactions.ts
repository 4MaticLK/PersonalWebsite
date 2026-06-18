import type { TransactionRow } from './parsePersonalPortfolioCsv';

export function transactionFingerprint(tx: TransactionRow): string {
  const shares =
    tx.shares != null && Number.isFinite(tx.shares) ? tx.shares.toFixed(8) : '';
  const amount = Number.isFinite(tx.amount) ? tx.amount.toFixed(2) : '';
  return `${tx.date}|${tx.type}|${tx.ticker}|${shares}|${amount}`;
}

/** Merge Robinhood export rows into existing transactions without duplicates. */
export function mergePortfolioTransactions(
  existing: TransactionRow[],
  incoming: TransactionRow[]
): { merged: TransactionRow[]; added: TransactionRow[] } {
  const seen = new Set(existing.map(transactionFingerprint));
  const added: TransactionRow[] = [];

  for (const tx of incoming) {
    const key = transactionFingerprint(tx);
    if (seen.has(key)) continue;
    seen.add(key);
    added.push(tx);
  }

  const merged = [...existing, ...added].sort((a, b) => b.date.localeCompare(a.date));
  return { merged, added };
}
