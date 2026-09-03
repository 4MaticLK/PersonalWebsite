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
import { GOODYEAR_PRICE_HISTORY } from '../data/goodyearHistoricalData';

/** OLS regression: y = alpha + beta * x. Returns intercept, slope, and R². */
function olsWithR2(x: number[], y: number[]): { alpha: number; beta: number; r2: number } {
  const n = x.length;
  if (n === 0) return { alpha: 0, beta: 0, r2: 0 };
  const meanX = x.reduce((a, v) => a + v, 0) / n;
  const meanY = y.reduce((a, v) => a + v, 0) / n;
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

const rows = GOODYEAR_PRICE_HISTORY.filter((r) => r.gtReturn != null && r.spxReturn != null);
const x = rows.map((r) => r.spxReturn as number);
const y = rows.map((r) => r.gtReturn as number);
const fit = olsWithR2(x, y);
const scatterData = rows.map((r) => ({
  x: r.spxReturn as number,
  y: r.gtReturn as number,
  fit: fit.alpha + fit.beta * (r.spxReturn as number),
}));

const xMin = Math.min(...x);
const xMax = Math.max(...x);
const yMin = Math.min(...y);
const yMax = Math.max(...y);
const xPad = (xMax - xMin) * 0.08 || 1;
const yPad = (yMax - yMin) * 0.08 || 1;

const axisStyle = {
  tick: { fill: '#8a8a8a' as const, fontSize: 10 },
  axisLine: { stroke: 'rgba(248,250,252,0.25)' as const },
  tickLine: { stroke: 'rgba(248,250,252,0.25)' as const },
  tickFormatter: (v: number) => `${Number(v).toFixed(0)}%`,
};

export function GoodyearRegressionChart() {
  return (
    <div className="portfolio-chart">
      <h3 className="portfolio-chart__title">Beta: GT vs. S&amp;P 500 monthly returns</h3>
      <p className="portfolio-chart__caption">
        This regression is where β = 1.51 in the WACC calculation comes from. Each point is one
        month's (market return, GT return); the dashed line is the OLS fit.
      </p>
      <div className="portfolio-chart__container">
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={scatterData} margin={{ top: 12, right: 16, left: 8, bottom: 20 }}>
            <CartesianGrid
              strokeDasharray="0"
              stroke="rgba(248,250,252,0.12)"
              vertical
              horizontal
            />
            <XAxis
              type="number"
              dataKey="x"
              domain={[xMin - xPad, xMax + xPad]}
              {...axisStyle}
              label={{
                value: 'Market (S&P 500) return',
                position: 'insideBottom',
                offset: -6,
                fill: '#8a8a8a',
                fontSize: 11,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[yMin - yPad, yMax + yPad]}
              {...axisStyle}
              label={{
                value: 'GT return',
                angle: -90,
                position: 'insideLeft',
                fill: '#8a8a8a',
                fontSize: 11,
              }}
            />
            <Tooltip
              formatter={(value: number) => [`${Number(value).toFixed(2)}%`, '']}
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid rgba(248,250,252,0.12)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              }}
              labelFormatter={(label) => `Market: ${Number(label).toFixed(2)}%`}
              labelStyle={{ color: 'var(--color-text)', fontWeight: 600 }}
            />
            <Scatter dataKey="y" name="GT" fill="var(--color-accent)" fillOpacity={0.85} />
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
          GT return = {fit.alpha.toFixed(3)}% + {fit.beta.toFixed(3)} × Market return
        </p>
        <dl className="regression-stats__grid">
          <div className="regression-stats__row">
            <dt>α (alpha)</dt>
            <dd>{fit.alpha.toFixed(3)}%</dd>
          </div>
          <div className="regression-stats__row">
            <dt>β (beta)</dt>
            <dd>{fit.beta.toFixed(3)}</dd>
          </div>
          <div className="regression-stats__row">
            <dt>R²</dt>
            <dd>{(fit.r2 * 100).toFixed(2)}%</dd>
          </div>
          <div className="regression-stats__row">
            <dt>n</dt>
            <dd>{rows.length} months</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
