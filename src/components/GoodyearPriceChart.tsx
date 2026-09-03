import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { GOODYEAR_PRICE_HISTORY } from '../data/goodyearHistoricalData';

const baseGt = GOODYEAR_PRICE_HISTORY[0].gt;
const baseSpx = GOODYEAR_PRICE_HISTORY[0].spx;

const chartData = GOODYEAR_PRICE_HISTORY.map((row) => ({
  date: row.date,
  label: row.date.slice(0, 7),
  gtIndexed: (row.gt / baseGt) * 100,
  spxIndexed: (row.spx / baseSpx) * 100,
  gtPrice: row.gt,
}));

interface TooltipPayloadItem {
  payload: { label: string; gtIndexed: number; spxIndexed: number; gtPrice: number };
}

function PriceTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const { label, gtIndexed, spxIndexed, gtPrice } = payload[0].payload;
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
      <div style={{ color: 'var(--color-text)', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--color-accent)' }}>
        GT: ${gtPrice.toFixed(2)} (index {gtIndexed.toFixed(0)})
      </div>
      <div style={{ color: 'var(--color-text-muted)' }}>
        S&amp;P 500 index {spxIndexed.toFixed(0)}
      </div>
    </div>
  );
}

export function GoodyearPriceChart() {
  return (
    <div className="portfolio-chart">
      <h3 className="portfolio-chart__title">Price vs. the market, May 2020–Dec 2024</h3>
      <p className="portfolio-chart__caption">
        Monthly closes, both series indexed to 100 at May 2020, so the lines are directly comparable
        regardless of price level. GT swings far more than the S&amp;P 500 in both directions — the
        same volatility that produces the β = 1.51 used in the WACC below.
      </p>
      <div className="portfolio-chart__container">
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={chartData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="0" stroke="rgba(248,250,252,0.12)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#8a8a8a', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: '#8a8a8a', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              label={{
                value: 'Indexed (May 2020 = 100)',
                angle: -90,
                position: 'insideLeft',
                fill: '#8a8a8a',
                fontSize: 11,
              }}
            />
            <Tooltip content={<PriceTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}
              formatter={(value) => (value === 'gtIndexed' ? 'Goodyear (GT)' : 'S&P 500')}
            />
            <Line
              type="monotone"
              dataKey="gtIndexed"
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="spxIndexed"
              stroke="#8a8a8a"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
