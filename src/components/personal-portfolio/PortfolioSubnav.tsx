const SECTIONS = [
  { id: 'portfolio-holdings', label: 'Holdings' },
  { id: 'portfolio-summary', label: 'Returns' },
  { id: 'portfolio-returns', label: 'Charts' },
  { id: 'portfolio-risk', label: 'Risk' },
] as const;

export function PortfolioSubnav() {
  return (
    <nav className="portfolio-subnav" aria-label="Portfolio sections">
      {SECTIONS.map(({ id, label }) => (
        <a key={id} href={`#${id}`} className="portfolio-subnav__link">
          {label}
        </a>
      ))}
    </nav>
  );
}
