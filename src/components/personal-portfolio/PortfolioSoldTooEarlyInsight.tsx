import type { PortfolioAnalytics } from '../../utils/computePortfolioAnalytics';
import type { QuoteMap } from '../../utils/yahooSymbols';
import { soldTradeCounterfactualHighlights } from '../../utils/portfolioInsights';
import { formatDateDisplay, formatPct } from '../../utils/parsePersonalPortfolioCsv';

interface PortfolioSoldTooEarlyInsightProps {
  analytics: PortfolioAnalytics;
  quotes: QuoteMap;
}

function CounterfactualCard({
  label,
  ticker,
  realizedGainPct,
  sinceSellPct,
  sellDate,
  tone,
  sub,
}: {
  label: string;
  ticker: string;
  realizedGainPct: number;
  sinceSellPct: number;
  sellDate: string;
  tone: 'positive' | 'negative';
  sub: string;
}) {
  return (
    <div className="personal-portfolio__insight-card">
      <span className="personal-portfolio__insight-label">{label}</span>
      <span
        className={`personal-portfolio__insight-value personal-portfolio__insight-value--${tone}`}
      >
        {ticker} {formatPct(sinceSellPct, 2, true)} since sale
      </span>
      <span className="personal-portfolio__insight-sub">
        Sold {formatDateDisplay(sellDate)} · realized {formatPct(realizedGainPct, 2, true)}
      </span>
      <span className="personal-portfolio__insight-sub">{sub}</span>
    </div>
  );
}

export function PortfolioSoldTooEarlyInsight({
  analytics,
  quotes,
}: PortfolioSoldTooEarlyInsightProps) {
  const { leftOnTable, timedExit } = soldTradeCounterfactualHighlights(
    analytics.closedTrades,
    quotes
  );
  if (!leftOnTable && !timedExit) return null;

  const sameTrade =
    leftOnTable &&
    timedExit &&
    leftOnTable.ticker === timedExit.ticker &&
    leftOnTable.sellDate === timedExit.sellDate;

  return (
    <section
      className="personal-portfolio__insights"
      aria-labelledby="portfolio-sold-counterfactual-heading"
    >
      <h3 id="portfolio-sold-counterfactual-heading" className="personal-portfolio__insights-heading">
        Exit timing vs today
      </h3>
      <p className="personal-portfolio__insights-caption">
        Hypothetical: compares each sell price to today&apos;s live quote. Not investment advice.
      </p>
      <div className="personal-portfolio__insights-grid personal-portfolio__insights-grid--duo">
        {leftOnTable && (
          <CounterfactualCard
            label="Left on the table"
            ticker={leftOnTable.ticker}
            realizedGainPct={leftOnTable.realizedGainPct}
            sinceSellPct={leftOnTable.sinceSellPct}
            sellDate={leftOnTable.sellDate}
            tone="positive"
            sub="Price has risen since the exit."
          />
        )}
        {timedExit && !sameTrade && (
          <CounterfactualCard
            label="Timed the exit"
            ticker={timedExit.ticker}
            realizedGainPct={timedExit.realizedGainPct}
            sinceSellPct={timedExit.sinceSellPct}
            sellDate={timedExit.sellDate}
            tone="negative"
            sub="Price has fallen since the exit."
          />
        )}
      </div>
    </section>
  );
}
