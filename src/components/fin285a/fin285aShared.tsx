export const TRAIN_TEST_SPLIT = '2019-01-02';
export const REGIME_SPLIT = '2022-01-01';

export const CHART_LEGEND_PROPS = {
  wrapperStyle: { paddingTop: 8 },
  iconType: 'line' as const,
  iconSize: 10,
  formatter: (value: string) => (
    <span className="portfolio-chart__legend-text">{value}</span>
  ),
};

export const PART1_LEVERAGE = 2;
export const PART1_WEIGHT_SERIES = [
  { key: 'AGG' as const, label: 'Nominal Bonds (AGG)', color: '#94a3b8' },
  { key: 'ACWI' as const, label: 'Global Equities (ACWI)', color: '#38bdf8' },
  { key: 'GSG' as const, label: 'Commodities (GSG)', color: '#c9a227' },
  { key: 'TIP' as const, label: 'Inflation-Linked Bonds (TIP)', color: '#34d399' },
] as const;

export type Part1WeightKey = (typeof PART1_WEIGHT_SERIES)[number]['key'];

export const PART1_WEIGHT_Y_TICKS = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

export function correlationColor(r: number): string {
  const t = (r + 1) / 2;
  if (t <= 0.5) {
    const s = t * 2;
    return `rgba(248, 113, 113, ${0.15 + 0.35 * (1 - s)})`;
  }
  const s = (t - 0.5) * 2;
  return `rgba(56, 189, 248, ${0.15 + 0.35 * s})`;
}
