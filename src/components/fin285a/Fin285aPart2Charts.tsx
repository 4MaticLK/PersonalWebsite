import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ProjectChartImage } from '../../data/projects';
import {
  downsampleSeries,
  formatChartDate,
  formatChartDateShort,
  formatCorrelationCell,
  fin285aTooltipPositionFn,
  FIN285A_CHART_MARGIN_TOP,
  FIN285A_CHART_TOOLTIP_PROPS,
  xTickInterval,
} from '../../utils/fin285aChartData';
import { Fin285aCumulativeStats } from './Fin285aCumulativeStats';
import { Fin285aChartShell } from './Fin285aChartShell';
import { RollingTrackingErrorChart } from './RollingTrackingErrorChart';
import { correlationColor, TRAIN_TEST_SPLIT } from './fin285aShared';
import type { Fin285aChartDataReady } from './useFin285aChartData';

const PART2_CUM_STATS = [
  { key: 'optimizedMa', label: 'Optimized (MA)' },
  { key: 'benchmark', label: 'Benchmark' },
] as const;

export function Fin285aPart2Charts({
  chartMeta,
  data,
}: {
  chartMeta: ProjectChartImage[];
  data: Fin285aChartDataReady;
}) {
  const meta = (file: string) => chartMeta.find((c) => c.file.includes(file));
  const { part2Cum, rollingTe, teBenchmarks, corr } = data;
  const [showTestOnly, setShowTestOnly] = useState(false);

  const part2CumFiltered = useMemo(() => {
    if (!showTestOnly) return part2Cum;
    return part2Cum.filter((r) => r.date >= TRAIN_TEST_SPLIT);
  }, [part2Cum, showTestOnly]);

  const part2CumDisplay = useMemo(
    () => downsampleSeries(part2CumFiltered, 500),
    [part2CumFiltered]
  );

  const mCum2 = meta('part2-cumulative');
  const mTe = meta('tracking-error');
  const mMatrix = meta('correlation-matrix');

  const dateRangeToggles = (
    <div className="project-page__scenario-toggles" role="group" aria-label="Part 2 date range">
      <button
        type="button"
        className={`project-page__scenario-btn ${!showTestOnly ? 'project-page__scenario-btn--active' : ''}`}
        onClick={() => setShowTestOnly(false)}
      >
        Full sample
      </button>
      <button
        type="button"
        className={`project-page__scenario-btn ${showTestOnly ? 'project-page__scenario-btn--active' : ''}`}
        onClick={() => setShowTestOnly(true)}
      >
        Test (2019–2025)
      </button>
    </div>
  );

  return (
    <div className="fin285a-charts-stack" id="rp-charts-part2">
      <Fin285aChartShell
        id="fin285a-chart-cum2"
        title={mCum2?.caption ?? 'Cumulative return'}
        description={mCum2?.description}
        actions={dateRangeToggles}
      >
        <Fin285aCumulativeStats
          rows={part2CumFiltered}
          series={[...PART2_CUM_STATS]}
          periodsPerYear={252}
        />
        <div className="portfolio-chart__container">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={part2CumDisplay}
              margin={{ top: FIN285A_CHART_MARGIN_TOP, right: 24, left: 8, bottom: 28 }}
            >
              <CartesianGrid stroke="rgba(248,250,252,0.1)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatChartDateShort}
                interval={xTickInterval(part2CumDisplay.length, 8)}
                tick={{ fill: '#829485', fontSize: 11 }}
              />
              <YAxis tick={{ fill: '#829485', fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip
                labelFormatter={formatChartDate}
                formatter={(v: number, name: string) => [Number(v).toFixed(3), name]}
                position={fin285aTooltipPositionFn}
                {...FIN285A_CHART_TOOLTIP_PROPS}
              />
              {!showTestOnly && (
                <ReferenceLine
                  x={TRAIN_TEST_SPLIT}
                  stroke="rgba(122, 184, 111, 0.7)"
                  strokeDasharray="4 4"
                  label={{ value: 'Test start', fill: '#7ab86f', fontSize: 10 }}
                />
              )}
              <Legend />
              <Line
                type="monotone"
                dataKey="optimizedMa"
                name="Optimized (MA)"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="benchmark"
                name="Benchmark"
                stroke="#7ab86f"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Fin285aChartShell>

      <Fin285aChartShell
        id="fin285a-chart-te"
        title={mTe?.caption ?? 'Rolling tracking error'}
        description={mTe?.description}
      >
        <RollingTrackingErrorChart data={rollingTe} benchmarks={teBenchmarks} />
      </Fin285aChartShell>

      <Fin285aChartShell
        id="fin285a-chart-matrix"
        title={mMatrix?.caption ?? 'Correlation matrix'}
        description={mMatrix?.description}
      >
        <div className="correlation-heatmap correlation-heatmap--fin285a">
          <div
            className="correlation-heatmap__grid correlation-heatmap__grid--fin285a"
            role="table"
            aria-label="20 ETF correlation matrix"
          >
            <div className="correlation-heatmap__row correlation-heatmap__row--header">
              <div className="correlation-heatmap__cell correlation-heatmap__cell--header" />
              {corr.labels.map((label) => (
                <div
                  key={label}
                  className="correlation-heatmap__cell correlation-heatmap__cell--header correlation-heatmap__cell--compact"
                  role="columnheader"
                >
                  {label}
                </div>
              ))}
            </div>
            {corr.labels.map((rowLabel, i) => (
              <div key={rowLabel} className="correlation-heatmap__row" role="row">
                <div
                  className="correlation-heatmap__cell correlation-heatmap__cell--header correlation-heatmap__cell--compact"
                  role="rowheader"
                >
                  {rowLabel}
                </div>
                {corr.labels.map((colLabel, j) => {
                  const value = corr.matrix[i][j];
                  const isDiagonal = i === j;
                  return (
                    <div
                      key={colLabel}
                      className="correlation-heatmap__cell correlation-heatmap__cell--compact"
                      role="cell"
                      style={{
                        backgroundColor: isDiagonal
                          ? 'rgba(248,250,252,0.06)'
                          : correlationColor(value),
                      }}
                      title={`${rowLabel}–${colLabel}: ${formatCorrelationCell(value)}`}
                    >
                      {formatCorrelationCell(value)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="correlation-heatmap__legend">
            <span className="correlation-heatmap__legend-label">−1</span>
            <div className="correlation-heatmap__legend-bar" />
            <span className="correlation-heatmap__legend-label">+1</span>
          </div>
        </div>
      </Fin285aChartShell>
    </div>
  );
}
