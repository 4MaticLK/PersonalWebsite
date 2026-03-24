import { Link } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { PROJECTS } from '../data/projects';

const PROJECT_TAGS: Record<string, string[]> = {
  'goodyear-equity-research-valuation': ['Equity Research', 'DCF Valuation', 'PDF Report'],
  'financial-markets-and-investments': ['Portfolio Analysis', 'Quantitative', 'Interactive Charts'],
  'mergers-and-acquisitions': ['M&A', 'DCF', 'Excel Model'],
  'research-paper': ['International Finance', 'Macro Research', 'PDF'],
};

export function WorkSection() {
  const { revealRef, isVisible } = useScrollReveal();

  return (
    <section
      id="academic-projects"
      ref={revealRef}
      className={`page-section page-section--fullscreen page-section--auto-height work-section scroll-reveal ${isVisible ? 'scroll-reveal--visible' : ''}`}
    >
      <div className="page-section__scroll">
        <div className="page-section__scroll-inner">
          <h2 className="work-section__title">Academic Projects</h2>
          <p className="work-section__intro">
            Selected academic projects and models. Click a card to explore.
          </p>
          <div className="work-section__grid">
            {PROJECTS.map((project) => {
              const tags = PROJECT_TAGS[project.slug] ?? [];
              return (
                <Link
                  key={project.slug}
                  to={`/work/${project.slug}`}
                  className="work-section__card"
                >
                  {tags.length > 0 && (
                    <div className="work-section__card-tags" aria-label="Project tags">
                      {tags.map((tag) => (
                        <span key={tag} className="work-section__card-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h3 className="work-section__card-title">{project.name}</h3>
                  <p className="work-section__card-desc">{project.shortDescription}</p>
                  <span className="work-section__card-link">
                    View project{' '}
                    <span className="work-section__card-arrow" aria-hidden>
                      →
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
          <a href="#skills-and-activities" className="experience-section__cta">
            See skills & activities
            <span className="experience-section__cta-arrow" aria-hidden>
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
