import type { PortfolioAnalytics } from '../../utils/computePortfolioAnalytics';
import { anchorEngineInsight } from '../../utils/portfolioInsights';
import { formatPct } from '../../utils/parsePersonalPortfolioCsv';

interface PortfolioAnchorEngineInsightProps {
  analytics: PortfolioAnalytics;
}

function toneFromPct(value: number | null): 'positive' | 'negative' | 'neutral' {
  if (value == null || Math.abs(value) < 0.001) return 'neutral';
  return value > 0 ? 'positive' : 'negative';
}

function BucketCard({
  label,
  weightPct,
  todayPct,
  sub,
}: {
  label: string;
  weightPct: number;
  todayPct: number | null;
  sub: string;
}) {
  const tone = toneFromPct(todayPct);

  return (
    <div className="personal-portfolio__insight-card">
      <span className="personal-portfolio__insight-label">{label}</span>
      <span className="personal-portfolio__insight-value">{formatPct(weightPct, 2)} weight</span>
      <span
        className={
          tone === 'neutral'
            ? 'personal-portfolio__insight-sub'
            : `personal-portfolio__insight-value personal-portfolio__insight-value--${tone} personal-portfolio__insight-value--inline`
        }
      >
        {todayPct != null ? `Today ${formatPct(todayPct, 2, true)}` : 'Today —'}
      </span>
      <span className="personal-portfolio__insight-sub">{sub}</span>
    </div>
  );
}

export function PortfolioAnchorEngineInsight({ analytics }: PortfolioAnchorEngineInsightProps) {
  const insight = anchorEngineInsight(analytics.positions);
  const hasToday = insight.anchorTodayPct != null || insight.engineTodayPct != null;

  const driverLine =
    hasToday && insight.engineShareOfDayMovePct != null
      ? insight.engineShareOfDayMovePct >= 55
        ? `Single names drove ${formatPct(insight.engineShareOfDayMovePct, 0)} of today's book move.`
        : insight.engineShareOfDayMovePct <= 45
          ? `ETF ballast drove ${formatPct(100 - insight.engineShareOfDayMovePct, 0)} of today's book move.`
          : 'Anchor and engine contributed roughly equally today.'
      : null;

  return (
    <section className="personal-portfolio__insights" aria-labelledby="portfolio-anchor-engine-heading">
      <h3 id="portfolio-anchor-engine-heading" className="personal-portfolio__insights-heading">
        Anchor vs engine
      </h3>
      <p className="personal-portfolio__insights-caption">
        ETF ballast vs single-name bets in the open book — how each side is weighted and moving
        today.
      </p>
      <div className="personal-portfolio__insights-grid personal-portfolio__insights-grid--duo">
        <BucketCard
          label="Anchor"
          weightPct={insight.anchorWeightPct}
          todayPct={insight.anchorTodayPct}
          sub="VOO, QQQ, VTIP"
        />
        <BucketCard
          label="Engine"
          weightPct={insight.engineWeightPct}
          todayPct={insight.engineTodayPct}
          sub="Individual stocks & other ETFs"
        />
      </div>
      {driverLine && <p className="personal-portfolio__insights-footnote">{driverLine}</p>}
    </section>
  );
}
