import { PERSONAL_PORTFOLIO } from '../../data/personalPortfolio';
import type { PortfolioAnalytics } from '../../utils/computePortfolioAnalytics';
import type { LiveQuotesMeta } from '../../utils/applyLiveQuotes';
import { formatPct } from '../../utils/parsePersonalPortfolioCsv';

interface PortfolioSummaryStatsProps {
  analytics: PortfolioAnalytics;
  liveQuotes?: LiveQuotesMeta;
}

function StatCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean | null;
}) {
  const valueClass =
    positive === true
      ? 'personal-portfolio__stat-value personal-portfolio__stat-value--positive'
      : positive === false
        ? 'personal-portfolio__stat-value personal-portfolio__stat-value--negative'
        : 'personal-portfolio__stat-value';

  return (
    <div className="frontier-stats__card personal-portfolio__stat-card">
      <span className="frontier-stats__label">{label}</span>
      <span className={valueClass}>{value}</span>
      {sub != null && <span className="frontier-stats__sub">{sub}</span>}
    </div>
  );
}

export function PortfolioSummaryStats({ analytics, liveQuotes }: PortfolioSummaryStatsProps) {
  const benchmark = PERSONAL_PORTFOLIO.benchmarkName;
  const livePulse = liveQuotes?.mode === 'live' || liveQuotes?.mode === 'partial';

  return (
    <div className={`personal-portfolio__stats ${livePulse ? 'personal-portfolio__stats--live' : ''}`}>
      <h3 className="frontier-stats__heading">Lifetime returns</h3>
      <p className="personal-portfolio__stats-caption">
        Money-weighted since first trade · {benchmark} comparison uses the same cash-flow timing.
      </p>
      <div className="frontier-stats__grid personal-portfolio__stats-grid personal-portfolio__stats-grid--history">
        <StatCard
          label="Net return"
          value={formatPct(analytics.moneyWeightedReturnPct, 2, true)}
          sub="On deployed capital, including dividends"
          positive={analytics.moneyWeightedReturnPct >= 0}
        />
        <StatCard
          label={`Alpha vs ${benchmark}`}
          value={analytics.alphaPct != null ? formatPct(analytics.alphaPct, 2, true) : '—'}
          sub={
            analytics.benchmarkReturnPct != null
              ? `${benchmark} ${formatPct(analytics.benchmarkReturnPct, 2, true)} over same period`
              : 'Money-weighted excess return'
          }
          positive={analytics.alphaPct != null ? analytics.alphaPct >= 0 : null}
        />
        <StatCard
          label="Max drawdown"
          value={
            analytics.maxDrawdownPct != null ? formatPct(analytics.maxDrawdownPct, 2) : '—'
          }
          sub="Peak-to-trough on the performance chart series"
          positive={analytics.maxDrawdownPct != null ? analytics.maxDrawdownPct >= 0 : null}
        />
      </div>
    </div>
  );
}
