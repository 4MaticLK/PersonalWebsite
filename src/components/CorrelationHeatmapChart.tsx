import { useState, useEffect } from 'react';
import { parseRegressionCsv, type RegressionRow } from '../utils/parseRegressionCsv';

const CSV_URL = '/pdfs/Sheet 3.csv';

const LABELS = ['SPY', 'NOC', 'MCD'] as const;

function correlation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;
  const sumX = x.reduce((a, v) => a + v, 0);
  const sumY = y.reduce((a, v) => a + v, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  const denom = Math.sqrt(varX * varY);
  return denom === 0 ? 0 : cov / denom;
}

/** Build 3x3 correlation matrix [row][col] for SPY, NOC, MCD. */
function correlationMatrix(data: RegressionRow[]): number[][] {
  const spy = data.map((d) => d.spyReturn);
  const noc = data.map((d) => d.nocReturn);
  const mcd = data.map((d) => d.mcdReturn);
  const series = [spy, noc, mcd];
  const matrix: number[][] = [];
  for (let i = 0; i < 3; i++) {
    matrix.push([]);
    for (let j = 0; j < 3; j++) {
      matrix[i][j] = correlation(series[i], series[j]);
    }
  }
  return matrix;
}

/** Interpolate color for correlation r in [-1, 1]. Negative = red tint, positive = blue/accent. */
function correlationColor(r: number): string {
  const t = (r + 1) / 2; // 0 to 1
  if (t <= 0.5) {
    const s = t * 2; // 0 to 1 from -1 to 0
    return `rgba(248, 113, 113, ${0.15 + 0.35 * (1 - s)})`; // red tint
  }
  const s = (t - 0.5) * 2; // 0 to 1 from 0 to 1
  return `rgba(56, 189, 248, ${0.15 + 0.35 * s})`; // blue tint (NOC blue)
}

export function CorrelationHeatmapChart() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [matrix, setMatrix] = useState<number[][] | null>(null);

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
        const parsed = parseRegressionCsv(text);
        if (parsed.length < 2) throw new Error('Not enough data for correlation');
        setMatrix(correlationMatrix(parsed));
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
        <p>Loading correlation data…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="portfolio-chart portfolio-chart--error">
        <p>Could not load <strong>Sheet 3.csv</strong>. Ensure the file is in <strong>public/pdfs/</strong>.</p>
      </div>
    );
  }

  if (!matrix) return null;

  return (
    <div className="portfolio-chart portfolio-chart--compact">
      <h3 id="correlation-chart-heading" className="portfolio-chart__title">
        Return correlation matrix
      </h3>
      <p className="portfolio-chart__caption">
        Sample correlation of monthly returns (SPY, NOC, MCD). Values from −1 to 1; lower correlation supports diversification.
      </p>
      <div className="correlation-heatmap">
        <div className="correlation-heatmap__grid" role="table" aria-label="Correlation matrix">
          <div className="correlation-heatmap__row correlation-heatmap__row--header">
            <div className="correlation-heatmap__cell correlation-heatmap__cell--header" aria-hidden="true" />
            {LABELS.map((label) => (
              <div key={label} className="correlation-heatmap__cell correlation-heatmap__cell--header" role="columnheader">
                {label}
              </div>
            ))}
          </div>
          {LABELS.map((rowLabel, i) => (
            <div key={rowLabel} className="correlation-heatmap__row" role="row">
              <div className="correlation-heatmap__cell correlation-heatmap__cell--header" role="rowheader">
                {rowLabel}
              </div>
              {LABELS.map((colLabel, j) => {
                const value = matrix[i][j];
                const isDiagonal = i === j;
                return (
                  <div
                    key={colLabel}
                    className="correlation-heatmap__cell"
                    role="cell"
                    style={{ backgroundColor: isDiagonal ? 'rgba(248,250,252,0.06)' : correlationColor(value) }}
                    title={`${rowLabel}–${colLabel}: ${value.toFixed(3)}`}
                  >
                    {value.toFixed(2)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="correlation-heatmap__legend">
          <span className="correlation-heatmap__legend-label">−1</span>
          <div className="correlation-heatmap__legend-bar" />
          <span className="correlation-heatmap__legend-label">+1</span>
        </div>
      </div>
    </div>
  );
}
