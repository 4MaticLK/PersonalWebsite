import { useMemo } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  axisDomainFromTicks,
  buildAxisTicks,
  buildHistogramBins,
  downsampleSeries,
  formatChartDate,
  formatChartYear,
  firstDatePerYear,
  fin285aTooltipPositionFn,
  FIN285A_CHART_MARGIN_TOP,
  FIN285A_CHART_TOOLTIP_PROPS,
  type Part2TeBenchmarks,
  type TrackingErrorPoint,
} from '../../utils/fin285aChartData';

const TE_ACTIVE_DOT = { r: 5, stroke: '#eef6f3', strokeWidth: 2 };

function TeValidationLegend({
  windowDays,
  forecastLabel,
  oosLabel,
  variant,
}: {
  windowDays: number;
  forecastLabel: number;
  oosLabel: number;
  variant: 'line' | 'hist';
}) {
  return (
    <ul className="fin285a-te-legend" aria-label="Tracking error legend">
      {variant === 'line' ? (
        <li>
          <span className="fin285a-te-legend__swatch fin285a-te-legend__swatch--rolling" />
          {windowDays}-day rolling realized TE
        </li>
      ) : null}
      <li>
        <span className="fin285a-te-legend__swatch fin285a-te-legend__swatch--forecast" />
        {variant === 'line'
          ? `Forecasted TE (${forecastLabel} bps, MA)`
          : `Forecast (${forecastLabel})`}
      </li>
      <li>
        <span className="fin285a-te-legend__swatch fin285a-te-legend__swatch--realized" />
        {variant === 'line'
          ? `Full test-period TE (${oosLabel} bps, MA)`
          : `Realized (${oosLabel})`}
      </li>
    </ul>
  );
}

export interface RollingTrackingErrorChartProps {
  data: TrackingErrorPoint[];
  benchmarks: Part2TeBenchmarks;
}

