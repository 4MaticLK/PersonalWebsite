export const PORTFOLIO_SECTIONS = [
  { id: 'portfolio-holdings', label: 'Holdings' },
  { id: 'portfolio-summary', label: 'Profile' },
  { id: 'portfolio-returns', label: 'Charts' },
  { id: 'portfolio-risk', label: 'Risk' },
] as const;

export type PortfolioSectionId = (typeof PORTFOLIO_SECTIONS)[number]['id'];

interface PortfolioSubnavProps {
  active: PortfolioSectionId;
  onSelect: (id: PortfolioSectionId) => void;
}

export function PortfolioSubnav({ active, onSelect }: PortfolioSubnavProps) {
  return (
    <nav className="portfolio-subnav" aria-label="Portfolio sections" role="tablist">
      {PORTFOLIO_SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={`${id}-tab`}
          aria-selected={active === id}
          aria-controls={id}
          className={`portfolio-subnav__link ${active === id ? 'portfolio-subnav__link--active' : ''}`}
          onClick={() => onSelect(id)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
