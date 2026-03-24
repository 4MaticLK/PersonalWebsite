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
} from 'recharts';
import { parsePriceCsv, type PriceRow } from '../utils/parsePriceCsv';

const CSV_URL = '/pdfs/Sheet 2.csv';

function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit', day: 'numeric' });
}

interface PriceMovementChartProps {
  /** When true, render only inner content (no card wrapper) for use inside a shared card */
  embedded?: boolean;
}

export function PriceMovementChart({ embedded = false }: PriceMovementChartProps) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [data, setData] = useState<PriceRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(CSV_URL)
      .then((res) => {
        if (!res.ok) throw new Error('CSV not found');
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        const parsed = parsePriceCsv(text);
        if (parsed.length === 0) throw new Error('No data parsed');
        setData(parsed);
        setStatus('ok');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading') {
    const skeleton = (
      <div className="chart-skeleton">
        <div className="skeleton chart-skeleton__title" />
        <div className="skeleton chart-skeleton__subtitle" />
        <div className="skeleton chart-skeleton__body" />
      </div>
    );
    return embedded ? (
      <div className="portfolio-chart__embedded">{skeleton}</div>
    ) : (
      <div className="portfolio-chart">{skeleton}</div>
    );
  }

  if (status === 'error') {
    const content = (
      <p>
        Could not load <strong>Sheet 2.csv</strong>. Ensure the file is in{' '}
        <strong>public/pdfs/</strong>.
      </p>
    );
    return embedded ? (
      <div className="portfolio-chart__embedded portfolio-chart--error">{content}</div>
    ) : (
      <div className="portfolio-chart portfolio-chart--error">{content}</div>
    );
  }

  const chartData = data.map((row) => ({
    date: row.date,
    SPY: row.spy,
    NOC: row.noc,
    MCD: row.mcd,
  }));

  type TickerKey = 'spy' | 'noc' | 'mcd';
  const tickers: { key: TickerKey; name: string; color: string }[] = [
    { key: 'spy', name: 'SPY', color: '#94a3b8' },
    { key: 'noc', name: 'NOC', color: '#38bdf8' },
    { key: 'mcd', name: 'MCD', color: 'var(--color-accent)' },
  ];
  const stats = tickers.map(({ key, name }) => {
    const values = data.map((r) => r[key]).filter((v) => v != null && !Number.isNaN(v)) as number[];
    if (values.length === 0) return { name, min: null, max: null, minDate: null, maxDate: null };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const minRow = data.find((r) => r[key] === min);
    const maxRow = data.find((r) => r[key] === max);
    return {
      name,
      min,
      max,
      minDate: minRow?.date ?? null,
      maxDate: maxRow?.date ?? null,
    };
  });

  const inner = (
    <>
      <h3 id="price-chart-heading" className="portfolio-chart__title">
        Stock price movement: SPY vs MCD &amp; NOC
      </h3>
      <p className="portfolio-chart__caption">
        Monthly closing prices. SPY (S&P 500), MCD (McDonald’s), NOC (Northrop Grumman).
      </p>
      <div className="price-stats" aria-label="Min and max prices by ticker">
        <p className="price-stats__heading">Price range (sample period)</p>
        <div className="price-stats__grid">
          {stats.map((s) => (
            <div
              key={s.name}
              className={`price-stats__card price-stats__card--${s.name.toLowerCase()}`}
            >
              <span className="price-stats__name">{s.name}</span>
              {s.min != null && s.max != null ? (
                <>
                  <span className="price-stats__label">Min</span>
                  <span className="price-stats__value">${s.min.toFixed(2)}</span>
                  {s.minDate && <span className="price-stats__sub">{formatDate(s.minDate)}</span>}
                  <span className="price-stats__label">Max</span>
                  <span className="price-stats__value">${s.max.toFixed(2)}</span>
                  {s.maxDate && <span className="price-stats__sub">{formatDate(s.maxDate)}</span>}
                </>
              ) : (
                <span className="price-stats__value">—</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="portfolio-chart__container">
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={chartData} margin={{ top: 16, right: 20, left: 12, bottom: 24 }}>
            <CartesianGrid
              strokeDasharray="0"
              stroke="rgba(248,250,252,0.12)"
              vertical
              horizontal
            />
            <XAxis
              dataKey="date"
              type="category"
              tickFormatter={(v) => formatDate(v)}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              label={{
                value: 'Date',
                position: 'insideBottom',
                offset: -8,
                fill: '#94a3b8',
                fontSize: 12,
              }}
            />
            <YAxis
              type="number"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              label={{
                value: 'Price ($)',
                angle: -90,
                position: 'insideLeft',
                fill: '#94a3b8',
                fontSize: 12,
              }}
              tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
            />
            <Tooltip
              labelFormatter={(label) => formatDate(label)}
              formatter={(value: number) => [`$${Number(value).toFixed(2)}`, '']}
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid rgba(248,250,252,0.12)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              }}
              labelStyle={{ color: 'var(--color-text)', fontWeight: 600 }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 8 }}
              iconType="line"
              iconSize={10}
              formatter={(value) => <span className="portfolio-chart__legend-text">{value}</span>}
            />
            <Line
              type="monotone"
              dataKey="SPY"
              name="SPY"
              stroke="#94a3b8"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="NOC"
              name="NOC"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="MCD"
              name="MCD"
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );

  return embedded ? (
    <div className="portfolio-chart__embedded">{inner}</div>
  ) : (
    <div className="portfolio-chart">{inner}</div>
  );
}
