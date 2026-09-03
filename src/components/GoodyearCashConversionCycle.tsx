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
import { GOODYEAR_CCC_HISTORY } from '../data/goodyearHistoricalData';

const chartData = GOODYEAR_CCC_HISTORY.map((r) => ({
  year: r.year,
  'Days inventory held': r.daysInventory,
  'Days to collect': r.daysReceivables,
  'Days to pay suppliers': r.daysPayables,
  ccc: r.cashConversionCycle,
}));

export function GoodyearCashConversionCycle() {
  const latest = GOODYEAR_CCC_HISTORY[GOODYEAR_CCC_HISTORY.length - 1];
  return (
    <div className="portfolio-chart">
      <h3 className="portfolio-chart__title">Cash conversion cycle, 2020–2024</h3>
      <p className="portfolio-chart__caption">
        Goodyear holds inventory ~{latest.daysInventory.toFixed(0)} days, collects from customers in
        ~{latest.daysReceivables.toFixed(0)} days, and pays suppliers in ~
        {latest.daysPayables.toFixed(0)} days — a net cash conversion cycle of ~
        {latest.cashConversionCycle.toFixed(0)} days in 2024 (line, right axis), broadly steady over
        the period.
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
              yAxisId="days"
              tick={{ fill: '#8a8a8a', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              label={{
                value: 'Days',
                angle: -90,
                position: 'insideLeft',
                fill: '#8a8a8a',
                fontSize: 11,
              }}
            />
            <YAxis
              yAxisId="ccc"
              orientation="right"
              tick={{ fill: '#8a8a8a', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              label={{
                value: 'CCC (days)',
                angle: 90,
                position: 'insideRight',
                fill: '#8a8a8a',
                fontSize: 11,
              }}
            />
            <Tooltip
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
              yAxisId="days"
              dataKey="Days inventory held"
              fill="var(--color-info)"
              radius={[3, 3, 0, 0]}
            />
            <Bar
              yAxisId="days"
              dataKey="Days to collect"
              fill="var(--color-accent-secondary)"
              radius={[3, 3, 0, 0]}
            />
            <Bar
              yAxisId="days"
              dataKey="Days to pay suppliers"
              fill="var(--color-text-muted)"
              radius={[3, 3, 0, 0]}
            />
            <Line
              yAxisId="ccc"
              type="monotone"
              dataKey="ccc"
              name="Cash conversion cycle"
              stroke="var(--color-accent)"
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
