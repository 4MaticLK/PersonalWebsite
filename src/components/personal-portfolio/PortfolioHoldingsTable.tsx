import { useState } from 'react';
import type { PortfolioAnalytics, PositionPerformance } from '../../utils/computePortfolioAnalytics';
import type { PortfolioFilter } from '../../utils/portfolioFilter';
import { isPortfolioFilterActive } from '../../utils/portfolioFilter';
import { formatPct, formatSharePrice, type HoldingRow } from '../../utils/parsePersonalPortfolioCsv';

interface PortfolioHoldingsTableProps {
  holdings: HoldingRow[];
  analytics: PortfolioAnalytics;
  filter?: PortfolioFilter | null;
  onSelectTicker?: (ticker: string) => void;
}

type SortKey = 'ticker' | 'name' | 'weight' | 'price' | 'today' | 'total';
type SortDir = 'asc' | 'desc';

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: 'ticker', label: 'Ticker' },
  { key: 'name', label: 'Name' },
  { key: 'weight', label: 'Weight', numeric: true },
  { key: 'price', label: 'Price', numeric: true },
  { key: 'today', label: 'Today', numeric: true },
  { key: 'total', label: 'Total return', numeric: true },
];

function sortValue(
  key: SortKey,
  h: HoldingRow,
  perf: PositionPerformance | undefined
): string | number {
  switch (key) {
    case 'ticker':
      return h.ticker;
    case 'name':
      return h.name;
    case 'weight':
      return h.weightPct;
    case 'price':
      return perf?.currentPrice ?? h.currentPrice;
    case 'today':
      return perf?.dayChangePct ?? -Infinity;
    case 'total':
      return perf != null && perf.avgCost > 0 ? (perf.unrealizedGainPct ?? -Infinity) : -Infinity;
  }
}

export function PortfolioHoldingsTable({
  holdings,
  analytics,
  filter,
  onSelectTicker,
}: PortfolioHoldingsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('weight');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const perfByTicker = new Map(analytics.positions.map((p) => [p.ticker, p]));

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'ticker' || key === 'name' ? 'asc' : 'desc');
    }
  }

  const dirMul = sortDir === 'asc' ? 1 : -1;
  const sorted = holdings
    .filter((h) => h.ticker !== 'OTHER')
    .sort((a, b) => {
      const va = sortValue(sortKey, a, perfByTicker.get(a.ticker));
      const vb = sortValue(sortKey, b, perfByTicker.get(b.ticker));
      if (typeof va === 'string' || typeof vb === 'string') {
        return dirMul * String(va).localeCompare(String(vb));
      }
      // Both can be -Infinity (missing metric); subtraction would yield NaN.
      if (va === vb) return 0;
      return dirMul * (va < vb ? -1 : 1);
    });

  return (
    <div className="personal-portfolio__table-wrap">
      <h3 className="personal-portfolio__table-heading">Current holdings</h3>
      <div className="personal-portfolio__table-scroll">
        <table className="personal-portfolio__table personal-portfolio__table--holdings">
          <colgroup>
            <col className="personal-portfolio__col-ticker" />
            <col className="personal-portfolio__col-name" />
            <col className="personal-portfolio__col-metric" />
            <col className="personal-portfolio__col-metric" />
            <col className="personal-portfolio__col-metric" />
            <col className="personal-portfolio__col-metric" />
          </colgroup>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={col.numeric ? 'personal-portfolio__num' : undefined}
                  aria-sort={
                    sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
                  }
                >
                  <button
                    type="button"
                    className="personal-portfolio__sort-btn"
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                    <span className="personal-portfolio__sort-arrow" aria-hidden="true">
                      {sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((h) => {
              const perf = perfByTicker.get(h.ticker);
              const hasReturn = perf != null && perf.avgCost > 0;
              const gainPct = perf?.unrealizedGainPct ?? null;
              const gainClass =
                gainPct != null
                  ? gainPct > 0
                    ? 'personal-portfolio__gain--positive'
                    : gainPct < 0
                      ? 'personal-portfolio__gain--negative'
                      : ''
                  : '';
              const dayPct = perf?.dayChangePct ?? null;
              const active = isPortfolioFilterActive(filter ?? null, h.ticker, h.sector);
              const dimmed = filter != null && !active;
              const sharePrice = perf?.currentPrice ?? h.currentPrice;

              return (
                <tr
                  key={h.ticker}
                  className={`personal-portfolio__table-row--clickable ${active ? 'personal-portfolio__table-row--active' : ''} ${dimmed ? 'personal-portfolio__table-row--dimmed' : ''}`}
                  onClick={() => onSelectTicker?.(h.ticker)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectTicker?.(h.ticker);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={active}
                >
                  <td>
                    <strong>{h.ticker}</strong>
                  </td>
                  <td>{h.name}</td>
                  <td className="personal-portfolio__num" data-label="Weight">
                    {formatPct(h.weightPct)}
                  </td>
                  <td className="personal-portfolio__num" data-label="Price">
                    {formatSharePrice(sharePrice)}
                  </td>
                  <td
                    className={`personal-portfolio__num ${
                      dayPct != null
                        ? dayPct >= 0
                          ? 'personal-portfolio__gain--positive'
                          : 'personal-portfolio__gain--negative'
                        : ''
                    }`}
                    data-label="Today"
                  >
                    {dayPct != null ? formatPct(dayPct, 2, true) : '—'}
                  </td>
                  <td className={`personal-portfolio__num ${gainClass}`} data-label="Total return">
                    {hasReturn && gainPct != null ? formatPct(gainPct, 2, true) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
