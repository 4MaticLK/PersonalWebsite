import { useCallback, useEffect, useState } from 'react';
import { PERSONAL_PORTFOLIO } from '../../data/personalPortfolio';
import type { PersonalPortfolioData } from '../../hooks/usePersonalPortfolioData';
import type { PortfolioFilter } from '../../utils/portfolioFilter';
import { PortfolioFraming } from './PortfolioFraming';
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
import { PortfolioSubnav, PORTFOLIO_SECTIONS, type PortfolioSectionId } from './PortfolioSubnav';

interface PersonalPortfolioContentProps {
  data: PersonalPortfolioData;
  /** When true, show framing, disclaimer, and the section tabs (full page). */
  showIntro?: boolean;
}

function sectionFromHash(): PortfolioSectionId {
  if (typeof window === 'undefined') return 'portfolio-holdings';
  const hash = window.location.hash.replace('#', '');
  return PORTFOLIO_SECTIONS.some((s) => s.id === hash)
    ? (hash as PortfolioSectionId)
    : 'portfolio-holdings';
}

export function PersonalPortfolioContent({ data, showIntro = false }: PersonalPortfolioContentProps) {
  const { summary, holdings, analytics, modelAnalytics, liveQuotes, quotes } = data;
  const [filter, setFilter] = useState<PortfolioFilter | null>(null);
  const [activeSection, setActiveSection] = useState<PortfolioSectionId>(sectionFromHash);

  useEffect(() => {
    const onHashChange = () => setActiveSection(sectionFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const selectSection = useCallback((id: PortfolioSectionId) => {
    setActiveSection(id);
    window.history.replaceState(null, '', `#${id}`);
  }, []);

  const toggleTicker = useCallback((ticker: string) => {
    setFilter((prev) =>
      prev?.kind === 'ticker' && prev.value === ticker ? null : { kind: 'ticker', value: ticker }
    );
  }, []);

  return (
    <>
      {showIntro && <PortfolioSubnav active={activeSection} onSelect={selectSection} />}

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

      {activeSection === 'portfolio-holdings' && (
        <div id="portfolio-holdings" role="tabpanel" aria-labelledby="portfolio-holdings-tab">
          <PortfolioHoldingsTable
            holdings={holdings}
            analytics={analytics}
            filter={filter}
            onSelectTicker={toggleTicker}
          />
        </div>
      )}

      {activeSection === 'portfolio-summary' && (
        <div id="portfolio-summary" role="tabpanel" aria-labelledby="portfolio-summary-tab">
          <PortfolioThematicConcentrations holdings={holdings} />
          <PortfolioAnchorEngineInsight analytics={analytics} />
          <PortfolioRebalancingPanel holdings={holdings} />
          <PortfolioClosedTradeInsight analytics={analytics} />
          <PortfolioSoldTooEarlyInsight analytics={analytics} quotes={quotes} />
        </div>
      )}

      {activeSection === 'portfolio-returns' && (
        <div
          id="portfolio-returns"
          role="tabpanel"
          aria-labelledby="portfolio-returns-tab"
          className="personal-portfolio__charts-grid"
        >
          <PortfolioAllocationChart holdings={holdings} summary={summary} filter={filter} />
          <PortfolioReturnsChart analytics={analytics} liveQuotes={liveQuotes} />
        </div>
      )}

      {activeSection === 'portfolio-risk' && (
        <div id="portfolio-risk" role="tabpanel" aria-labelledby="portfolio-risk-tab">
          <PortfolioMeasuredRisk analytics={analytics} />
          <PortfolioRiskFactors modelAnalytics={modelAnalytics} />
        </div>
      )}
    </>
  );
}
