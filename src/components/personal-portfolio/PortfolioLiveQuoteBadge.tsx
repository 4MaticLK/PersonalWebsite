import type { LiveQuotesMeta } from '../../utils/applyLiveQuotes';

interface PortfolioLiveQuoteBadgeProps {
  meta: LiveQuotesMeta;
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

export function PortfolioLiveQuoteBadge({ meta }: PortfolioLiveQuoteBadgeProps) {
  const { mode, fetchedAt, source, staticTickers } = meta;

  const label =
    mode === 'live'
      ? 'Live prices'
      : mode === 'partial'
        ? 'Mixed live & statement prices'
        : 'Statement prices';

  const detail =
    mode === 'partial' && staticTickers.length
      ? `${staticTickers.join(', ')} use statement prices (no public quote).`
      : mode === 'live' && fetchedAt
        ? `Updated ${formatUpdatedAt(fetchedAt)} · refreshes every minute`
        : fetchedAt
          ? `Last attempt ${formatUpdatedAt(fetchedAt)}`
          : 'Live feed unavailable, showing statement prices.';

  return (
    <p className="personal-portfolio__live-badge" role="status">
      <span
        className={`personal-portfolio__live-dot personal-portfolio__live-dot--${mode}`}
        aria-hidden="true"
      />
      <span>
        <strong>{label}</strong>
        {source ? ` · ${source}` : ''}
        {detail ? ` · ${detail}` : ''}
      </span>
    </p>
  );
}
