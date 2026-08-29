import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
} from 'recharts';
import {
  ARGENTINA_INFLATION_DATA,
  clampEpisodeRange,
  findEpisodeForYear,
} from '../data/argentinaHistoricalData';

const DOMAIN_MIN = 1975;
const DOMAIN_MAX = 2025;

const CHART_DATA = ARGENTINA_INFLATION_DATA.map((d) => ({
  year: d.year,
  // Log scale can't render zero/negative values — clamp for display, keep the real number for the tooltip.
  display: Math.max(d.inflation, 1),
  actual: d.inflation,
}));

const AXIS_TICKS = [1, 10, 100, 1000, 10000];

function formatPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 && value < 1000 ? rounded : Math.round(rounded)}%`;
}

interface TooltipPayloadItem {
  payload: { year: number; actual: number };
}

function InflationTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const { year, actual } = payload[0].payload;
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
      <div style={{ color: 'var(--color-text)', fontWeight: 600, marginBottom: 2 }}>{year}</div>
      <div style={{ color: 'var(--color-accent)' }}>
        {actual < 0 ? `${actual.toFixed(1)}% (deflation)` : formatPercent(actual)}
      </div>
    </div>
  );
}

export interface ArgentinaInflationChartProps {
  hoveredEpisodeId?: string | null;
  onHoverYear?: (episodeId: string | null) => void;
}

export function ArgentinaInflationChart({
  hoveredEpisodeId = null,
  onHoverYear,
}: ArgentinaInflationChartProps) {
  const highlightRange = hoveredEpisodeId
    ? clampEpisodeRange(hoveredEpisodeId, DOMAIN_MIN, DOMAIN_MAX)
    : null;

  return (
    <div className="portfolio-chart">
      <h3 className="portfolio-chart__title">Annual consumer price inflation, 1975–2025</h3>
      <p className="portfolio-chart__caption">
        Log scale. The 1999–2001 deflation is clamped at 1% since a log axis can't show negative
        values (see tooltip for actual figures). Shaded bands mark convertibility and the period of
        INDEC political intervention. Digitized directly from the paper's own Figure 1; sourced from
        INDEC, World Bank WDI, and BCRA historical series.
      </p>
      <div className="portfolio-chart__container">
        <ResponsiveContainer width="100%" height={340}>
          <LineChart
            data={CHART_DATA}
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
              domain={[1975, 2025]}
              ticks={[1975, 1985, 1995, 2005, 2015, 2025]}
              tick={{ fill: '#8a8a8a', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickLine={{ stroke: 'rgba(248,250,252,0.25)' }}
            />
            <YAxis
              scale="log"
              domain={[1, 10000]}
              ticks={AXIS_TICKS}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: '#8a8a8a', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              width={56}
            />
            <Tooltip content={<InflationTooltip />} />
            <ReferenceArea
              x1={1991}
              x2={2001}
              fill="#38bdf8"
              fillOpacity={0.08}
              stroke="none"
              label={{
                value: 'Convertibility',
                position: 'insideTop',
                fill: '#38bdf8',
                fontSize: 10,
              }}
            />
            <ReferenceArea
              x1={2007}
              x2={2015}
              fill="#f87171"
              fillOpacity={0.08}
              stroke="none"
              label={{
                value: 'INDEC intervention',
                position: 'insideTop',
                fill: '#f87171',
                fontSize: 10,
              }}
            />
            <ReferenceDot
              x={1989}
              y={4923}
              r={4}
              fill="var(--color-accent)"
              stroke="none"
              label={{ value: '1989: 4,923%', position: 'top', fill: '#e8e8e8', fontSize: 11 }}
            />
            <ReferenceDot
              x={2023}
              y={211.4}
              r={4}
              fill="var(--color-accent)"
              stroke="none"
              label={{ value: '2023: 211%', position: 'top', fill: '#e8e8e8', fontSize: 11 }}
            />
            <ReferenceDot
              x={2025}
              y={31.5}
              r={4}
              fill="var(--color-accent)"
              stroke="none"
              label={{ value: '2025: 31.5%', position: 'right', fill: '#e8e8e8', fontSize: 11 }}
            />
            <Line
              type="linear"
              dataKey="display"
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
