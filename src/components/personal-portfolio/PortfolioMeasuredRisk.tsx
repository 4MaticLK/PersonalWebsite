import { PERSONAL_PORTFOLIO } from '../../data/personalPortfolio';
import type { PortfolioAnalytics } from '../../utils/computePortfolioAnalytics';
import { formatPct } from '../../utils/parsePersonalPortfolioCsv';

interface PortfolioMeasuredRiskProps {
  analytics: PortfolioAnalytics;
}

function RiskCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: 'high' | 'low' | 'neutral';
}) {
  const valueClass =
    highlight === 'high'
      ? 'personal-portfolio__risk-value personal-portfolio__risk-value--high'
      : highlight === 'low'
        ? 'personal-portfolio__risk-value personal-portfolio__risk-value--low'
        : 'personal-portfolio__risk-value';

  return (
    <div className="personal-portfolio__insight-card personal-portfolio__risk-card">
      <span className="personal-portfolio__insight-label">{label}</span>
      <span className={valueClass}>{value}</span>
      {sub != null && <span className="personal-portfolio__insight-sub">{sub}</span>}
    </div>
  );
}

function fmtRatio(n: number | null): string {
  return n == null || !Number.isFinite(n) ? '—' : n.toFixed(2);
}

function fmtBeta(n: number | null): string {
  return n == null || !Number.isFinite(n) ? '—' : n.toFixed(2);
}

export function PortfolioMeasuredRisk({ analytics }: PortfolioMeasuredRiskProps) {
  const benchmark = PERSONAL_PORTFOLIO.benchmarkName;
  const { risk } = analytics;

  if (risk.observationDays < 20) {
    return (
      <section className="personal-portfolio__risk" aria-labelledby="portfolio-measured-risk-heading">
        <h3 id="portfolio-measured-risk-heading" className="personal-portfolio__insights-heading">
          Realized risk &amp; performance
        </h3>
        <p className="personal-portfolio__insights-caption">
          Not enough price history yet to compute measured risk metrics ({risk.observationDays} of
          20 trading days needed).
        </p>
      </section>
    );
  }

  const maxDrawdownPct = analytics.maxDrawdownPct;
  const sharpeHighlight = risk.sharpeRatio != null && risk.sharpeRatio >= 0.5 ? 'low' : risk.sharpeRatio != null && risk.sharpeRatio < 0 ? 'high' : 'neutral';
  const ddHighlight = maxDrawdownPct != null && maxDrawdownPct <= -20 ? 'high' : 'neutral';
  const varHighlight = risk.var95DailyPct != null && risk.var95DailyPct <= -3 ? 'high' : 'neutral';
  const betaHighlight = risk.beta != null && risk.beta > 1.15 ? 'high' : risk.beta != null && risk.beta < 0.85 ? 'low' : 'neutral';

  const positionRows = risk.positionRisks;

  return (
    <section className="personal-portfolio__risk" aria-labelledby="portfolio-measured-risk-heading">
      <h3 id="portfolio-measured-risk-heading" className="personal-portfolio__insights-heading">
        Realized risk &amp; performance
      </h3>
      <p className="personal-portfolio__insights-caption">
        Measured from {risk.observationDays} trading days of actual price history vs {benchmark} —
        distinct from the long-run assumption model below, which uses static per-holding estimates
        rather than what actually happened.
      </p>

      <div className="personal-portfolio__insights-grid personal-portfolio__risk-grid">
        <RiskCard
          label="Sharpe ratio"
          value={fmtRatio(risk.sharpeRatio)}
          sub="Measured excess return per unit of vol"
          highlight={sharpeHighlight}
        />
        <RiskCard
          label="Sortino ratio"
          value={fmtRatio(risk.sortinoRatio)}
          sub="Excess return per unit of downside vol"
        />
        <RiskCard
          label="Max drawdown"
          value={maxDrawdownPct != null ? formatPct(maxDrawdownPct, 1, true) : '—'}
          sub="Largest peak-to-trough decline"
          highlight={ddHighlight}
        />
        <RiskCard
          label="95% daily VaR"
          value={risk.var95DailyPct != null ? formatPct(risk.var95DailyPct, 2, true) : '—'}
          sub="Worst plausible daily loss, 1-in-20 days"
          highlight={varHighlight}
        />
        <RiskCard
          label="Tracking error"
          value={risk.trackingErrorPct != null ? formatPct(risk.trackingErrorPct, 1) : '—'}
          sub={`Annualized active risk vs ${benchmark}`}
        />
        <RiskCard
          label="Correlation"
          value={fmtRatio(risk.correlationWithBenchmark)}
          sub={`vs ${benchmark} · R² ${fmtRatio(risk.rSquared)}`}
        />
        <RiskCard label="Calmar ratio" value={fmtRatio(risk.calmarRatio)} sub="Return per unit of max drawdown" />
        <RiskCard
          label="Measured beta"
          value={fmtBeta(risk.beta)}
          sub="From realized daily returns, not assumptions"
          highlight={betaHighlight}
        />
      </div>

      <h4 className="personal-portfolio__risk-subhead">Concentration</h4>
      <div className="personal-portfolio__insights-grid personal-portfolio__risk-grid">
        <RiskCard
          label="Effective holdings"
          value={risk.effectiveHoldings.toFixed(1)}
          sub="1 / HHI — behaves like this many equal-sized bets"
        />
        <RiskCard label="Top 3 weight" value={formatPct(risk.top3WeightPct, 1)} sub="Share of book in largest 3 positions" />
        <RiskCard
          label="Largest sector"
          value={risk.largestSector ?? '—'}
          sub={risk.largestSector ? formatPct(risk.largestSectorWeightPct, 1) + ' of book' : undefined}
        />
      </div>

      {positionRows.length > 0 && (
        <>
          <h4 className="personal-portfolio__risk-subhead">Measured beta &amp; volatility per position</h4>
          <p className="personal-portfolio__insights-caption">
            From each holding&apos;s own daily price history vs {benchmark} — compare against the
            assumption-model beta used in the risk-contribution table below.
          </p>
          <div className="personal-portfolio__risk-table-wrap">
            <table className="personal-portfolio__risk-table">
              <thead>
                <tr>
                  <th scope="col">Holding</th>
                  <th scope="col">Weight</th>
                  <th scope="col">Measured beta</th>
                  <th scope="col">Ann. volatility</th>
                </tr>
              </thead>
              <tbody>
                {positionRows.map((row) => (
                  <tr key={row.ticker}>
                    <td>{row.ticker}</td>
                    <td>{formatPct(row.weightPct, 1)}</td>
                    <td>{fmtBeta(row.beta)}</td>
                    <td>{row.annualizedVolPct != null ? formatPct(row.annualizedVolPct, 1) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
