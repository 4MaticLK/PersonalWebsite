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
import { parsePriceCsv, computeReturnsFromPrices, type ReturnsRow } from '../utils/parsePriceCsv';

const CSV_URL = '/pdfs/Sheet 2.csv';

function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit', day: 'numeric' });
}

/** Shorter for axis labels so they don’t overlap */
function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

interface ReturnsOverTimeChartProps {
  /** When true, render only inner content (no card wrapper) for use inside a shared card */
  embedded?: boolean;
}

export function ReturnsOverTimeChart({ embedded = false }: ReturnsOverTimeChartProps) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [data, setData] = useState<ReturnsRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(CSV_URL)
      .then((res) => {
        if (!res.ok) throw new Error('CSV not found');
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        const priceRows = parsePriceCsv(text);
        if (priceRows.length < 2) throw new Error('Not enough price data to compute returns');
        const returns = computeReturnsFromPrices(priceRows);
        setData(returns);
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
    const content = <p>Loading returns data…</p>;
    return embedded ? (
      <div className="portfolio-chart__embedded portfolio-chart--loading">{content}</div>
    ) : (
      <div className="portfolio-chart portfolio-chart--loading">{content}</div>
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
    SPY: row.spyReturn,
    NOC: row.nocReturn,
    MCD: row.mcdReturn,
  }));

  const yValues = data.flatMap((r) => [r.spyReturn, r.nocReturn, r.mcdReturn]);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const yPad = Math.max(1, (yMax - yMin) * 0.08) || 1;
  const yDomain = [yMin - yPad, yMax + yPad];

  const xTickInterval = Math.max(1, Math.floor(chartData.length / 12));

  const tickers = [
    { key: 'spyReturn' as const, name: 'SPY' },
    { key: 'nocReturn' as const, name: 'NOC' },
    { key: 'mcdReturn' as const, name: 'MCD' },
  ];
  const returnStats = tickers.map(({ key, name }) => {
    const values = data.map((r) => r[key]);
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
      <h3 id="returns-chart-heading" className="portfolio-chart__title">
        Monthly returns over time
      </h3>
      <p className="portfolio-chart__caption">
        Period-over-period return % derived from closing prices. SPY (market), NOC, MCD.
      </p>
      <div className="returns-stats" aria-label="Lowest and highest returns by ticker">
        <p className="returns-stats__heading">Return range (sample period)</p>
        <div className="returns-stats__grid">
          {returnStats.map((s) => (
            <div
              key={s.name}
              className={`returns-stats__card returns-stats__card--${s.name.toLowerCase()}`}
            >
              <span className="returns-stats__name">{s.name}</span>
              {s.min != null && s.max != null ? (
                <>
                  <span className="returns-stats__label">Lowest</span>
                  <span className="returns-stats__value">{s.min.toFixed(2)}%</span>
                  {s.minDate && <span className="returns-stats__sub">{formatDate(s.minDate)}</span>}
                  <span className="returns-stats__label">Highest</span>
                  <span className="returns-stats__value">{s.max.toFixed(2)}%</span>
                  {s.maxDate && <span className="returns-stats__sub">{formatDate(s.maxDate)}</span>}
                </>
              ) : (
                <span className="returns-stats__value">—</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="portfolio-chart__container">
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={chartData} margin={{ top: 20, right: 24, left: 20, bottom: 28 }}>
            <CartesianGrid
              strokeDasharray="0"
              stroke="rgba(248,250,252,0.1)"
              vertical={false}
              horizontal
            />
            <XAxis
              dataKey="date"
              type="category"
              interval={xTickInterval}
              tickFormatter={(v) => formatDateShort(v)}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              label={{
                value: 'Date',
                position: 'insideBottom',
                offset: -10,
                fill: '#94a3b8',
                fontSize: 12,
              }}
            />
            <YAxis
              type="number"
              domain={yDomain}
              tickCount={6}
              allowDecimals={true}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              tickLine={{ stroke: 'rgba(248,250,252,0.25)' }}
              label={{
                value: 'Return (%)',
                angle: -90,
                position: 'insideLeft',
                fill: '#94a3b8',
                fontSize: 12,
              }}
              tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
            />
            <Tooltip
              labelFormatter={(label) => formatDate(label)}
              formatter={(value: number) => [`${Number(value).toFixed(2)}%`, '']}
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
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="NOC"
              name="NOC"
              stroke="#38bdf8"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="MCD"
              name="MCD"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
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
