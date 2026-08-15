import type { TooltipProps } from 'recharts';

const DATA_BASE = '/data/fin285a';

export interface CumulativeRow {
  date: string;
  [series: string]: string | number;
}

export interface WeightsRow {
  date: string;
  AGG: number;
  ACWI: number;
  GSG: number;
  TIP: number;
}

export interface CorrelationPoint {
  date: string;
  correlation: number;
}

export interface TrackingErrorPoint {
  date: string;
  trackingErrorBps: number;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h.trim()] = (cells[i] ?? '').trim();
    });
    return row;
  });
}

async function fetchCsv(path: string): Promise<string> {
  const res = await fetch(`${DATA_BASE}/${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.text();
}

export async function loadPart1Cumulative(): Promise<CumulativeRow[]> {
  const rows = parseCsv(await fetchCsv('part1_cumulative.csv'));
  return rows.map((r) => ({
    date: r.date,
    riskParity: Number(r.riskParity),
    benchmark: Number(r.benchmark),
  }));
}

export async function loadPart1Weights(): Promise<WeightsRow[]> {
  const rows = parseCsv(await fetchCsv('part1_weights.csv'));
  return rows.map((r) => ({
    date: r.date,
    AGG: Number(r.AGG),
    ACWI: Number(r.ACWI),
    GSG: Number(r.GSG),
    TIP: Number(r.TIP),
  }));
}

export async function loadPart1BondEquityCorr(): Promise<CorrelationPoint[]> {
  const rows = parseCsv(await fetchCsv('part1_bond_equity_corr.csv'));
  return rows.map((r) => ({
    date: r.date,
    correlation: Number(r.correlation),
  }));
}

export async function loadPart2Cumulative(): Promise<CumulativeRow[]> {
  const rows = parseCsv(await fetchCsv('part2_cumulative.csv'));
  return rows.map((r) => ({
    date: r.date,
    optimizedMa: Number(r.optimizedMa),
    benchmark: Number(r.benchmark),
  }));
}

export async function loadPart2RollingTe(): Promise<TrackingErrorPoint[]> {
  const rows = parseCsv(await fetchCsv('part2_rolling_te.csv'));
  return rows.map((r) => ({
    date: r.date,
    trackingErrorBps: Number(r.trackingErrorBps),
  }));
}

export interface Part2TeBenchmarks {
  forecastMaBps: number;
  oosMaBps: number;
  windowDays: number;
}

export async function loadPart2TeBenchmarks(): Promise<Part2TeBenchmarks> {
  const rows = parseCsv(await fetchCsv('part2_te_benchmarks.csv'));
  const row = rows[0];
  if (!row) {
    throw new Error('part2_te_benchmarks.csv is empty');
  }
  const forecastMaBps = Number(row.forecastMaBps);
  const oosMaBps = Number(row.oosMaBps);
  const windowDays = Number(row.windowDays);
  if (!Number.isFinite(forecastMaBps) || !Number.isFinite(oosMaBps) || !Number.isFinite(windowDays)) {
    throw new Error('Invalid part2_te_benchmarks.csv values');
  }
  return { forecastMaBps, oosMaBps, windowDays };
}

/** Histogram bins matching matplotlib `hist(..., bins=40)` on [min, max]. */
export function buildHistogramBins(
  values: number[],
  binCount = 40
): { binMid: number; count: number }[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = (max - min) / binCount;
  const counts = new Array<number>(binCount).fill(0);
  for (const v of values) {
    let idx = Math.floor((v - min) / width);
    if (idx >= binCount) idx = binCount - 1;
    if (idx < 0) idx = 0;
    counts[idx] += 1;
  }
  return counts.map((count, i) => ({
    binMid: min + (i + 0.5) * width,
    count,
  }));
}

export async function loadPart2Correlation(): Promise<{
  labels: string[];
  matrix: number[][];
}> {
  const [labelText, corrText] = await Promise.all([
    fetchCsv('part2_correlation_labels.csv'),
    fetchCsv('part2_correlation.csv'),
  ]);
  const labelRows = parseCsv(labelText);
  const labels = labelRows.map((r) => r.ticker).filter(Boolean);
  const n = labels.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  const index = new Map(labels.map((l, i) => [l, i]));
  for (const r of parseCsv(corrText)) {
    const i = index.get(r.row);
    const j = index.get(r.col);
    if (i == null || j == null) continue;
    matrix[i][j] = Number(r.value);
  }
  return { labels, matrix };
}

export function formatChartDate(iso: string): string {
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function formatChartDateShort(iso: string): string {
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function formatChartYear(iso: string): string {
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  return String(d.getFullYear());
}

export function formatPercentDecimal(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`;
}

/** Inclusive date range label for a cumulative series. */
export function formatChartDateRange(rows: { date: string }[]): string {
  if (rows.length === 0) return '';
  const start = formatChartDate(rows[0].date);
  const end = formatChartDate(rows[rows.length - 1].date);
  return `${start} – ${end}`;
}

export interface CumulativePerformance {
  totalReturn: number;
  /** Annualized realized volatility (matches notebook `perf_stats` vol). */
  realizedRisk: number;
}

/** Period returns from a wealth index (cumprod) series. */
export function periodReturnsFromWealth(rows: CumulativeRow[], key: string): number[] {
  const out: number[] = [];
  for (let i = 1; i < rows.length; i++) {
    const prev = Number(rows[i - 1][key]);
    const curr = Number(rows[i][key]);
    if (prev > 0 && Number.isFinite(prev) && Number.isFinite(curr)) {
      out.push(curr / prev - 1);
    }
  }
  return out;
}

/** Total return and annualized realized vol for one wealth index series. */
export function computeCumulativePerformance(
  rows: CumulativeRow[],
  key: string,
  periodsPerYear: number
): CumulativePerformance {
  const returns = periodReturnsFromWealth(rows, key);
  if (returns.length === 0) {
    return { totalReturn: 0, realizedRisk: 0 };
  }
  const totalReturn = returns.reduce((acc, r) => acc * (1 + r), 1) - 1;
  const n = returns.length;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  let sumSq = 0;
  for (const r of returns) {
    sumSq += (r - mean) ** 2;
  }
  const std = Math.sqrt(sumSq / (n - 1));
  const realizedRisk = std * Math.sqrt(periodsPerYear);
  return { totalReturn, realizedRisk };
}

/** One tick per calendar year (first observation in each year). */
export function firstDatePerYear(dates: string[]): string[] {
  const seen = new Set<number>();
  const ticks: string[] = [];
  for (const date of dates) {
    const y = new Date(`${date}T12:00:00`).getFullYear();
    if (seen.has(y)) continue;
    seen.add(y);
    ticks.push(date);
  }
  return ticks;
}

/** First observation in each year, keeping every `yearStep` years from the series start. */
export function firstDateEveryNYears(dates: string[], yearStep = 2): string[] {
  if (dates.length === 0 || yearStep < 1) return [];
  const byYear = new Map<number, string>();
  for (const date of dates) {
    const y = new Date(`${date}T12:00:00`).getFullYear();
    if (!byYear.has(y)) byYear.set(y, date);
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);
  const startYear = years[0];
  return years
    .filter((y) => (y - startYear) % yearStep === 0)
    .map((y) => byYear.get(y)!);
}

/** Fixed-step axis ticks that bracket [minVal, maxVal]. */
export function buildAxisTicks(minVal: number, maxVal: number, step: number): number[] {
  if (!Number.isFinite(minVal) || !Number.isFinite(maxVal) || step <= 0) {
    return [0, 1];
  }
  let lo = Math.min(minVal, maxVal);
  let hi = Math.max(minVal, maxVal);
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo > hi) {
    return [lo, hi].filter(Number.isFinite);
  }
  const ticks: number[] = [];
  const maxTicks = 50;
  for (let v = lo; v <= hi + step / 2 && ticks.length < maxTicks; v += step) {
    ticks.push(Math.round(v * 100) / 100);
  }
  return ticks.length > 0 ? ticks : [lo, hi];
}

