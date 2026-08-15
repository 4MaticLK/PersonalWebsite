import { formatPct } from '../../utils/parsePersonalPortfolioCsv';
import { computeThemeWeights } from '../../utils/portfolioThematics';
import type { HoldingRow } from '../../utils/parsePersonalPortfolioCsv';

interface PortfolioThematicConcentrationsProps {
  holdings: HoldingRow[];
}

export function PortfolioThematicConcentrations({ holdings }: PortfolioThematicConcentrationsProps) {
  const themes = computeThemeWeights(holdings);

  return (
    <section
      className="personal-portfolio__insights"
      aria-labelledby="portfolio-themes-heading"
    >
      <h3 id="portfolio-themes-heading" className="personal-portfolio__insights-heading">
        Thematic concentrations
      </h3>
      <p className="personal-portfolio__insights-caption">
        Cross-cutting exposures that cut across sector labels — the sector chart below can look
        diversified even when a theme like this is concentrated, so worth monitoring together.
      </p>
      <div className="personal-portfolio__insights-grid">
        {themes.map(({ theme, weightPct, tickersHeld }) => (
          <div key={theme.id} className="personal-portfolio__insight-card">
            <span className="personal-portfolio__insight-label">{theme.label}</span>
            <span className="personal-portfolio__insight-value">{formatPct(weightPct, 1)}</span>
            <span className="personal-portfolio__insight-sub">{theme.description}</span>
            <span className="personal-portfolio__insight-sub personal-portfolio__insight-sub--tickers">
              {tickersHeld.join(' · ')}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
