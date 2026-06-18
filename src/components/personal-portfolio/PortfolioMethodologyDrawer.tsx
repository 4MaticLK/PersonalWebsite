import { useEffect, useRef } from 'react';
import { PERSONAL_PORTFOLIO } from '../../data/personalPortfolio';
import { METHODOLOGY_VERSION } from '../../utils/portfolioMeta';

interface PortfolioMethodologyDrawerProps {
  open: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    title: 'Current holdings',
    body:
      'Open positions from the latest Robinhood export. Weights and returns use FIFO average cost from transaction history. Prices refresh from Yahoo Finance about every minute when a public quote exists; otherwise the CSV statement price is kept.',
  },
  {
    title: 'Lifetime returns',
    body:
      'Net return and alpha vs SPY are money-weighted on capital deployed through recorded buys (including dividends in net return). SPY comparison invests the same cash on the same dates. If deposit rows are missing from the export, lifetime metrics still run on buy capital only — see Data notes when that applies.',
  },
  {
    title: 'Holdings backtest chart',
    body:
      'The performance chart does not replay your actual historical account balance. It simulates holding today’s share counts over time at historical prices, compared to SPY over the same window. The pulsing dot extends the series with today’s live move when quotes are available.',
  },
  {
    title: 'Risk metrics',
    body:
      'Beta, volatility, Sharpe, and concentration use the same time-weighted return series as the backtest chart. Position-level metrics exclude tickers without enough price history.',
  },
  {
    title: 'Verification',
    body:
      'After each CSV sync, run npm run verify:portfolio locally. That replays FIFO analytics, checks weights and data flags, and updates meta.json with a verification timestamp shown on this page.',
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
