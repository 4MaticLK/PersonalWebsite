/** Pick Yahoo chart range from portfolio inception date. */
export function chartRangeForInception(inceptionIso: string): '6mo' | '1y' | '2y' | '5y' | 'max' {
  const start = new Date(inceptionIso + 'T12:00:00');
  const months =
    (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
  if (months <= 6) return '6mo';
  if (months <= 12) return '1y';
  if (months <= 24) return '2y';
  if (months <= 60) return '5y';
  return 'max';
}
