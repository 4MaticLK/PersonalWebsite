import type { PortfolioAnalytics } from '../../utils/computePortfolioAnalytics';
import type { PortfolioFilter } from '../../utils/portfolioFilter';
import { isPortfolioFilterActive } from '../../utils/portfolioFilter';
import { formatPct, formatSharePrice, type HoldingRow } from '../../utils/parsePersonalPortfolioCsv';

interface PortfolioHoldingsTableProps {
  holdings: HoldingRow[];
  analytics: PortfolioAnalytics;
  filter?: PortfolioFilter | null;
  onSelectTicker?: (ticker: string) => void;
}

export function PortfolioHoldingsTable({
  holdings,
  analytics,
  filter,
  onSelectTicker,
}: PortfolioHoldingsTableProps) {
  const perfByTicker = new Map(analytics.positions.map((p) => [p.ticker, p]));

  const sorted = [...holdings]
    .filter((h) => h.ticker !== 'OTHER')
    .sort((a, b) => b.marketValue - a.marketValue);

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
              <th scope="col">Ticker</th>
              <th scope="col">Name</th>
              <th scope="col" className="personal-portfolio__num">
                Weight
              </th>
              <th scope="col" className="personal-portfolio__num">
                Price
              </th>
              <th scope="col" className="personal-portfolio__num">
                Today
              </th>
              <th scope="col" className="personal-portfolio__num">
                Total return
              </th>
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
                  <td className="personal-portfolio__num">{formatPct(h.weightPct)}</td>
                  <td className="personal-portfolio__num">{formatSharePrice(sharePrice)}</td>
                  <td
                    className={`personal-portfolio__num ${
                      dayPct != null
                        ? dayPct >= 0
                          ? 'personal-portfolio__gain--positive'
                          : 'personal-portfolio__gain--negative'
                        : ''
                    }`}
                  >
                    {dayPct != null ? formatPct(dayPct, 2, true) : '—'}
                  </td>
                  <td className={`personal-portfolio__num ${gainClass}`}>
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
