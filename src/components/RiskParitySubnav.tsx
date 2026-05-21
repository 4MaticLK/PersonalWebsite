const LINKS = [
  { href: '#rp-overview', label: 'Overview' },
  { href: '#rp-part-1', label: 'Part 1' },
  { href: '#rp-regime', label: 'Regime' },
  { href: '#rp-part-2', label: 'Part 2' },
  { href: '#rp-validation', label: 'Validation' },
  { href: '#rp-replicate', label: 'Code' },
] as const;

export function RiskParitySubnav() {
  return (
    <nav className="risk-parity__subnav" aria-label="On this page">
      {LINKS.map(({ href, label }) => (
        <a key={href} href={href}>
          {label}
        </a>
      ))}
    </nav>
  );
}
