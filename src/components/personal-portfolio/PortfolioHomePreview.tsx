import { Link } from 'react-router-dom';
import { PERSONAL_PORTFOLIO } from '../../data/personalPortfolio';
import type { PersonalPortfolioData } from '../../hooks/usePersonalPortfolioData';
import { indexEtfWeightPct } from '../../utils/portfolioDisplay';
import { formatPct, type HoldingRow } from '../../utils/parsePersonalPortfolioCsv';

interface PortfolioHomePreviewProps {
  data: PersonalPortfolioData;
}

const BAR_COLORS = ['#c9a227', '#0d9488', '#6366f1', '#f59e0b', '#94a3b8'];

function aggregateSectors(holdings: HoldingRow[]): { sector: string; weightPct: number }[] {
  const total = holdings.reduce((s, h) => s + h.marketValue, 0);
  const map = new Map<string, number>();
  for (const h of holdings) {
    if (h.ticker === 'OTHER') continue;
    map.set(h.sector, (map.get(h.sector) ?? 0) + h.marketValue);
  }
  return [...map.entries()]
    .map(([sector, value]) => ({
      sector,
      weightPct: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.weightPct - a.weightPct);
}

export function PortfolioHomePreview({ data }: PortfolioHomePreviewProps) {
  const { analytics, holdings } = data;
  const listed = holdings.filter((h) => h.ticker !== 'OTHER' && h.ticker !== 'CASH');
  const topHoldings = [...listed].sort((a, b) => b.marketValue - a.marketValue).slice(0, 5);
  const sectors = aggregateSectors(listed);
  const maxWeight = topHoldings[0]?.weightPct ?? 1;
  const indexWeight = indexEtfWeightPct(listed);

  const perfByTicker = new Map(analytics.positions.map((p) => [p.ticker, p]));
  const topSector = sectors[0];

  return (
    <div className="personal-portfolio__home-preview">
      <div className="personal-portfolio__home-hero">
        <div className="personal-portfolio__home-hero-stat">
          <span className="personal-portfolio__home-hero-label">Open book return</span>
          <span
            className={`personal-portfolio__home-hero-value ${
              analytics.unrealizedGainPct >= 0
                ? 'personal-portfolio__home-hero-value--positive'
                : 'personal-portfolio__home-hero-value--negative'
            }`}
          >
            {formatPct(analytics.unrealizedGainPct, 2, true)}
          </span>
          <span className="personal-portfolio__home-hero-sub">
            {analytics.dayChangePct != null
              ? `Today ${formatPct(analytics.dayChangePct, 2, true)} · ${listed.length} positions`
              : `${listed.length} positions · live prices`}
          </span>
        </div>
        <div className="personal-portfolio__home-metrics">
          <div className="personal-portfolio__home-metric">
            <span className="personal-portfolio__home-metric-label">Index &amp; bond ETFs</span>
            <span className="personal-portfolio__home-metric-value">{formatPct(indexWeight, 2)}</span>
            <span className="personal-portfolio__home-metric-sub">VOO, QQQ, VTIP weight</span>
          </div>
          <div className="personal-portfolio__home-metric">
            <span className="personal-portfolio__home-metric-label">Largest sector</span>
            <span className="personal-portfolio__home-metric-value">
              {topSector ? formatPct(topSector.weightPct, 2) : '—'}
            </span>
            <span className="personal-portfolio__home-metric-sub">
              {topSector?.sector ?? 'Allocation'}
            </span>
          </div>
          <div className="personal-portfolio__home-metric">
            <span className="personal-portfolio__home-metric-label">Market sensitivity</span>
            <span className="personal-portfolio__home-metric-value">
              {analytics.risk.beta != null ? analytics.risk.beta.toFixed(2) : '—'}
            </span>
            <span className="personal-portfolio__home-metric-sub">
              {analytics.risk.annualizedVolatilityPct != null
                ? `Beta · ${formatPct(analytics.risk.annualizedVolatilityPct, 2)} vol`
                : 'Beta vs SPY'}
            </span>
          </div>
        </div>
      </div>

      <div className="personal-portfolio__home-allocation">
        <h3 className="personal-portfolio__home-allocation-title">Current allocation</h3>
        <div className="personal-portfolio__home-bar-header" aria-hidden="true">
          <span className="personal-portfolio__home-bar-header-label personal-portfolio__home-bar-header-label--holding">
            Holding
          </span>
          <span className="personal-portfolio__home-bar-header-label">Return</span>
          <span className="personal-portfolio__home-bar-header-label">Weight</span>
        </div>
        <ul className="personal-portfolio__home-bars" aria-label="Top five holdings by weight">
          {topHoldings.map((h, i) => {
            const perf = perfByTicker.get(h.ticker);
            const hasReturn = perf != null && perf.avgCost > 0;
            const returnPct = perf?.unrealizedGainPct;
            return (
              <li key={h.ticker} className="personal-portfolio__home-bar-row">
                <span className="personal-portfolio__home-bar-ticker">{h.ticker}</span>
                <span
                  className={`personal-portfolio__home-bar-return ${
                    hasReturn
                      ? returnPct! >= 0
                        ? 'personal-portfolio__gain--positive'
                        : 'personal-portfolio__gain--negative'
                      : ''
                  }`}
                >
                  {hasReturn ? formatPct(returnPct!, 2, true) : '—'}
                </span>
                <span className="personal-portfolio__home-bar-pct">{formatPct(h.weightPct)}</span>
                <div className="personal-portfolio__home-bar-track" aria-hidden="true">
                  <div
                    className="personal-portfolio__home-bar-fill"
                    style={{
                      width: `${Math.max(4, (h.weightPct / maxWeight) * 100)}%`,
                      backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <div className="personal-portfolio__home-sectors" aria-label="Sector mix">
          {sectors.slice(0, 4).map(({ sector, weightPct }) => (
            <span key={sector} className="personal-portfolio__home-sector-chip">
              {sector} {formatPct(weightPct)}
            </span>
          ))}
        </div>
      </div>

      <Link to="/portfolio" className="personal-portfolio__view-more">
        {PERSONAL_PORTFOLIO.homeCta}
        <span className="personal-portfolio__view-more-arrow" aria-hidden="true">
          →
        </span>
      </Link>
    </div>
  );
}
