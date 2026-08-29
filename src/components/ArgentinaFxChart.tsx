import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
} from 'recharts';
import {
  ARGENTINA_FX_DATA,
  clampEpisodeRange,
  findEpisodeForYear,
} from '../data/argentinaHistoricalData';

const AXIS_TICKS = [1, 10, 100, 1000];
const DOMAIN_MIN = 2000;
const DOMAIN_MAX = 2026;

interface TooltipPayloadItem {
  payload: { year: number; official: number; parallel: number | null };
}

function FxTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const { year, official, parallel } = payload[0].payload;
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid rgba(248,250,252,0.12)',
        borderRadius: 'var(--radius-lg)',
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{ color: 'var(--color-text)', fontWeight: 600, marginBottom: 4 }}>{year}</div>
      <div style={{ color: 'var(--color-accent)' }}>Official: {official.toLocaleString()}</div>
      {parallel != null && (
        <div style={{ color: '#f87171' }}>Parallel: {parallel.toLocaleString()}</div>
      )}
    </div>
  );
}

export interface ArgentinaFxChartProps {
  hoveredEpisodeId?: string | null;
  onHoverYear?: (episodeId: string | null) => void;
}

export function ArgentinaFxChart({ hoveredEpisodeId = null, onHoverYear }: ArgentinaFxChartProps) {
  const highlightRange = hoveredEpisodeId
    ? clampEpisodeRange(hoveredEpisodeId, DOMAIN_MIN, DOMAIN_MAX)
    : null;

  return (
    <div className="portfolio-chart">
      <h3 className="portfolio-chart__title">Pesos per US dollar: official vs. parallel, 2000–2026</h3>
      <p className="portfolio-chart__caption">
        Log scale; year-end values. Shaded bands mark the two exchange-control (cepo cambiario)
        periods — the gap between the lines is the market's running estimate of how overvalued the
        official rate was. Digitized directly from the paper's own Figure 2; sourced from BCRA, IMF
        reports, and contemporaneous press reporting on the parallel ("blue") rate.
      </p>
      <div className="portfolio-chart__container">
        <ResponsiveContainer width="100%" height={340}>
          <LineChart
            data={ARGENTINA_FX_DATA}
            margin={{ top: 24, right: 24, left: 8, bottom: 8 }}
            onMouseMove={(state) => {
              if (!onHoverYear) return;
              const label = state?.activeLabel;
              if (label == null) return;
              onHoverYear(findEpisodeForYear(Number(label)));
            }}
            onMouseLeave={() => onHoverYear?.(null)}
          >
            <CartesianGrid strokeDasharray="0" stroke="rgba(248,250,252,0.1)" />
            {highlightRange && (
              <ReferenceArea
                x1={highlightRange[0]}
                x2={highlightRange[1]}
                fill="var(--color-accent)"
                fillOpacity={0.16}
                stroke="var(--color-accent)"
                strokeOpacity={0.5}
              />
            )}
            <XAxis
              dataKey="year"
              type="number"
              domain={[2000, 2026]}
              ticks={[2000, 2005, 2010, 2015, 2020, 2025]}
              tick={{ fill: '#8a8a8a', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickLine={{ stroke: 'rgba(248,250,252,0.25)' }}
            />
            <YAxis
              scale="log"
              domain={[1, 2000]}
              ticks={AXIS_TICKS}
              tickFormatter={(v) => `${v}`}
              tick={{ fill: '#8a8a8a', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              width={52}
            />
            <Tooltip content={<FxTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 8 }}
              iconType="line"
              iconSize={10}
              formatter={(value) => <span className="portfolio-chart__legend-text">{value}</span>}
            />
            <ReferenceArea
              x1={2011}
              x2={2015}
              fill="#f87171"
              fillOpacity={0.08}
              stroke="none"
              label={{ value: 'cepo 2011–15', position: 'insideTop', fill: '#f87171', fontSize: 10 }}
            />
            <ReferenceArea
              x1={2019}
              x2={2025}
              fill="#f87171"
              fillOpacity={0.08}
              stroke="none"
              label={{ value: 'cepo 2019–25', position: 'insideTop', fill: '#f87171', fontSize: 10 }}
            />
            <ReferenceDot
              x={2002}
              y={3.2}
              r={4}
              fill="var(--color-accent)"
              stroke="none"
              label={{ value: '2002 devaluation', position: 'top', fill: '#e8e8e8', fontSize: 11 }}
            />
            <ReferenceDot
              x={2020}
              y={165.5}
              r={4}
              fill="#f87171"
              stroke="none"
              label={{
                value: 'parallel ≈ 2× official',
                position: 'top',
                fill: '#e8e8e8',
                fontSize: 11,
              }}
            />
            <ReferenceDot
              x={2023}
              y={800}
              r={4}
              fill="var(--color-accent)"
              stroke="none"
              label={{
                value: 'Dec 2023: 54% devaluation',
                position: 'top',
                fill: '#e8e8e8',
                fontSize: 11,
              }}
            />
            <ReferenceDot
              x={2025}
              y={1392}
              r={4}
              fill="var(--color-accent)"
              stroke="none"
              label={{
                value: 'controls lifted, gap closes',
                position: 'right',
                fill: '#e8e8e8',
                fontSize: 11,
              }}
            />
            <Line
              type="linear"
              dataKey="official"
              name="Official rate"
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="parallel"
              name="Parallel ('blue') rate"
              stroke="#f87171"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
