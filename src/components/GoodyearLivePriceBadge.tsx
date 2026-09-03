import type { GoodyearLiveQuote, GoodyearQuoteStatus } from '../hooks/useGoodyearLiveQuote';

interface GoodyearLivePriceBadgeProps {
  quote: GoodyearLiveQuote | null;
  status: GoodyearQuoteStatus;
  /** Close the report was written against, used when the live feed is unavailable. */
  modelClose: number;
  modelCloseLabel: string;
}

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function GoodyearLivePriceBadge({
  quote,
  status,
  modelClose,
  modelCloseLabel,
}: GoodyearLivePriceBadgeProps) {
  if (status === 'live' && quote) {
    const change = quote.previousClose != null ? quote.price - quote.previousClose : null;
    const changePct =
      change != null && quote.previousClose ? (change / quote.previousClose) * 100 : null;
    const direction = change == null ? 'flat' : change >= 0 ? 'up' : 'down';

    return (
      <p className="goodyear-live-badge" role="status">
        <span className="goodyear-live-badge__dot" aria-hidden="true" />
        <span className="goodyear-live-badge__ticker">GT</span>
        <span className="goodyear-live-badge__price">${quote.price.toFixed(2)}</span>
        {change != null && changePct != null && (
          <span className={`goodyear-live-badge__change goodyear-live-badge__change--${direction}`}>
            {change >= 0 ? '+' : '−'}
            {Math.abs(change).toFixed(2)} ({change >= 0 ? '+' : '−'}
            {Math.abs(changePct).toFixed(2)}%)
          </span>
        )}
        <span className="goodyear-live-badge__meta">
          Live · {quote.source} · {formatUpdatedAt(quote.fetchedAt)}
        </span>
      </p>
    );
  }

  if (status === 'loading') {
    return (
      <p className="goodyear-live-badge goodyear-live-badge--muted" role="status">
        <span
          className="goodyear-live-badge__dot goodyear-live-badge__dot--idle"
          aria-hidden="true"
        />
        <span className="goodyear-live-badge__meta">Fetching live GT price…</span>
      </p>
    );
  }

  return (
    <p className="goodyear-live-badge goodyear-live-badge--muted" role="status">
      <span
        className="goodyear-live-badge__dot goodyear-live-badge__dot--idle"
        aria-hidden="true"
      />
      <span className="goodyear-live-badge__meta">
        Live price unavailable · using {modelCloseLabel} close (${modelClose.toFixed(2)})
      </span>
    </p>
  );
}
