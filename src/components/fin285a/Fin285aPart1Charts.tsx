import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
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
  axisDomainFromTicks,
  buildAxisTicks,
  formatChartDate,
  formatChartYear,
  fin285aTooltipPositionFn,
  FIN285A_CHART_MARGIN_TOP,
  FIN285A_CHART_TOOLTIP_PROPS,
  firstDateEveryNYears,
} from '../../utils/fin285aChartData';
import { Fin285aCumulativeStats } from './Fin285aCumulativeStats';
import { Fin285aChartShell } from './Fin285aChartShell';
import {
  CHART_LEGEND_PROPS,
  PART1_LEVERAGE,
  PART1_WEIGHT_SERIES,
  PART1_WEIGHT_Y_TICKS,
  REGIME_SPLIT,
  type Part1WeightKey,
} from './fin285aShared';
import type { Fin285aChartDataReady } from './useFin285aChartData';

const PART1_CUM_STATS = [
  { key: 'riskParity', label: 'Risk parity' },
  { key: 'benchmark', label: 'ALLW benchmark' },
] as const;

export function Fin285aPart1Charts({
  chartMeta,
  data,
}: {
  chartMeta: ProjectChartImage[];
  data: Fin285aChartDataReady;
}) {
  const meta = (file: string) => chartMeta.find((c) => c.file.includes(file));
  const { part1Cum, part1Wts } = data;

  const [weightSeries, setWeightSeries] = useState<Record<Part1WeightKey, boolean>>({
    AGG: true,
    ACWI: true,
    GSG: true,
    TIP: true,
  });

  const part1XYearTicks = useMemo(
    () => firstDateEveryNYears(part1Cum.map((r) => r.date), 2),
    [part1Cum]
  );

  const part1CumYAxis = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const row of part1Cum) {
      const rp = Number(row.riskParity);
      const bench = Number(row.benchmark);
      if (Number.isFinite(rp)) {
        min = Math.min(min, rp);
        max = Math.max(max, rp);
      }
      if (Number.isFinite(bench)) {
        min = Math.min(min, bench);
        max = Math.max(max, bench);
      }
    }
    const ticks = buildAxisTicks(min, max, 0.2);
    return { domain: axisDomainFromTicks(ticks), ticks };
  }, [part1Cum]);

  const mCum1 = meta('cumulative-returns');
  const mWts = meta('part1-weights');

  const weightToggles = (
    <div className="project-page__scenario-toggles" role="group" aria-label="Weight series">
      {PART1_WEIGHT_SERIES.map(({ key }) => (
        <button
          key={key}
          type="button"
          className={`project-page__scenario-btn ${weightSeries[key] ? 'project-page__scenario-btn--active' : ''}`}
          onClick={() => setWeightSeries((prev) => ({ ...prev, [key]: !prev[key] }))}
          aria-pressed={weightSeries[key]}
        >
          {key}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fin285a-charts-stack fin285a-charts-stack--part1">
      <Fin285aChartShell
        id="fin285a-chart-cum1"
        title={mCum1?.caption ?? 'Cumulative return'}
        description={mCum1?.description}
      >
        <Fin285aCumulativeStats rows={part1Cum} series={[...PART1_CUM_STATS]} periodsPerYear={12} />
        <div className="portfolio-chart__container">
          <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={part1Cum}
                margin={{ top: FIN285A_CHART_MARGIN_TOP, right: 24, left: 8, bottom: 28 }}
              >
              <CartesianGrid stroke="rgba(248,250,252,0.1)" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={part1XYearTicks}
                tickFormatter={formatChartYear}
                tick={{ fill: '#829485', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: '#829485', fontSize: 11 }}
                domain={part1CumYAxis.domain}
                ticks={part1CumYAxis.ticks}
                tickFormatter={(v) => Number(v).toFixed(1)}
              />
              <Tooltip
                labelFormatter={formatChartDate}
                formatter={(v: number, name: string) => [Number(v).toFixed(3), name]}
                position={fin285aTooltipPositionFn}
                {...FIN285A_CHART_TOOLTIP_PROPS}
              />
              <ReferenceLine
                x={REGIME_SPLIT}
                stroke="rgba(248, 113, 113, 0.6)"
                strokeDasharray="4 4"
                label={{ value: '2022', fill: '#829485', fontSize: 11 }}
              />
              <Legend {...CHART_LEGEND_PROPS} />
              <Line
                type="linear"
                dataKey="riskParity"
                name="Risk parity"
                stroke="#818cf8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="linear"
                dataKey="benchmark"
                name="ALLW benchmark"
                stroke="#7ab86f"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Fin285aChartShell>

      <Fin285aChartShell
        id="fin285a-chart-wts"
        title={mWts?.caption ?? 'Dynamic weights'}
        description={mWts?.description}
        actions={weightToggles}
      >
        <div className="portfolio-chart__container">
          <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={part1Wts}
                margin={{ top: FIN285A_CHART_MARGIN_TOP, right: 24, left: 8, bottom: 28 }}
              >
              <CartesianGrid stroke="rgba(248,250,252,0.1)" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={part1XYearTicks}
                tickFormatter={formatChartYear}
                tick={{ fill: '#829485', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: '#829485', fontSize: 11 }}
                domain={[0, PART1_LEVERAGE + 0.1]}
                ticks={[...PART1_WEIGHT_Y_TICKS]}
                tickFormatter={(v) => `${(Number(v) * 100).toFixed(0)}%`}
              />
              <Tooltip
                labelFormatter={formatChartDate}
                formatter={(v: number, name: string) => [
                  `${(Number(v) * 100).toFixed(1)}%`,
                  name,
                ]}
                position={fin285aTooltipPositionFn}
                {...FIN285A_CHART_TOOLTIP_PROPS}
              />
              <ReferenceLine
                y={PART1_LEVERAGE}
                stroke="rgba(232, 237, 233, 0.55)"
                strokeDasharray="5 4"
              />
              <Legend {...CHART_LEGEND_PROPS} />
              {PART1_WEIGHT_SERIES.map(({ key, label, color }) =>
                weightSeries[key] ? (
                  <Area
                    key={key}
                    type="linear"
                    dataKey={key}
                    name={label}
                    stackId="1"
                    stroke={color}
                    fill={color}
                    fillOpacity={0.65}
                  />
                ) : null
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Fin285aChartShell>
    </div>
  );
}
