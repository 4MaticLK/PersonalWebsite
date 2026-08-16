import { useEffect, useRef } from 'react';
import { PERSONAL_PORTFOLIO } from '../../data/personalPortfolio';
import { METHODOLOGY_VERSION } from '../../utils/portfolioMeta';

interface PortfolioMethodologyDrawerProps {
  open: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    title: 'Holdings & prices',
    body:
      'Current positions and weights for the full portfolio. Prices refresh from Yahoo Finance about every minute when a public quote exists; otherwise the CSV fallback price is kept.',
  },
  {
    title: 'Portfolio profile & risk',
    body:
      'Expected return, beta, volatility, Sharpe, risk contribution, and stress scenarios use a single-index model with long-run assumptions per holding. These describe the whole book, not legacy trade history.',
  },
  {
    title: 'Thematic concentrations',
    body:
      'Cross-cutting themes (financials, AI/power, international, speculative) sum weights across defined ticker groups. Overlap across themes is intentional: the same name can appear in multiple themes.',
  },
  {
    title: 'Rebalancing',
    body:
      'Each holding has a target weight. Rebalance when current weight drifts more than 5 percentage points or 25% relative to target, trimming winners or adding to laggards back toward target.',
  },
  {
    title: 'Performance chart',
    body:
      'Simulates holding today’s share counts over time at historical prices, compared to SPY over the same window. The pulsing dot extends the series with today’s live move when quotes are available.',
  },
] as const;

export function PortfolioMethodologyDrawer({ open, onClose }: PortfolioMethodologyDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const benchmark = PERSONAL_PORTFOLIO.benchmarkName;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="personal-portfolio__methodology"
      aria-labelledby="portfolio-methodology-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="personal-portfolio__methodology-panel">
        <header className="personal-portfolio__methodology-header">
          <div>
            <h2 id="portfolio-methodology-title" className="personal-portfolio__methodology-title">
              How numbers are computed
            </h2>
            <p className="personal-portfolio__methodology-intro">
              Methodology v{METHODOLOGY_VERSION} · Benchmark {benchmark} · Not investment advice.
            </p>
          </div>
          <button
            type="button"
            className="personal-portfolio__methodology-close"
            onClick={onClose}
            aria-label="Close methodology"
          >
            ×
          </button>
        </header>
        <div className="personal-portfolio__methodology-body">
          {SECTIONS.map(({ title, body }) => (
            <section key={title} className="personal-portfolio__methodology-section">
              <h3 className="personal-portfolio__methodology-section-title">{title}</h3>
              <p>{body}</p>
            </section>
          ))}
        </div>
      </div>
    </dialog>
  );
}
