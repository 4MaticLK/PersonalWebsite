import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { GOODYEAR_RATIO_HISTORY } from '../data/goodyearHistoricalData';

interface Metric {
  key: 'eps' | 'roe' | 'revenueGrowth' | 'profitMargin';
  label: string;
  format: (v: number) => string;
}

const METRICS: Metric[] = [
  { key: 'eps', label: 'EPS', format: (v) => `$${v.toFixed(2)}` },
  { key: 'roe', label: 'Return on equity', format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'revenueGrowth', label: 'Revenue growth', format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'profitMargin', label: 'Profit margin', format: (v) => `${(v * 100).toFixed(1)}%` },
];

function Sparkline({
  metricKey,
  format,
}: {
  metricKey: Metric['key'];
  format: (v: number) => string;
}) {
  const data = GOODYEAR_RATIO_HISTORY.map((r) => ({
    year: r.year.replace("DEC '", "'"),
    value: r[metricKey],
  }));
  const values = data.map((d) => d.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const last = values[values.length - 1];
  const color = last >= 0 ? 'var(--color-positive)' : 'var(--color-negative)';
  return (
    <div className="goodyear-sparkline">
      <div className="goodyear-sparkline__header">
        <span className="goodyear-sparkline__label">
          {METRICS.find((m) => m.key === metricKey)?.label}
        </span>
        <span className="goodyear-sparkline__value" style={{ color }}>
          {format(last)}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={64}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <YAxis domain={[min, max]} hide />
          <XAxis dataKey="year" hide />
          <ReferenceLine y={0} stroke="rgba(248,250,252,0.15)" />
          <Tooltip
            formatter={(value: number) => [format(value), '']}
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid rgba(248,250,252,0.12)',
              borderRadius: 'var(--radius)',
              padding: '6px 10px',
              fontSize: '0.8125rem',
            }}
            labelFormatter={(label) => `DEC ${label}`}
            labelStyle={{ color: 'var(--color-text)', fontWeight: 600 }}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 2.5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GoodyearRatioTrends() {
  return (
    <div className="project-page__table-block">
      <h3 className="project-page__table-title">Key ratios, 2020–2024</h3>
      <p className="goodyear-sparkline-note">
        The single-year snapshot hides the turnaround. EPS, ROE, and margins all bottomed in
        2020–2023 and have moved back toward positive territory.
      </p>
      <div className="goodyear-sparkline-grid">
        {METRICS.map((m) => (
          <Sparkline key={m.key} metricKey={m.key} format={m.format} />
        ))}
      </div>
      <table className="project-page__table goodyear-ratio-table">
        <thead>
          <tr>
            <th></th>
            {GOODYEAR_RATIO_HISTORY.map((r) => (
              <th key={r.year}>{r.year}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Current ratio</td>
            {GOODYEAR_RATIO_HISTORY.map((r) => (
              <td key={r.year}>{r.currentRatio.toFixed(2)}</td>
            ))}
          </tr>
          <tr>
            <td>Quick ratio</td>
            {GOODYEAR_RATIO_HISTORY.map((r) => (
              <td key={r.year}>{r.quickRatio.toFixed(2)}</td>
            ))}
          </tr>
          <tr>
            <td>Debt ratio</td>
            {GOODYEAR_RATIO_HISTORY.map((r) => (
              <td key={r.year}>{r.debtRatio.toFixed(2)}</td>
            ))}
          </tr>
          <tr>
            <td>Earnings per share</td>
            {GOODYEAR_RATIO_HISTORY.map((r) => (
              <td key={r.year}>${r.eps.toFixed(2)}</td>
            ))}
          </tr>
          <tr>
            <td>Return on assets</td>
            {GOODYEAR_RATIO_HISTORY.map((r) => (
              <td key={r.year}>{(r.roa * 100).toFixed(2)}%</td>
            ))}
          </tr>
          <tr>
            <td>Return on equity</td>
            {GOODYEAR_RATIO_HISTORY.map((r) => (
              <td key={r.year}>{(r.roe * 100).toFixed(2)}%</td>
            ))}
          </tr>
          <tr>
            <td>Revenue growth</td>
            {GOODYEAR_RATIO_HISTORY.map((r) => (
              <td key={r.year}>{(r.revenueGrowth * 100).toFixed(2)}%</td>
            ))}
          </tr>
          <tr>
            <td>Profit margin</td>
            {GOODYEAR_RATIO_HISTORY.map((r) => (
              <td key={r.year}>{(r.profitMargin * 100).toFixed(2)}%</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
