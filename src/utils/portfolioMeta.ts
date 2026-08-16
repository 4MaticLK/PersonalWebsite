/** Portfolio data freshness & verification (public/data/personal-portfolio/meta.json). */

export const PORTFOLIO_META_PATH = '/data/personal-portfolio/meta.json';
export const METHODOLOGY_VERSION = 1;

export type PortfolioVerifyWarning =
  | 'deposits_incomplete'
  | 'untracked_sells'
  | 'holdings_weight_drift'
  | 'verify_stale';

export interface PortfolioMeta {
  asOf: string;
  asOfDisplay: string;
  syncedAt: string | null;
  verifiedAt: string | null;
  verifyPassed: boolean;
  verifyWarnings: PortfolioVerifyWarning[];
  transactionCount: number;
  holdingCount: number;
  methodologyVersion: number;
}

export function formatAsOfDisplay(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function parsePortfolioMeta(raw: unknown): PortfolioMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.asOf !== 'string' || typeof o.asOfDisplay !== 'string') return null;

  const warnings = Array.isArray(o.verifyWarnings)
    ? o.verifyWarnings.filter(
        (w): w is PortfolioVerifyWarning =>
          w === 'deposits_incomplete' ||
          w === 'untracked_sells' ||
          w === 'holdings_weight_drift' ||
          w === 'verify_stale'
      )
    : [];

  return {
    asOf: o.asOf,
    asOfDisplay: o.asOfDisplay,
    syncedAt: typeof o.syncedAt === 'string' ? o.syncedAt : null,
    verifiedAt: typeof o.verifiedAt === 'string' ? o.verifiedAt : null,
    verifyPassed: o.verifyPassed === true,
    verifyWarnings: warnings,
    transactionCount: typeof o.transactionCount === 'number' ? o.transactionCount : 0,
    holdingCount: typeof o.holdingCount === 'number' ? o.holdingCount : 0,
    methodologyVersion:
      typeof o.methodologyVersion === 'number' ? o.methodologyVersion : METHODOLOGY_VERSION,
  };
}

export function defaultPortfolioMeta(): PortfolioMeta {
  const asOf = new Date().toISOString().slice(0, 10);
  return {
    asOf,
    asOfDisplay: formatAsOfDisplay(asOf),
    syncedAt: null,
    verifiedAt: null,
    verifyPassed: false,
    verifyWarnings: ['verify_stale'],
    transactionCount: 0,
    holdingCount: 0,
    methodologyVersion: METHODOLOGY_VERSION,
  };
}

export function mergePortfolioMeta(
  existing: PortfolioMeta | null,
  patch: Partial<PortfolioMeta>
): PortfolioMeta {
  const base = existing ?? defaultPortfolioMeta();
  const asOf = patch.asOf ?? base.asOf;
  return {
    ...base,
    ...patch,
    asOf,
    asOfDisplay: patch.asOfDisplay ?? formatAsOfDisplay(asOf),
    verifyWarnings: patch.verifyWarnings ?? base.verifyWarnings,
  };
}

export const VERIFY_WARNING_LABELS: Record<PortfolioVerifyWarning, string> = {
  deposits_incomplete:
    'Deposit history may be incomplete: lifetime returns use deployed buy capital, not full account funding.',
  untracked_sells:
    'Some sells have no matching buy in the export window, excluded from realized return.',
  holdings_weight_drift: 'Holdings weights do not sum to 100%, allocation may be incomplete.',
  verify_stale: 'Analytics have not been verified recently, run npm run verify:portfolio after syncing.',
};
