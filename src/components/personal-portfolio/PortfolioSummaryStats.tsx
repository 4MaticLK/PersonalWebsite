import { PERSONAL_PORTFOLIO } from '../../data/personalPortfolio';
import type { PortfolioModelAnalytics } from '../../utils/computePortfolioModelAnalytics';
import { formatPct } from '../../utils/parsePersonalPortfolioCsv';

interface PortfolioSummaryStatsProps {
  modelAnalytics: PortfolioModelAnalytics | null;
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="frontier-stats__card personal-portfolio__stat-card">
      <span className="frontier-stats__label">{label}</span>
      <span className="personal-portfolio__stat-value">{value}</span>
      {sub != null && <span className="frontier-stats__sub">{sub}</span>}
    </div>
  );
}

export function PortfolioSummaryStats({ modelAnalytics }: PortfolioSummaryStatsProps) {
  const benchmark = PERSONAL_PORTFOLIO.benchmarkName;

  if (!modelAnalytics) {
    return null;
  }

  return (
    <div className="personal-portfolio__stats">
      <h3 className="frontier-stats__heading">Portfolio profile</h3>
      <p className="personal-portfolio__stats-caption">
        Whole-book estimates vs {benchmark} · long-run assumptions per holding.
      </p>
      <div className="frontier-stats__grid personal-portfolio__stats-grid">
        <StatCard
          label="Expected return"
          value={formatPct(modelAnalytics.expectedReturnPct, 1)}
          sub="Weighted nominal assumption"
        />
        <StatCard
          label="Portfolio beta"
          value={modelAnalytics.beta.toFixed(2)}
          sub={`Sensitivity to ${benchmark}`}
        />
        <StatCard
          label="Volatility"
          value={formatPct(modelAnalytics.volatilityPct, 1)}
          sub={`Typical year ${formatPct(modelAnalytics.typicalYearLowPct, 0, true)} to ${formatPct(modelAnalytics.typicalYearHighPct, 0, true)}`}
        />
        <StatCard
          label="Sharpe ratio"
          value={modelAnalytics.sharpeRatio.toFixed(2)}
          sub="Excess return per unit of vol"
        />
      </div>
    </div>
  );
}
