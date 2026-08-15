import { useCallback, useState } from 'react';
import { PERSONAL_PORTFOLIO } from '../../data/personalPortfolio';
import type { PersonalPortfolioData } from '../../hooks/usePersonalPortfolioData';
import type { PortfolioFilter } from '../../utils/portfolioFilter';
import { PortfolioFraming } from './PortfolioFraming';
import { PortfolioSummaryStats } from './PortfolioSummaryStats';
import { PortfolioReturnsChart } from './PortfolioReturnsChart';
import { PortfolioAllocationChart } from './PortfolioAllocationChart';
import { PortfolioRiskFactors } from './PortfolioRiskFactors';
import { PortfolioMeasuredRisk } from './PortfolioMeasuredRisk';
import { PortfolioHoldingsTable } from './PortfolioHoldingsTable';
import { PortfolioThematicConcentrations } from './PortfolioThematicConcentrations';
import { PortfolioRebalancingPanel } from './PortfolioRebalancingPanel';
import { PortfolioAnchorEngineInsight } from './PortfolioAnchorEngineInsight';
import { PortfolioClosedTradeInsight } from './PortfolioClosedTradeInsight';
import { PortfolioSoldTooEarlyInsight } from './PortfolioSoldTooEarlyInsight';

interface PersonalPortfolioContentProps {
  data: PersonalPortfolioData;
  /** When true, show framing and disclaimer (full page). */
  showIntro?: boolean;
}

export function PersonalPortfolioContent({ data, showIntro = false }: PersonalPortfolioContentProps) {
  const { summary, holdings, analytics, modelAnalytics, liveQuotes, quotes } = data;
  const [filter, setFilter] = useState<PortfolioFilter | null>(null);

  const toggleTicker = useCallback((ticker: string) => {
    setFilter((prev) =>
      prev?.kind === 'ticker' && prev.value === ticker ? null : { kind: 'ticker', value: ticker }
    );
  }, []);

  return (
    <>
      {showIntro && (
        <>
          <PortfolioFraming />
          <p className="personal-portfolio__disclaimer">{PERSONAL_PORTFOLIO.disclaimer}</p>
        </>
      )}

      {filter && (
        <div className="personal-portfolio__filter-bar" role="status">
          Highlighting:{' '}
          <strong>{filter.kind === 'ticker' ? filter.value : `${filter.value} sector`}</strong>
          <button
            type="button"
            className="personal-portfolio__filter-clear"
            onClick={() => setFilter(null)}
          >
            Clear
          </button>
        </div>
      )}

      <div id="portfolio-holdings">
        <PortfolioHoldingsTable
          holdings={holdings}
          analytics={analytics}
          filter={filter}
          onSelectTicker={toggleTicker}
        />
      </div>

      <div id="portfolio-summary">
        <PortfolioSummaryStats modelAnalytics={modelAnalytics} />
        <PortfolioThematicConcentrations holdings={holdings} />
        <PortfolioAnchorEngineInsight analytics={analytics} />
        <PortfolioRebalancingPanel holdings={holdings} />
        <PortfolioClosedTradeInsight analytics={analytics} />
        <PortfolioSoldTooEarlyInsight analytics={analytics} quotes={quotes} />
      </div>

      <div id="portfolio-returns" className="personal-portfolio__charts-grid">
        <PortfolioAllocationChart holdings={holdings} summary={summary} filter={filter} />
        <PortfolioReturnsChart analytics={analytics} liveQuotes={liveQuotes} />
      </div>

      <div id="portfolio-risk">
        <PortfolioMeasuredRisk analytics={analytics} />
        <PortfolioRiskFactors modelAnalytics={modelAnalytics} />
      </div>
    </>
  );
}