export function RollingTrackingErrorChart({ data, benchmarks }: RollingTrackingErrorChartProps) {
  const { forecastMaBps, oosMaBps, windowDays } = benchmarks;
  const forecastLabel = Math.round(forecastMaBps);
  const oosLabel = Math.round(oosMaBps);

  const lineData = useMemo(
    () =>
      downsampleSeries(data, 500).map((row) => ({
        ...row,
        forecastLine: forecastMaBps,
        oosLine: oosMaBps,
      })),
    [data, forecastMaBps, oosMaBps]
  );

  const rollingName = `${windowDays}-day rolling realized TE`;
  const forecastName = `Forecasted TE (${forecastLabel} bps, MA)`;
  const oosName = `Full test-period TE (${oosLabel} bps, MA)`;

  const teValues = useMemo(() => data.map((d) => d.trackingErrorBps), [data]);

  const xYearTicks = useMemo(() => firstDatePerYear(data.map((d) => d.date)), [data]);

  const teYAxis = useMemo(() => {
    if (teValues.length === 0) {
      return { domain: [150, 550] as [number, number], ticks: [150, 200, 250, 300, 350, 400, 450, 500, 550] };
    }
    const ticks = buildAxisTicks(Math.min(...teValues), Math.max(...teValues), 50);
    return { domain: axisDomainFromTicks(ticks), ticks };
  }, [teValues]);

  const histogram = useMemo(() => buildHistogramBins(teValues, 40), [teValues]);

  const histYMax = useMemo(() => {
    const max = Math.max(...histogram.map((b) => b.count), 1);
    const step = 50;
    return Math.ceil(max / step) * step;
  }, [histogram]);

  return (
    <div className="fin285a-te-validation">
      <div className="fin285a-te-validation__panel">
        <h4 className="fin285a-te-validation__subtitle">
          {windowDays}-Day Rolling TE Over Test Period
        </h4>
        <div className="portfolio-chart__container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={lineData}
              margin={{ top: FIN285A_CHART_MARGIN_TOP, right: 16, left: 4, bottom: 24 }}
            >
              <CartesianGrid stroke="rgba(248,250,252,0.1)" />
              <XAxis
                dataKey="date"
                ticks={xYearTicks}
                tickFormatter={formatChartYear}
                tick={{ fill: '#8fb0aa', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: '#8fb0aa', fontSize: 11 }}
                domain={teYAxis.domain}
                ticks={teYAxis.ticks}
                tickFormatter={(v) => String(Math.round(Number(v)))}
                label={{
                  value: 'Tracking Error (bps)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#8fb0aa',
                  fontSize: 11,
                  offset: 8,
                }}
              />
              <Tooltip
                labelFormatter={formatChartDate}
                formatter={(v: number, name: string) => [`${Number(v).toFixed(1)} bps`, name]}
                position={fin285aTooltipPositionFn}
                {...FIN285A_CHART_TOOLTIP_PROPS}
              />
              <Line
                type="linear"
                dataKey="forecastLine"
                name={forecastName}
                stroke="#ff8c00"
                strokeWidth={2}
                dot={false}
                activeDot={{ ...TE_ACTIVE_DOT, fill: '#ff8c00' }}
                isAnimationActive={false}
                legendType="none"
              />
              <Line
                type="linear"
                dataKey="oosLine"
                name={oosName}
                stroke="#34d399"
                strokeWidth={2}
                dot={false}
                activeDot={{ ...TE_ACTIVE_DOT, fill: '#34d399' }}
                isAnimationActive={false}
                legendType="none"
              />
              <Line
                type="linear"
                dataKey="trackingErrorBps"
                name={rollingName}
                stroke="#38bdf8"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ ...TE_ACTIVE_DOT, fill: '#38bdf8' }}
                isAnimationActive={false}
                legendType="none"
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingTop: 0, fontSize: 11 }}
                content={() => (
                  <TeValidationLegend
                    windowDays={windowDays}
                    forecastLabel={forecastLabel}
                    oosLabel={oosLabel}
                    variant="line"
                  />
                )}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="fin285a-te-validation__panel">
        <h4 className="fin285a-te-validation__subtitle">Distribution of Rolling TEs</h4>
        <div className="portfolio-chart__container">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={histogram}
              margin={{ top: FIN285A_CHART_MARGIN_TOP, right: 16, left: 4, bottom: 24 }}
            >
              <CartesianGrid stroke="rgba(248,250,252,0.1)" />
              <XAxis
                dataKey="binMid"
                type="number"
                domain={teYAxis.domain}
                ticks={teYAxis.ticks}
                tick={{ fill: '#8fb0aa', fontSize: 11 }}
                label={{
                  value: 'Tracking Error (bps)',
                  position: 'insideBottom',
                  offset: -8,
                  fill: '#8fb0aa',
                  fontSize: 11,
                }}
              />
              <YAxis
                tick={{ fill: '#8fb0aa', fontSize: 11 }}
                domain={[0, histYMax]}
                tickCount={7}
                allowDecimals={false}
                label={{
                  value: 'Frequency',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#8fb0aa',
                  fontSize: 11,
                  offset: 8,
                }}
              />
              <Tooltip
                formatter={(v: number) => [v, 'Count']}
                labelFormatter={(mid) => `${Number(mid).toFixed(0)} bps`}
                position={fin285aTooltipPositionFn}
                {...FIN285A_CHART_TOOLTIP_PROPS}
              />
              <ReferenceLine x={forecastMaBps} stroke="#ff8c00" strokeWidth={2} />
              <ReferenceLine x={oosMaBps} stroke="#34d399" strokeWidth={2} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingTop: 0, fontSize: 11 }}
                content={() => (
                  <TeValidationLegend
                    windowDays={windowDays}
                    forecastLabel={forecastLabel}
                    oosLabel={oosLabel}
                    variant="hist"
                  />
                )}
              />
              <Bar
                dataKey="count"
                fill="rgba(56, 189, 248, 0.75)"
                stroke="rgba(238, 246, 243, 0.15)"
                isAnimationActive={false}
                legendType="none"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
