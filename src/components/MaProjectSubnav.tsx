const LINKS = [
  { href: '#ma-overview', label: 'Overview' },
  { href: '#ma-valuation', label: 'Valuation' },
  { href: '#ma-economics', label: 'Deal economics' },
  { href: '#ma-financing', label: 'Financing' },
  { href: '#ma-model', label: 'Model' },
] as const;

export function MaProjectSubnav() {
  return (
    <nav className="ma-project__subnav" aria-label="On this page">
      {LINKS.map(({ href, label }) => (
        <a key={href} href={href}>
          {label}
        </a>
      ))}
    </nav>
  );
}
