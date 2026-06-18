/** Cross-section highlight for allocation / holdings / risk. */
export type PortfolioFilter =
  | { kind: 'ticker'; value: string }
  | { kind: 'sector'; value: string };

export function matchesPortfolioFilter(
  filter: PortfolioFilter | null,
  ticker: string,
  sector: string
): boolean {
  if (!filter) return true;
  if (filter.kind === 'ticker') return filter.value === ticker;
  return filter.value === sector;
}

export function isPortfolioFilterActive(
  filter: PortfolioFilter | null,
  ticker: string,
  sector: string
): boolean {
  if (!filter) return false;
  return matchesPortfolioFilter(filter, ticker, sector);
}
