import { PERSONAL_PORTFOLIO } from '../../data/personalPortfolio';
import { PORTFOLIO_MODEL_ASSUMPTIONS } from '../../data/portfolioModelInputs';
import type { PortfolioModelAnalytics } from '../../utils/computePortfolioModelAnalytics';
import { formatPct } from '../../utils/parsePersonalPortfolioCsv';

interface PortfolioRiskFactorsProps {
  modelAnalytics: PortfolioModelAnalytics | null;
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

function fmtRatio(n: number | null, digits = 2): string {
  return n == null || !Number.isFinite(n) ? '—' : n.toFixed(digits);
}

function fmtBeta(n: number | null): string {
  return n == null || !Number.isFinite(n) ? '—' : n.toFixed(2);
}

export function PortfolioRiskFactors({ modelAnalytics }: PortfolioRiskFactorsProps) {
  const benchmark = PERSONAL_PORTFOLIO.benchmarkName;

  if (!modelAnalytics) {
    return (
      <section className="personal-portfolio__risk" aria-labelledby="portfolio-risk-heading">
        <h3 id="portfolio-risk-heading" className="personal-portfolio__insights-heading">
          Risk profile
        </h3>
        <p className="personal-portfolio__insights-caption">Model inputs unavailable.</p>
      </section>
    );
  }

  const { beta, volatilityPct, sharpeRatio, expectedReturnPct } = modelAnalytics;

  const betaHighlight =
    beta > 1.15 ? 'high' : beta < 0.85 ? 'low' : ('neutral' as const);
  const volHighlight = volatilityPct > 18 ? 'high' : ('neutral' as const);

  const topRisk = modelAnalytics.riskContributions.slice(0, 8);

  return (
    <section className="personal-portfolio__risk" aria-labelledby="portfolio-risk-heading">
      <h3 id="portfolio-risk-heading" className="personal-portfolio__insights-heading">
        Risk profile
      </h3>
      <p className="personal-portfolio__insights-caption">
        Single-index model vs {benchmark} · long-run assumptions, not measured from price history
        (see realized risk above) · risk-free {formatPct(PORTFOLIO_MODEL_ASSUMPTIONS.riskFreePct, 1)}
      </p>

      <div className="personal-portfolio__insights-grid personal-portfolio__risk-grid">
        <RiskCard
          label="Expected return"
          value={formatPct(expectedReturnPct, 1)}
          sub="Weighted long-run assumption"
        />
        <RiskCard
          label="Portfolio beta"
          value={fmtBeta(beta)}
          sub={`Sensitivity to ${benchmark}`}
          highlight={betaHighlight}
        />
        <RiskCard
          label="Annualized volatility"
          value={formatPct(volatilityPct, 1)}
          sub={`Typical year ${formatPct(modelAnalytics.typicalYearLowPct, 0, true)} to ${formatPct(modelAnalytics.typicalYearHighPct, 0, true)}`}
          highlight={volHighlight}
        />
        <RiskCard
          label="Sharpe ratio"
          value={fmtRatio(sharpeRatio)}
          sub="Excess return per unit of volatility"
          highlight={sharpeRatio >= 0.5 ? 'low' : sharpeRatio < 0 ? 'high' : 'neutral'}
        />
        <RiskCard
          label="Equity / bond"
          value={`${formatPct(modelAnalytics.equityWeightPct, 0)} / ${formatPct(modelAnalytics.bondWeightPct, 0)}`}
          sub="Current allocation split"
        />
        <RiskCard
          label="Bad year (≈ −2σ)"
          value={formatPct(modelAnalytics.badYearPct, 0, true)}
          sub="Rough tail scenario from model vol"
          highlight="high"
        />
      </div>

      <h4 className="personal-portfolio__risk-subhead">Risk contribution</h4>
      <p className="personal-portfolio__insights-caption">
        Share of total portfolio risk vs share of capital. Ratio &gt; 1× means outsized risk per
        dollar.
      </p>
      <div className="personal-portfolio__risk-table-wrap">
        <table className="personal-portfolio__risk-table">
          <thead>
            <tr>
              <th scope="col">Holding</th>
              <th scope="col">Risk share</th>
              <th scope="col">Weight</th>
              <th scope="col">Ratio</th>
            </tr>
          </thead>
          <tbody>
            {topRisk.map((row) => {
              const ratioClass =
                row.riskPerDollarRatio >= 2
                  ? 'personal-portfolio__risk-cell--high'
                  : row.riskPerDollarRatio <= 0.9
                    ? 'personal-portfolio__risk-cell--low'
                    : undefined;
              return (
                <tr key={row.ticker}>
                  <td>{row.ticker}</td>
                  <td>{formatPct(row.riskSharePct, 1)}</td>
                  <td>{formatPct(row.weightPct, 1)}</td>
                  <td className={ratioClass}>{row.riskPerDollarRatio.toFixed(1)}×</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h4 className="personal-portfolio__risk-subhead">Stress scenarios</h4>
      <div className="personal-portfolio__risk-table-wrap">
        <table className="personal-portfolio__risk-table">
          <thead>
            <tr>
              <th scope="col">Scenario</th>
              <th scope="col">Est. move</th>
            </tr>
          </thead>
          <tbody>
            {modelAnalytics.stressScenarios.map((s) => (
              <tr key={s.label}>
                <td>{s.label}</td>
                <td
                  className={
                    s.movePct <= -20
                      ? 'personal-portfolio__risk-cell--high'
                      : s.movePct >= 15
                        ? 'personal-portfolio__risk-cell--low'
                        : undefined
                  }
                >
                  {formatPct(s.movePct, 0, true)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
