import { useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import {
  axisDomainFromTicks,
  buildAxisTicks,
  formatChartDate,
  formatChartYear,
  firstDateEveryNYears,
  fin285aTooltipPositionFn,
  FIN285A_CHART_MARGIN_TOP,
  FIN285A_CHART_TOOLTIP_PROPS,
  type CorrelationPoint,
} from '../../utils/fin285aChartData';

const CORR_ACTIVE_DOT = {
  r: 5,
  stroke: '#001f5c',
  strokeWidth: 2,
  fill: '#38bdf8',
};

function BondCorrelationTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as BondCorrRow | undefined;
  if (!row) return null;
  const c = Number(row.correlation);
  if (!Number.isFinite(c)) return null;
  const dateLabel = typeof label === 'string' ? label : row.date;

  return (
    <div className="fin285a-bond-corr-tooltip">
      <p className="fin285a-bond-corr-tooltip__label">{formatChartDate(dateLabel)}</p>
      <p className="fin285a-bond-corr-tooltip__value">
        Correlation: <strong>{c.toFixed(3)}</strong>
      </p>
    </div>
  );
}

/** Part1.ipynb REGIMES — macro event bands behind the series. */
const MACRO_REGIMES = [
  { start: '2008-09-01', end: '2009-06-30', label: 'GFC', fill: 'rgba(255, 214, 214, 0.45)' },
  { start: '2013-05-01', end: '2013-09-30', label: 'Taper Tantrum', fill: 'rgba(255, 243, 205, 0.5)' },
  { start: '2020-02-01', end: '2020-04-30', label: 'COVID Crash', fill: 'rgba(214, 240, 255, 0.45)' },
  { start: '2022-01-01', end: '2022-12-31', label: '2022 Inflation Shock', fill: 'rgba(255, 232, 214, 0.5)' },
] as const;

type BondCorrRow = CorrelationPoint & {
  correlationPositive: number;
  correlationNegative: number;
};

function CorrelationFillLegend() {
  return (
    <ul className="fin285a-corr-legend" aria-label="Correlation sign legend">
      <li>
        <span className="fin285a-corr-legend__swatch fin285a-corr-legend__swatch--negative" />
        Negative corr (RP favourable)
      </li>
      <li>
        <span className="fin285a-corr-legend__swatch fin285a-corr-legend__swatch--positive" />
        Positive corr (RP at risk)
      </li>
    </ul>
  );
}

export interface BondEquityCorrelationChartProps {
  data: CorrelationPoint[];
}

export function BondEquityCorrelationChart({ data }: BondEquityCorrelationChartProps) {
  const chartData = useMemo<BondCorrRow[]>(
    () =>
      data.map((row) => {
        const c = Number(row.correlation);
        return {
          ...row,
          correlationPositive: c > 0 ? c : 0,
          correlationNegative: c < 0 ? c : 0,
        };
      }),
    [data]
  );

  const xYearTicks = useMemo(
    () => firstDateEveryNYears(data.map((r) => r.date), 2),
    [data]
  );

  const yAxis = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const row of data) {
      const c = Number(row.correlation);
      if (Number.isFinite(c)) {
        min = Math.min(min, c);
        max = Math.max(max, c);
      }
    }
    const ticks = buildAxisTicks(min, max, 0.2);
    return { domain: axisDomainFromTicks(ticks), ticks };
  }, [data]);

  return (
    <div className="portfolio-chart__container fin285a-bond-corr-chart">
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart
          data={chartData}
          margin={{ top: FIN285A_CHART_MARGIN_TOP, right: 32, left: 12, bottom: 28 }}
        >
          <CartesianGrid stroke="rgba(248,250,252,0.1)" vertical={false} />
          {MACRO_REGIMES.map((regime) => (
            <ReferenceArea
              key={regime.start}
              x1={regime.start}
              x2={regime.end}
              fill={regime.fill}
              fillOpacity={1}
              label={{
                value: regime.label,
                position: 'insideTop',
                fill: '#94a3b8',
                fontSize: 10,
                fontStyle: 'italic',
              }}
            />
          ))}
          <XAxis
            dataKey="date"
            ticks={xYearTicks}
            tickFormatter={formatChartYear}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            domain={yAxis.domain}
            ticks={yAxis.ticks}
            tickFormatter={(v) => Number(v).toFixed(1)}
            label={{
              value: 'Correlation',
              angle: -90,
              position: 'insideLeft',
              fill: '#94a3b8',
              fontSize: 12,
              offset: 12,
            }}
          />
          <Tooltip
            content={<BondCorrelationTooltip />}
            cursor={{ stroke: 'rgba(248, 250, 252, 0.35)', strokeWidth: 1 }}
            position={fin285aTooltipPositionFn}
            {...FIN285A_CHART_TOOLTIP_PROPS}
            wrapperStyle={{ zIndex: 30, pointerEvents: 'none' }}
          />
          <ReferenceLine y={0} stroke="rgba(248, 250, 252, 0.55)" strokeDasharray="4 3" />
          <Area
            type="linear"
            dataKey="correlationNegative"
            baseLine={0}
            stroke="none"
            fill="rgba(52, 211, 153, 0.35)"
            fillOpacity={1}
            isAnimationActive={false}
            legendType="none"
          />
          <Area
            type="linear"
            dataKey="correlationPositive"
            baseLine={0}
            stroke="none"
            fill="rgba(248, 113, 113, 0.35)"
            fillOpacity={1}
            isAnimationActive={false}
            legendType="none"
          />
          <Line
            type="linear"
            dataKey="correlation"
            name="Correlation"
            stroke="#001f5c"
            strokeWidth={1.8}
            dot={false}
            activeDot={CORR_ACTIVE_DOT}
            isAnimationActive={false}
            legendType="none"
          />
          <Legend
            verticalAlign="bottom"
            align="left"
            wrapperStyle={{ paddingTop: 12 }}
            content={() => <CorrelationFillLegend />}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
