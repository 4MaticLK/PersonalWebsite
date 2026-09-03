import {
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { GOODYEAR_FORECAST } from '../data/goodyearHistoricalData';

const chartData = GOODYEAR_FORECAST.map((r) => ({
  year: r.year,
  EBIT: r.ebit,
  NOPAT: r.nopat,
  'Unlevered FCF': r.unleveredFcf,
  Revenue: r.revenue,
}));

export function GoodyearForecastChart() {
  return (
    <div className="portfolio-chart">
      <h3 className="portfolio-chart__title">Forecast build, 2024–2029 (base case)</h3>
      <p className="portfolio-chart__caption">
        Revenue (line, right axis) grows at a steady ~3.4% CAGR; EBIT, NOPAT, and unlevered free
        cash flow (bars, left axis) compound off it as margins hold. These five years of FCF feed
        directly into the DCF below.
      </p>
      <div className="portfolio-chart__container">
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="0" stroke="rgba(248,250,252,0.12)" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: '#8a8a8a', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickLine={{ stroke: 'rgba(248,250,252,0.25)' }}
            />
            <YAxis
              yAxisId="mm"
              tick={{ fill: '#8a8a8a', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickFormatter={(v: number) => `$${v}M`}
              label={{
                value: 'EBIT / NOPAT / FCF ($M)',
                angle: -90,
                position: 'insideLeft',
                fill: '#8a8a8a',
                fontSize: 11,
              }}
            />
            <YAxis
              yAxisId="rev"
              orientation="right"
              tick={{ fill: '#8a8a8a', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}B`}
              label={{
                value: 'Revenue ($B)',
                angle: 90,
                position: 'insideRight',
                fill: '#8a8a8a',
                fontSize: 11,
              }}
            />
            <Tooltip
              formatter={(value, name) => [
                value == null
                  ? '—'
                  : `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}M`,
                name,
              ]}
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid rgba(248,250,252,0.12)',
                borderRadius: 'var(--radius-lg)',
                padding: '10px 14px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              }}
              labelStyle={{ color: 'var(--color-text)', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }} />
            <Bar
              yAxisId="mm"
              dataKey="EBIT"
              fill="var(--color-info)"
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              yAxisId="mm"
              dataKey="NOPAT"
              fill="var(--color-accent-secondary)"
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              yAxisId="mm"
              dataKey="Unlevered FCF"
              fill="var(--color-accent)"
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
            <Line
              yAxisId="rev"
              type="monotone"
              dataKey="Revenue"
              stroke="var(--color-text-muted)"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
