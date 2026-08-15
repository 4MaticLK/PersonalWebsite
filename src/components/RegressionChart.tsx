import { useState, useEffect } from 'react';
import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { parseRegressionCsv, type RegressionRow } from '../utils/parseRegressionCsv';

const CSV_URL = '/pdfs/Sheet 3.csv';

/** OLS regression: y = alpha + beta * x. Returns intercept, slope, and R². */
function olsWithR2(x: number[], y: number[]): { alpha: number; beta: number; r2: number } {
  const n = x.length;
  if (n === 0) return { alpha: 0, beta: 0, r2: 0 };
  const sumX = x.reduce((a, v) => a + v, 0);
  const sumY = y.reduce((a, v) => a + v, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  let cov = 0;
  let varX = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    cov += dx * dy;
    varX += dx * dx;
  }
  const beta = varX === 0 ? 0 : cov / varX;
  const alpha = meanY - beta * meanX;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yHat = alpha + beta * x[i];
    ssRes += (y[i] - yHat) ** 2;
    ssTot += (y[i] - meanY) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);
  return { alpha, beta, r2 };
}

export function RegressionChart() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [data, setData] = useState<RegressionRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(CSV_URL)
      .then((res) => {
        if (!res.ok) throw new Error('CSV not found');
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        const parsed = parseRegressionCsv(text);
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
    return (
      <div className="portfolio-chart portfolio-chart--loading">
        <p>Loading regression data…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="portfolio-chart portfolio-chart--error">
        <p>
          Could not load <strong>Sheet 3.csv</strong>. Ensure the file is in{' '}
          <strong>public/pdfs/</strong>.
        </p>
      </div>
    );
  }

  const x = data.map((d) => d.spyReturn);
  const nocY = data.map((d) => d.nocReturn);
  const mcdY = data.map((d) => d.mcdReturn);
  const nocFit = olsWithR2(x, nocY);
  const mcdFit = olsWithR2(x, mcdY);
  const n = data.length;

  const nocData = data.map((d) => ({
    x: d.spyReturn,
    y: d.nocReturn,
    fit: nocFit.alpha + nocFit.beta * d.spyReturn,
  }));
  const mcdData = data.map((d) => ({
    x: d.spyReturn,
    y: d.mcdReturn,
    fit: mcdFit.alpha + mcdFit.beta * d.spyReturn,
  }));

  const xMin = Math.min(...x);
  const xMax = Math.max(...x);
  const padding = 0.05;
  const xPadding = (xMax - xMin) * padding || 1;

  const yMinNoc = Math.min(...nocY);
  const yMaxNoc = Math.max(...nocY);
  const yMinMcd = Math.min(...mcdY);
  const yMaxMcd = Math.max(...mcdY);
  const yPadNoc = (yMaxNoc - yMinNoc) * padding || 1;
  const yPadMcd = (yMaxMcd - yMinMcd) * padding || 1;

  const sharedAxisStyle = {
    tick: { fill: '#8a8a8a' as const, fontSize: 10 },
    axisLine: { stroke: 'rgba(248,250,252,0.25)' as const },
    tickLine: { stroke: 'rgba(248,250,252,0.25)' as const },
    tickFormatter: (v: number) => `${Number(v).toFixed(1)}%`,
  };
  const tooltipStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid rgba(248,250,252,0.12)',
    borderRadius: 'var(--radius-lg)',
    padding: '12px 16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
  };

  return (
    <div className="portfolio-chart">
      <h3 id="regression-chart-heading" className="portfolio-chart__title">
        Stock vs market (SPY) regression
      </h3>
      <p className="portfolio-chart__caption">
        Monthly returns: each point is (market return %, stock return %). Dashed line is OLS fit
        (beta = sensitivity to market).
      </p>
      <div className="regression-chart__split">
        <div className="regression-chart__panel">
          <p className="regression-chart__panel-title">NOC vs market</p>
          <div className="portfolio-chart__container">
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={nocData} margin={{ top: 12, right: 16, left: 8, bottom: 20 }}>
                <CartesianGrid
                  strokeDasharray="0"
                  stroke="rgba(248,250,252,0.12)"
                  vertical
                  horizontal
                />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[xMin - xPadding, xMax + xPadding]}
                  {...sharedAxisStyle}
                  label={{
                    value: 'Market (SPY %)',
                    position: 'insideBottom',
                    offset: -6,
                    fill: '#8a8a8a',
                    fontSize: 11,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  domain={[yMinNoc - yPadNoc, yMaxNoc + yPadNoc]}
                  {...sharedAxisStyle}
                  label={{
                    value: 'NOC return (%)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#8a8a8a',
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  formatter={(value: number) => [`${Number(value).toFixed(2)}%`, '']}
                  contentStyle={tooltipStyle}
                  labelFormatter={(label) => `Market: ${Number(label).toFixed(2)}%`}
                  labelStyle={{ color: 'var(--color-text)', fontWeight: 600 }}
                />
                <Scatter dataKey="y" name="NOC" fill="#38bdf8" fillOpacity={0.85} />
                <Line
                  type="monotone"
                  dataKey="fit"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 4"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="regression-stats regression-stats--noc">
            <p className="regression-stats__equation">
              NOC return = {nocFit.alpha.toFixed(3)}% + {nocFit.beta.toFixed(3)} × Market return
            </p>
            <dl className="regression-stats__grid">
              <div className="regression-stats__row">
                <dt>α (alpha)</dt>
                <dd>{nocFit.alpha.toFixed(3)}%</dd>
              </div>
              <div className="regression-stats__row">
                <dt>β (beta)</dt>
                <dd>{nocFit.beta.toFixed(3)}</dd>
              </div>
              <div className="regression-stats__row">
                <dt>R²</dt>
                <dd>{(nocFit.r2 * 100).toFixed(2)}%</dd>
              </div>
              <div className="regression-stats__row">
                <dt>n</dt>
                <dd>{n} months</dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="regression-chart__panel">
          <p className="regression-chart__panel-title">MCD vs market</p>
          <div className="portfolio-chart__container">
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={mcdData} margin={{ top: 12, right: 16, left: 8, bottom: 20 }}>
                <CartesianGrid
                  strokeDasharray="0"
                  stroke="rgba(248,250,252,0.12)"
                  vertical
                  horizontal
                />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[xMin - xPadding, xMax + xPadding]}
                  {...sharedAxisStyle}
                  label={{
                    value: 'Market (SPY %)',
                    position: 'insideBottom',
                    offset: -6,
                    fill: '#8a8a8a',
                    fontSize: 11,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  domain={[yMinMcd - yPadMcd, yMaxMcd + yPadMcd]}
                  {...sharedAxisStyle}
                  label={{
                    value: 'MCD return (%)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#8a8a8a',
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  formatter={(value: number) => [`${Number(value).toFixed(2)}%`, '']}
                  contentStyle={tooltipStyle}
                  labelFormatter={(label) => `Market: ${Number(label).toFixed(2)}%`}
                  labelStyle={{ color: 'var(--color-text)', fontWeight: 600 }}
                />
                <Scatter dataKey="y" name="MCD" fill="var(--color-accent)" fillOpacity={0.85} />
                <Line
                  type="monotone"
                  dataKey="fit"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 4"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="regression-stats regression-stats--mcd">
            <p className="regression-stats__equation">
              MCD return = {mcdFit.alpha.toFixed(3)}% + {mcdFit.beta.toFixed(3)} × Market return
            </p>
            <dl className="regression-stats__grid">
              <div className="regression-stats__row">
                <dt>α (alpha)</dt>
                <dd>{mcdFit.alpha.toFixed(3)}%</dd>
              </div>
              <div className="regression-stats__row">
                <dt>β (beta)</dt>
                <dd>{mcdFit.beta.toFixed(3)}</dd>
              </div>
              <div className="regression-stats__row">
                <dt>R²</dt>
                <dd>{(mcdFit.r2 * 100).toFixed(2)}%</dd>
              </div>
              <div className="regression-stats__row">
                <dt>n</dt>
                <dd>{n} months</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