export function axisDomainFromTicks(ticks: number[]): [number, number] {
  if (ticks.length === 0) return [0, 1];
  return [ticks[0], ticks[ticks.length - 1]];
}

/** Evenly spaced subsample for large daily series (keeps first/last). */
export function downsampleSeries<T>(rows: T[], maxPoints = 500): T[] {
  if (rows.length <= maxPoints) return rows;
  const last = rows.length - 1;
  const out: T[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round((i * last) / (maxPoints - 1));
    out.push(rows[idx]);
  }
  return out;
}

/** Rebase series to 1.0 at first row (for cumulative wealth indices). */
export function rebaseCumulative<T extends CumulativeRow>(
  rows: T[],
  keys: string[]
): T[] {
  if (rows.length === 0) return rows;
  const base: Record<string, number> = {};
  for (const k of keys) {
    const v = rows[0][k];
    if (typeof v === 'number' && v > 0) base[k] = v;
  }
  return rows.map((row) => {
    const next: Record<string, unknown> = { ...row };
    for (const k of keys) {
      const v = row[k];
      const b = base[k];
      if (typeof v === 'number' && b) next[k] = v / b;
    }
    return next as T;
  });
}

export function xTickInterval(length: number, targetTicks = 10): number {
  return Math.max(1, Math.floor(length / targetTicks));
}

/** Top margin reserved for tooltips (keep in sync with chart `margin.top`). */
export const FIN285A_CHART_MARGIN_TOP = 56;

/** Vertical pin inside the top margin — higher margin + low y = more gap above the line. */
export const FIN285A_TOOLTIP_TOP_Y = 6;

/** Horizontal gap between the cursor line and the tooltip box. */
export const FIN285A_TOOLTIP_OFFSET = 22;

/**
 * Pin tooltip to the top margin (y only). Horizontal placement is left to Recharts
 * with `reverseDirection` so the box flips left near the right edge instead of clipping.
 */
export function fin285aTooltipPosition(): { y: number } {
  return { y: FIN285A_TOOLTIP_TOP_Y };
}

type Fin285aTooltipPositionFn = NonNullable<TooltipProps<number, string>['position']>;

/** Typed for Recharts `Tooltip` `position` prop. */
export const fin285aTooltipPositionFn = fin285aTooltipPosition as Fin285aTooltipPositionFn;

/** Same rounding as Part2.ipynb heatmap labels: `f'{value:.2f}'`. */
export function formatCorrelationCell(value: number): string {
  const s = value.toFixed(2);
  return s === '-0.00' || (s === '0.00' && Object.is(value, -0)) ? '-0.00' : s;
}

export const FIN285A_CHART_TOOLTIP_PROPS = {
  allowEscapeViewBox: { x: false, y: true },
  reverseDirection: { x: true, y: false },
  offset: FIN285A_TOOLTIP_OFFSET,
  wrapperStyle: { zIndex: 20, pointerEvents: 'none' as const },
  contentStyle: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid rgba(248,250,252,0.12)',
    borderRadius: 'var(--radius-lg)',
    padding: '10px 14px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    maxWidth: 280,
  },
  labelStyle: { color: 'var(--color-text)', fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: 'var(--color-text-muted)', fontSize: 12, padding: '2px 0' },
};
