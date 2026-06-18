import { useScrollReveal } from '../hooks/useScrollReveal';
import { usePersonalPortfolioData } from '../hooks/usePersonalPortfolioData';
import { PERSONAL_PORTFOLIO } from '../data/personalPortfolio';
import { PortfolioHomePreview } from './personal-portfolio/PortfolioHomePreview';
import { PortfolioLiveQuoteBadge } from './personal-portfolio/PortfolioLiveQuoteBadge';

export function PersonalPortfolioSection() {
  const { revealRef, isVisible } = useScrollReveal();
  const { status, data } = usePersonalPortfolioData();

  return (
    <section
      id="investment-portfolio"
      ref={revealRef}
      className={`page-section page-section--fullscreen page-section--auto-height personal-portfolio scroll-reveal ${isVisible ? 'scroll-reveal--visible' : ''}`}
      aria-labelledby="investment-portfolio-heading"
    >
      <div className="page-section__scroll">
        <div className="page-section__scroll-inner">
          <p className="personal-portfolio__eyebrow">{PERSONAL_PORTFOLIO.sectionTitle}</p>
          <h2 id="investment-portfolio-heading" className="experience-section__title">
            Real account, live analytics
          </h2>
          <p className="personal-portfolio__intro personal-portfolio__intro--section">
            {PERSONAL_PORTFOLIO.sectionIntro}
          </p>

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

          {status === 'ok' && data && (
            <>
              <PortfolioLiveQuoteBadge meta={data.liveQuotes} />
              <PortfolioHomePreview data={data} />
            </>
          )}

          <a href="#academic-projects" className="experience-section__cta">
            See academic projects
            <span className="experience-section__cta-arrow" aria-hidden>
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
