import type { NavHistoryRow } from './parsePersonalPortfolioCsv';

export type PerformanceRange = '1m' | '3m' | 'ytd' | '1y' | 'all';

function rangeStartDate(endIso: string, range: PerformanceRange): string | null {
  const end = new Date(endIso + 'T12:00:00');
  if (Number.isNaN(end.getTime())) return null;

  const start = new Date(end);
  switch (range) {
    case '1m':
      start.setMonth(start.getMonth() - 1);
      break;
    case '3m':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'ytd':
      return `${end.getFullYear()}-01-01`;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    case 'all':
      return null;
  }
  return start.toISOString().slice(0, 10);
}

/** Slice and rebase cumulative return series for chart windows. */
export function filterNavHistoryByRange(
  rows: NavHistoryRow[],
  range: PerformanceRange
): NavHistoryRow[] {
  if (range === 'all' || rows.length < 2) return rows;

  const endIso = rows[rows.length - 1]!.date;
  const startIso = rangeStartDate(endIso, range);
  if (!startIso) return rows;

  const filtered = rows.filter((r) => r.date >= startIso);
  if (filtered.length < 2) return rows;

  // Geometric rebase: a cumulative series must be re-indexed by growth factors, not by
  // subtracting the window-start return (subtraction overstates gains after a run-up).
  const basePort = 1 + filtered[0]!.cumulativeReturnPct / 100;
  const baseBench = 1 + filtered[0]!.benchmarkReturnPct / 100;

  return filtered.map((r) => ({
    ...r,
    cumulativeReturnPct:
      basePort > 0
        ? ((1 + r.cumulativeReturnPct / 100) / basePort - 1) * 100
        : r.cumulativeReturnPct - filtered[0]!.cumulativeReturnPct,
    benchmarkReturnPct:
      baseBench > 0
        ? ((1 + r.benchmarkReturnPct / 100) / baseBench - 1) * 100
        : r.benchmarkReturnPct - filtered[0]!.benchmarkReturnPct,
  }));
}
