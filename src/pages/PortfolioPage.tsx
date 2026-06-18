import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SITE_DEFAULT_TITLE, SITE_NAME } from '../constants/site';
import { usePersonalPortfolioData } from '../hooks/usePersonalPortfolioData';
import { PersonalPortfolioContent } from '../components/personal-portfolio/PersonalPortfolioContent';
import { PortfolioSubnav } from '../components/personal-portfolio/PortfolioSubnav';
import { PortfolioLiveQuoteBadge } from '../components/personal-portfolio/PortfolioLiveQuoteBadge';
import { PortfolioVerificationBadge } from '../components/personal-portfolio/PortfolioVerificationBadge';
import { PortfolioMethodologyDrawer } from '../components/personal-portfolio/PortfolioMethodologyDrawer';
import { PortfolioSuggestionsPanel } from '../components/personal-portfolio/PortfolioSuggestionsPanel';
import { PERSONAL_PORTFOLIO } from '../data/personalPortfolio';

export function PortfolioPage() {
  const { status, data } = usePersonalPortfolioData();
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  useEffect(() => {
    document.title = `${PERSONAL_PORTFOLIO.pageTitle} | ${SITE_NAME}`;
    return () => {
      document.title = SITE_DEFAULT_TITLE;
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const asOfDisplay = data?.meta.asOfDisplay ?? PERSONAL_PORTFOLIO.fallbackAsOfDisplay;

  return (
    <div className="project-page project-page--portfolio">
      <nav className="project-page__nav" aria-label="Portfolio navigation">
        <Link to="/#investment-portfolio" className="project-page__nav-back">
          <span className="project-page__nav-back-arrow" aria-hidden="true">
            ←
          </span>
          {PERSONAL_PORTFOLIO.sectionTitle}
        </Link>
        <span className="project-page__nav-sep" aria-hidden="true">
          /
        </span>
        <span className="project-page__nav-current">Analytics</span>
      </nav>
      <main className="project-page__main">
        <p className="personal-portfolio__eyebrow personal-portfolio__eyebrow--page">
          Analytics dashboard
        </p>
        <h1 className="project-page__title">{PERSONAL_PORTFOLIO.pageTitle}</h1>
        <p className="project-page__desc">{PERSONAL_PORTFOLIO.pageDescription}</p>
        <p className="project-page__meta">
          {PERSONAL_PORTFOLIO.pageMeta} · Data as of {asOfDisplay}
        </p>

        {status === 'ok' && data && (
          <>
            <PortfolioVerificationBadge
              meta={data.meta}
              onOpenMethodology={() => setMethodologyOpen(true)}
            />
            <PortfolioLiveQuoteBadge meta={data.liveQuotes} />
            <PortfolioSubnav />
          </>
        )}

        {status === 'loading' && (
          <div className="personal-portfolio__state personal-portfolio__state--loading">
            Loading portfolio data…
          </div>
        )}

        {status === 'error' && (
          <div className="personal-portfolio__state personal-portfolio__state--error">
            <p>
              Could not load portfolio data. Add CSV files to{' '}
              <code>public/data/personal-portfolio/</code>.
            </p>
          </div>
        )}

        {status === 'ok' && data && <PersonalPortfolioContent data={data} showIntro />}

        <PortfolioSuggestionsPanel boxSlug="portfolio" />

        <PortfolioMethodologyDrawer
          open={methodologyOpen}
          onClose={() => setMethodologyOpen(false)}
        />
      </main>
    </div>
  );
}
