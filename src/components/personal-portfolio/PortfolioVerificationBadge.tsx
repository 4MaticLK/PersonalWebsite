import type { PortfolioMeta } from '../../utils/portfolioMeta';

interface PortfolioVerificationBadgeProps {
  meta: PortfolioMeta | null;
  onOpenMethodology: () => void;
}

function formatVerifiedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function PortfolioVerificationBadge({
  meta,
  onOpenMethodology,
}: PortfolioVerificationBadgeProps) {
  const stale = meta?.verifyWarnings.includes('verify_stale');
  const verifiedAt = meta?.verifiedAt;

  let statusClass = 'personal-portfolio__verify-badge--warn';
  let icon = '!';
  let message = 'Analytics not verified — sync CSVs and run verify:portfolio';

  if (verifiedAt && !stale) {
    if (meta?.verifyPassed) {
      statusClass = 'personal-portfolio__verify-badge--ok';
      icon = '✓';
      message = `Verified analytics · ${formatVerifiedAt(verifiedAt)}`;
    } else {
      statusClass = 'personal-portfolio__verify-badge--note';
      icon = 'i';
      message = `Verified with data notes · ${formatVerifiedAt(verifiedAt)}`;
    }
  }

  return (
    <div className="personal-portfolio__trust-bar">
      <p className={`personal-portfolio__verify-badge ${statusClass}`} role="status">
        <span className="personal-portfolio__verify-icon" aria-hidden="true">
          {icon}
        </span>
        <span>
          {message}
          {meta?.transactionCount ? (
            <>
              {' '}
              · {meta.transactionCount} transactions · {meta.holdingCount} holdings
            </>
          ) : null}
        </span>
      </p>
      <button
        type="button"
        className="personal-portfolio__methodology-btn"
        onClick={onOpenMethodology}
      >
        How numbers are computed
      </button>
    </div>
  );
}
