import {
  REBALANCE_ABS_BAND_PCT,
  REBALANCE_REL_BAND,
} from '../../data/portfolioTargets';
import { computeRebalanceStatus, type RebalanceRow } from '../../utils/portfolioRebalancing';
import { formatPct, type HoldingRow } from '../../utils/parsePersonalPortfolioCsv';

interface PortfolioRebalancingPanelProps {
  holdings: HoldingRow[];
}

function actionLabel(action: RebalanceRow['action']): string {
  if (action === 'trim') return 'Trim';
  if (action === 'add') return 'Add';
  return 'In band';
}

function actionClass(action: RebalanceRow['action'], triggered: boolean): string | undefined {
  if (!triggered) return 'personal-portfolio__risk-cell--low';
  if (action === 'trim') return 'personal-portfolio__risk-cell--high';
  return undefined;
}

export function PortfolioRebalancingPanel({ holdings }: PortfolioRebalancingPanelProps) {
  const status = computeRebalanceStatus(holdings);
  const triggered = status.rows.filter((r) => r.triggered);

  return (
    <section
      className="personal-portfolio__insights personal-portfolio__rebalance"
      aria-labelledby="portfolio-rebalance-heading"
    >
      <h3 id="portfolio-rebalance-heading" className="personal-portfolio__insights-heading">
        Rebalancing
      </h3>
      <p className="personal-portfolio__insights-caption">
        Target weights with a band — rebalance when drift exceeds{' '}
        {REBALANCE_ABS_BAND_PCT} percentage points or {formatPct(REBALANCE_REL_BAND * 100, 0)} of
        the target weight.
      </p>

      {triggered.length === 0 ? (
        <p className="personal-portfolio__rebalance-ok" role="status">
          All {status.inBandCount} positions are within band.
        </p>
      ) : (
        <p className="personal-portfolio__rebalance-alert" role="status">
          {triggered.length} position{triggered.length === 1 ? '' : 's'} outside band — trim winners
          or add to laggards back toward target.
        </p>
      )}

      <div className="personal-portfolio__risk-table-wrap">
        <table className="personal-portfolio__risk-table">
          <thead>
            <tr>
              <th scope="col">Holding</th>
              <th scope="col">Current</th>
              <th scope="col">Target</th>
              <th scope="col">Drift</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {status.rows.map((row) => (
              <tr key={row.ticker}>
                <td>{row.ticker}</td>
                <td>{formatPct(row.currentPct, 1)}</td>
                <td>{row.targetPct > 0 ? formatPct(row.targetPct, 1) : '—'}</td>
                <td
                  className={
                    row.triggered ? 'personal-portfolio__risk-cell--high' : undefined
                  }
                >
                  {row.targetPct > 0 ? formatPct(row.driftPct, 1, true) : '—'}
                </td>
                <td className={actionClass(row.action, row.triggered)}>
                  {row.targetPct > 0 ? actionLabel(row.action) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
