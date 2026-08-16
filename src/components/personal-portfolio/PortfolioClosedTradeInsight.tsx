import type { PortfolioAnalytics } from '../../utils/computePortfolioAnalytics';
import { closedTradeHighlights } from '../../utils/portfolioInsights';
import { formatDateDisplay, formatPct } from '../../utils/parsePersonalPortfolioCsv';

interface PortfolioClosedTradeInsightProps {
  analytics: PortfolioAnalytics;
}

function TradeHighlight({
  label,
  ticker,
  gainPct,
  sellDate,
  tone,
}: {
  label: string;
  ticker: string;
  gainPct: number;
  sellDate: string;
  tone: 'positive' | 'negative';
}) {
  return (
    <div className="personal-portfolio__insight-card">
      <span className="personal-portfolio__insight-label">{label}</span>
      <span
        className={`personal-portfolio__insight-value personal-portfolio__insight-value--${tone}`}
      >
        {ticker} {formatPct(gainPct, 2, true)}
      </span>
      <span className="personal-portfolio__insight-sub">Closed {formatDateDisplay(sellDate)}</span>
    </div>
  );
}

export function PortfolioClosedTradeInsight({ analytics }: PortfolioClosedTradeInsightProps) {
  const { best, worst } = closedTradeHighlights(analytics.closedTrades);
  if (!best || !worst) return null;

  const sameTrade =
    best.ticker === worst.ticker &&
    best.sellDate === worst.sellDate &&
    Math.abs(best.gainPct - worst.gainPct) < 0.001;

  return (
    <section className="personal-portfolio__insights" aria-labelledby="portfolio-closed-trades-heading">
      <h3 id="portfolio-closed-trades-heading" className="personal-portfolio__insights-heading">
        Closed trade highlights
      </h3>
      <p className="personal-portfolio__insights-caption">
        Best and worst tracked round-trips from FIFO cost basis: percentages only, no position
        sizes.
      </p>
      <div className="personal-portfolio__insights-grid personal-portfolio__insights-grid--duo">
        <TradeHighlight
          label="Best closed trade"
          ticker={best.ticker}
          gainPct={best.gainPct}
          sellDate={best.sellDate}
          tone="positive"
        />
        {!sameTrade && (
          <TradeHighlight
            label="Worst closed trade"
            ticker={worst.ticker}
            gainPct={worst.gainPct}
            sellDate={worst.sellDate}
            tone="negative"
          />
        )}
      </div>
    </section>
  );
}
