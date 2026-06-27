import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { PERSONAL_PORTFOLIO } from '../../data/personalPortfolio';
import type { LiveQuotesMeta } from '../../utils/applyLiveQuotes';
import { formatDateDisplay, formatPct } from '../../utils/parsePersonalPortfolioCsv';
import type { PortfolioAnalytics } from '../../utils/computePortfolioAnalytics';
import {
  filterNavHistoryByRange,
  type PerformanceRange,
} from '../../utils/filterNavHistoryByRange';

interface PortfolioReturnsChartProps {
  analytics: PortfolioAnalytics;
  liveQuotes?: LiveQuotesMeta;
}

type ChartPoint = {
  date: string;
  portfolio: number;
  benchmark: number;
  isLive?: boolean;
};

const RANGES: { id: PerformanceRange; label: string }[] = [
  { id: '1m', label: '1M' },
  { id: '3m', label: '3M' },
  { id: 'ytd', label: 'YTD' },
  { id: '1y', label: '1Y' },
  { id: 'all', label: 'All' },
];

function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function PortfolioReturnsChart({ analytics, liveQuotes }: PortfolioReturnsChartProps) {
  const benchmark = PERSONAL_PORTFOLIO.benchmarkName;
  const [range, setRange] = useState<PerformanceRange>('all');
  const [pinnedDate, setPinnedDate] = useState<string | null>(null);

  const excludeNote =
    analytics.backtestExcludes.length > 0
      ? ` Excludes ${analytics.backtestExcludes.join(', ')} (no price history).`
      : '';

  const chartData = useMemo(() => {
    const sliced = filterNavHistoryByRange(analytics.navHistory, range);
    return sliced.map((row) => ({
      date: row.date,
      portfolio: row.cumulativeReturnPct,
      benchmark: row.benchmarkReturnPct,
      isLive: row.isLive === true,
    }));
  }, [analytics.navHistory, range]);

  useEffect(() => {
    if (pinnedDate && !chartData.some((row) => row.date === pinnedDate)) {
      setPinnedDate(null);
    }
  }, [chartData, pinnedDate]);

  const pinnedPoint = pinnedDate
    ? chartData.find((row) => row.date === pinnedDate) ?? null
    : null;
  const pinnedAlpha =
    pinnedPoint != null ? pinnedPoint.portfolio - pinnedPoint.benchmark : null;

  const yValues = chartData.flatMap((r) => [r.portfolio, r.benchmark]);
  const yMin = yValues.length ? Math.min(...yValues) : 0;
  const yMax = yValues.length ? Math.max(...yValues) : 1;
  const yPad = Math.max(1, (yMax - yMin) * 0.08);
  const yDomain: [number, number] = [yMin - yPad, yMax + yPad];
  const xTickInterval = Math.max(1, Math.floor(chartData.length / 8));
  const hasLivePoint = chartData.some((r) => r.isLive);

  const handleChartClick = (state: { activeLabel?: string | number }) => {
    const label = state?.activeLabel;
    if (label == null) return;
    const date = String(label);
    if (!chartData.some((row) => row.date === date)) return;
    setPinnedDate((prev) => (prev === date ? null : date));
  };

  const renderPortfolioDot = (props: {
    cx?: number;
    cy?: number;
    payload?: ChartPoint;
  }) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null || !payload) return <g key={`${cx}-${cy}`} />;

    if (payload.date === pinnedDate) {
      return (
        <circle
          key={`pin-portfolio-${payload.date}`}
          cx={cx}
          cy={cy}
          r={6}
          fill="#c9a227"
          stroke="#f8fafc"
          strokeWidth={2}
        />
      );
    }

    if (payload.isLive) {
      return (
        <circle
          key={`live-${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={5}
          fill="#c9a227"
          stroke="#f8fafc"
          strokeWidth={2}
          className="personal-portfolio__chart-live-dot"
        />
      );
    }

    return <g key={`${cx}-${cy}`} />;
  };

  const renderBenchmarkDot = (props: {
    cx?: number;
    cy?: number;
    payload?: ChartPoint;
  }) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null || !payload || payload.date !== pinnedDate) {
      return <g key={`${cx}-${cy}`} />;
    }

    return (
      <circle
        key={`pin-benchmark-${payload.date}`}
        cx={cx}
        cy={cy}
        r={6}
        fill="#64748b"
        stroke="#f8fafc"
        strokeWidth={2}
      />
    );
  };

  return (
    <article className="portfolio-chart personal-portfolio__chart" aria-labelledby="portfolio-returns-heading">
      <div className="personal-portfolio__chart-header">
        <div>
          <h3 id="portfolio-returns-heading" className="portfolio-chart__title">
            Portfolio vs {benchmark}
          </h3>
          <p className="portfolio-chart__caption">
            Current book simulated at historical prices vs {benchmark}. Click the chart to pin a
            date.{excludeNote}
            {hasLivePoint && liveQuotes?.fetchedAt
              ? ` Live point updated ${formatUpdatedAt(liveQuotes.fetchedAt)}.`
              : ''}
          </p>
        </div>
        <div className="personal-portfolio__toggle" role="group" aria-label="Performance date range">
          {RANGES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`personal-portfolio__toggle-btn ${range === id ? 'personal-portfolio__toggle-btn--active' : ''}`}
              onClick={() => setRange(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {pinnedPoint && (
        <div className="personal-portfolio__chart-pin" role="status">
          <div className="personal-portfolio__chart-pin-main">
            <strong>{formatDateDisplay(pinnedPoint.date)}</strong>
            <span>
              Portfolio {formatPct(pinnedPoint.portfolio, 2, true)} · {benchmark}{' '}
              {formatPct(pinnedPoint.benchmark, 2, true)} · Alpha{' '}
              {pinnedAlpha != null ? formatPct(pinnedAlpha, 2, true) : '—'}
            </span>
          </div>
          <button
            type="button"
            className="personal-portfolio__filter-clear"
            onClick={() => setPinnedDate(null)}
          >
            Clear pin
          </button>
        </div>
      )}

      <div className="portfolio-chart__container personal-portfolio__chart-container personal-portfolio__chart-container--interactive">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            onClick={handleChartClick}
          >
            <CartesianGrid stroke="rgba(148, 163, 184, 0.15)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateShort}
              interval={xTickInterval}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
            />
            <YAxis
              domain={yDomain}
              tickFormatter={(v) => `${Number(v).toFixed(2)}%`}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              width={48}
            />
            {pinnedDate && (
              <ReferenceLine
                x={pinnedDate}
                stroke="rgba(201, 162, 39, 0.55)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            )}
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid rgba(201, 162, 39, 0.35)',
                borderRadius: '0.5rem',
                color: '#f8fafc',
              }}
              labelFormatter={(label) => formatDateDisplay(String(label))}
              formatter={(value: number, name: string) => [
                formatPct(value, 2, true),
                name === 'portfolio' ? 'Portfolio' : benchmark,
              ]}
            />
            <Legend
              formatter={(value) => (
                <span className="portfolio-chart__legend-text">
                  {value === 'portfolio' ? 'Portfolio' : benchmark}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="portfolio"
              name="portfolio"
              stroke="#c9a227"
              strokeWidth={2.5}
              dot={renderPortfolioDot}
              activeDot={{ r: 5, cursor: 'pointer' }}
            />
            <Line
              type="monotone"
              dataKey="benchmark"
              name="benchmark"
              stroke="#64748b"
              strokeWidth={2}
              dot={renderBenchmarkDot}
              activeDot={{ r: 5, cursor: 'pointer' }}
              strokeDasharray="6 4"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
