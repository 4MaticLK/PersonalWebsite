import {
  computeCumulativePerformance,
  formatChartDateRange,
  formatPercentDecimal,
  type CumulativePerformance,
  type CumulativeRow,
} from '../../utils/fin285aChartData';

export interface Fin285aCumulativeStatsSeries {
  key: string;
  label: string;
}

export interface Fin285aCumulativeStatsProps {
  rows: CumulativeRow[];
  series: Fin285aCumulativeStatsSeries[];
  /** 12 for monthly Part 1; 252 for daily Part 2. */
  periodsPerYear: number;
}

function StatPair({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="fin285a-cum-stats__metric">
      <span className="fin285a-cum-stats__metric-label">{label}</span>
      <span className="fin285a-cum-stats__metric-value">{value}</span>
    </div>
  );
}

export function Fin285aCumulativeStats({
  rows,
  series,
  periodsPerYear,
}: Fin285aCumulativeStatsProps) {
  if (rows.length < 2) return null;

  const periodLabel = formatChartDateRange(rows);
  const stats: Record<string, CumulativePerformance> = {};
  for (const { key } of series) {
    stats[key] = computeCumulativePerformance(rows, key, periodsPerYear);
  }

  return (
    <div className="fin285a-cum-stats" aria-label="Cumulative return statistics">
      <p className="fin285a-cum-stats__heading">
        Period statistics
        {periodLabel ? (
          <span className="fin285a-cum-stats__period"> · {periodLabel}</span>
        ) : null}
      </p>
      <div className="fin285a-cum-stats__grid">
        {series.map(({ key, label }) => {
          const perf = stats[key];
          return (
            <div key={key} className="fin285a-cum-stats__card">
              <span className="fin285a-cum-stats__name">{label}</span>
              <StatPair
                label="Total return"
                value={formatPercentDecimal(perf.totalReturn)}
              />
              <StatPair
                label="Realized risk (ann.)"
                value={formatPercentDecimal(perf.realizedRisk)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
