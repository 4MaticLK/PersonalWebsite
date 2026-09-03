import {
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { GOODYEAR_DEBT_HISTORY } from '../data/goodyearHistoricalData';

// Simple linear trend across the 8 fiscal years (x = 0..7), for the dashed trendline.
const n = GOODYEAR_DEBT_HISTORY.length;
const xs = GOODYEAR_DEBT_HISTORY.map((_, i) => i);
const ys = GOODYEAR_DEBT_HISTORY.map((d) => d.totalDebt);
const meanX = xs.reduce((a, v) => a + v, 0) / n;
const meanY = ys.reduce((a, v) => a + v, 0) / n;
let cov = 0;
let varX = 0;
xs.forEach((xv, i) => {
  cov += (xv - meanX) * (ys[i] - meanY);
  varX += (xv - meanX) ** 2;
});
const slope = varX === 0 ? 0 : cov / varX;
const intercept = meanY - slope * meanX;

const chartData = GOODYEAR_DEBT_HISTORY.map((d, i) => ({
  year: d.year,
  totalDebt: d.totalDebt,
  trend: intercept + slope * i,
}));

export function GoodyearDebtChart() {
  return (
    <div className="portfolio-chart">
      <h3 className="portfolio-chart__title">Total debt, 2017–2024</h3>
      <p className="portfolio-chart__caption">
        Total debt (excluding lease obligations) stepped up in 2021 with the Cooper Tire acquisition
        and has stayed elevated since. Dashed line is the linear trend across the period (y ≈{' '}
        {slope.toFixed(1)}x + {intercept.toFixed(0)}).
      </p>
      <div className="portfolio-chart__container">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="0" stroke="rgba(248,250,252,0.12)" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: '#8a8a8a', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickLine={{ stroke: 'rgba(248,250,252,0.25)' }}
            />
            <YAxis
              tick={{ fill: '#8a8a8a', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}B`}
              label={{
                value: 'Total debt ($M)',
                angle: -90,
                position: 'insideLeft',
                fill: '#8a8a8a',
                fontSize: 11,
              }}
            />
            <Tooltip
              formatter={(value: number, name) => [
                `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}M`,
                name === 'trend' ? 'Trend' : 'Total debt',
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
            <ReferenceLine
              x={2021}
              stroke="var(--color-warning)"
              strokeDasharray="3 3"
              label={{
                value: 'Cooper Tire acquisition',
                position: 'top',
                fill: 'var(--color-warning)',
                fontSize: 10,
              }}
            />
            <Bar
              dataKey="totalDebt"
              fill="var(--color-info)"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
            <Line
              type="linear"
              dataKey="trend"
              stroke="var(--color-text-muted)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
