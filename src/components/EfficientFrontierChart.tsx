import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { parseFrontierCsv, computePortfolioStats, type FrontierData, type PortfolioStats } from '../utils/parseFrontierCsv';

export interface EfficientFrontierChartProps {
  /** Override risk-free rate in % (e.g. 4.23 for 4.23%). Used for RFR card and tangency/CAL slope. */
  riskFreeRateOverride?: number;
}

const CSV_URL = '/pdfs/Sheet 1.csv';

const X_DOMAIN: [number, number] = [15, 21];
const Y_DOMAIN: [number, number] = [14, 15.4];
const X_TICKS = [15, 16, 17, 18, 19, 20, 21];
const Y_TICKS = [14, 14.2, 14.4, 14.6, 14.8, 15, 15.2, 15.4];

/** Build chart data: frontier in original CSV order (so the curve draws correctly), then CAL in ascending Risk order (so the line touches the Y-axis). Do not sort together or the yellow frontier line connects points in the wrong order. */
function mergeForChart(data: FrontierData): { stdDev: number; frontier: number | null; cal: number | null }[] {
  const rows: { stdDev: number; frontier: number | null; cal: number | null }[] = [];
  data.frontier.forEach((p) => rows.push({ stdDev: p.stdDev, frontier: p.return, cal: null }));
  const calSorted = [...data.cal].sort((a, b) => a.stdDev - b.stdDev);
  calSorted.forEach((p) => rows.push({ stdDev: p.stdDev, frontier: null, cal: p.return }));
  return rows;
}

function formatPct(value: number): string {
  return `${Number(value).toFixed(2)}%`;
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`frontier-stats__card ${accent ? 'frontier-stats__card--accent' : ''}`}>
      <span className="frontier-stats__label">{label}</span>
      <span className="frontier-stats__value">{value}</span>
      {sub != null && <span className="frontier-stats__sub">{sub}</span>}
    </div>
  );
}

export function EfficientFrontierChart({ riskFreeRateOverride }: EfficientFrontierChartProps = {}) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [chartData, setChartData] = useState<{ stdDev: number; frontier: number | null; cal: number | null }[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetch(CSV_URL)
      .then((res) => {
        if (!res.ok) throw new Error('CSV not found');
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        const data = parseFrontierCsv(text);
        if (data.frontier.length === 0 && data.cal.length === 0) throw new Error('No data parsed');
        setChartData(mergeForChart(data));
        setStats(
          computePortfolioStats(data, riskFreeRateOverride != null ? { riskFreeRateOverride } : undefined)
        );
        setStatus('ok');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [riskFreeRateOverride]);

  if (status === 'loading') {
    return (
      <div className="frontier-chart">
        <div className="chart-skeleton">
          <div className="skeleton chart-skeleton__title" />
          <div className="skeleton chart-skeleton__subtitle" />
          <div className="skeleton chart-skeleton__body" />
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="frontier-chart frontier-chart--error">
        <p>Could not load <strong>Sheet 1.csv</strong>. Ensure the file is in <strong>public/pdfs/</strong>.</p>
      </div>
    );
  }

  return (
    <div className="frontier-chart">
      <header className="frontier-chart__header">
        <h3 id="frontier-chart-heading" className="frontier-chart__title">
          2 Stock Frontier
        </h3>
        <p className="frontier-chart__caption">
          Risk vs. return. Efficient frontier and capital allocation line (tangent at optimal risky portfolio).
        </p>
      </header>

      {stats != null && (
        <section className="frontier-stats" aria-label="Portfolio statistics">
          <h4 className="frontier-stats__heading">Portfolio statistics</h4>
          <div className="frontier-stats__grid">
            <StatCard label="Risk-free rate" value={formatPct(stats.riskFreeRate)} accent />
            <StatCard
              label="Min volatility portfolio"
              value={formatPct(stats.minVolatility.return)}
              sub={`Risk ${formatPct(stats.minVolatility.stdDev)}`}
            />
            <StatCard
              label="Max return portfolio"
              value={formatPct(stats.maxReturn.return)}
              sub={`Risk ${formatPct(stats.maxReturn.stdDev)}`}
            />
            {stats.tangency != null && (
              <StatCard
                label="Optimal risky portfolio (tangency)"
                value={formatPct(stats.tangency.return)}
                sub={`Risk ${formatPct(stats.tangency.stdDev)}`}
              />
            )}
            <StatCard
              label="CAL slope (reward per unit risk)"
              value={stats.calSlope.toFixed(3)}
              sub="Excess return / σ"
            />
          </div>
        </section>
      )}

      <div className="frontier-chart__chart-wrap">
        <div className="frontier-chart__container">
          <ResponsiveContainer width="100%" height={420}>
            <LineChart
              data={chartData}
              margin={{ top: 16, right: 20, left: 56, bottom: 40 }}
            >
              <CartesianGrid
                strokeDasharray="0"
                stroke="rgba(248,250,252,0.12)"
                vertical={true}
                horizontal={true}
              />
              <XAxis
                dataKey="stdDev"
                type="number"
                domain={X_DOMAIN}
                ticks={X_TICKS}
                tickFormatter={formatPct}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
                tickLine={{ stroke: 'rgba(248,250,252,0.25)', width: 1 }}
                label={{ value: 'Risk', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                type="number"
                domain={Y_DOMAIN}
                ticks={Y_TICKS}
                tickFormatter={formatPct}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
                tickLine={{ stroke: 'rgba(248,250,252,0.25)', width: 1 }}
                label={{ value: 'Return', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [formatPct(value), '']}
                labelFormatter={(label) => `Risk ${formatPct(Number(label))}`}
                contentStyle={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid rgba(248,250,252,0.12)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '12px 16px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                }}
                labelStyle={{ color: 'var(--color-text)', fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: 'var(--color-text-muted)' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8 }}
                iconType="line"
                iconSize={10}
                formatter={(value) => <span className="frontier-chart__legend-text">{value}</span>}
              />
              <Line
                type="monotone"
                dataKey="frontier"
                name="Efficient frontier"
                stroke="var(--color-accent)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: 'var(--color-accent)', strokeWidth: 0 }}
                connectNulls
                isAnimationActive={true}
              />
              <Line
                type="monotone"
                dataKey="cal"
                name="Capital allocation line"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#38bdf8', strokeWidth: 0 }}
                connectNulls
                isAnimationActive={true}
              />
              {stats?.tangency != null && (
                <ReferenceDot
                  x={stats.tangency.stdDev}
                  y={stats.tangency.return}
                  r={5}
                  fill="transparent"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
