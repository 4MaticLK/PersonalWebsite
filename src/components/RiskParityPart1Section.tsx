import type { ReactNode } from 'react';
import type { ProjectChartImage } from '../data/projects';
import { Fin285aPart1Charts } from './fin285a/Fin285aPart1Charts';
import { ChartErrorBoundary } from './fin285a/ChartErrorBoundary';
import { Fin285aChartError, Fin285aChartLoading } from './fin285a/Fin285aChartShell';
import type { Fin285aChartData, Fin285aChartDataReady } from './fin285a/useFin285aChartData';

const BENCHMARK_SLEEVES = [
  { ticker: 'AGG', label: 'Nominal bonds', weight: '76.12%', color: '#8fb0aa' },
  { ticker: 'ACWI', label: 'Global equities', weight: '48.49%', color: '#38bdf8' },
  { ticker: 'GSG', label: 'Commodities', weight: '40.66%', color: '#ff7a5c' },
  { ticker: 'TIP', label: 'Inflation-linked bonds', weight: '34.74%', color: '#34d399' },
] as const;

const METHODOLOGY = [
  {
    title: 'Risk parity objective',
    detail: 'Equal risk contribution across four sleeves with 200% total leverage and minimum weight floors.',
  },
  {
    title: 'Covariance model',
    detail: 'EWMA (λ = 0.97) on an 18-month rolling window; monthly rebalance after a five-year burn-in.',
  },
  {
    title: 'Benchmark',
    detail: 'Static ALLW-style mix on the same four ETFs, rescaled to 200% notional for apples-to-apples comparison.',
  },
] as const;

function ChartsGate({
  data,
  children,
}: {
  data: Fin285aChartData;
  children: (ready: Fin285aChartDataReady) => ReactNode;
}) {
  if (data.status === 'loading') return <Fin285aChartLoading label="Part 1 charts" />;
  if (data.status === 'error') return <Fin285aChartError label="Part 1 charts" />;
  return <ChartErrorBoundary label="Part 1 charts">{children(data)}</ChartErrorBoundary>;
}

export interface RiskParityPart1SectionProps {
  chartMeta: ProjectChartImage[];
  chartData: Fin285aChartData;
}

export function RiskParityPart1Section({ chartMeta, chartData }: RiskParityPart1SectionProps) {
  return (
    <section
      id="rp-part-1"
      className="risk-parity__section risk-parity__part1"
      aria-labelledby="rp-part-1-heading"
    >
      <header className="risk-parity__part1-header">
        <p className="risk-parity__part1-kicker">Part 1</p>
        <h2 id="rp-part-1-heading" className="risk-parity__part1-title">
          Risk parity on four sleeves
        </h2>
        <p className="risk-parity__part1-lead">
          A monthly rebalanced, equal-risk-contribution portfolio on the same broad asset classes as
          the Bridgewater All Weather benchmark—before expanding to 20 granular ETFs in Part 2.
        </p>
      </header>

      <div className="risk-parity__part1-benchmark" aria-labelledby="rp-part1-bench-heading">
        <div className="risk-parity__part1-benchmark-head">
          <h3 id="rp-part1-bench-heading" className="risk-parity__part1-subheading">
            Static benchmark mix
          </h3>
          <span className="risk-parity__part1-benchmark-total">200% notional</span>
        </div>
        <ul className="risk-parity__part1-sleeve-grid">
          {BENCHMARK_SLEEVES.map(({ ticker, label, weight, color }) => (
            <li
              key={ticker}
              className="risk-parity__part1-sleeve-card"
              style={{ '--sleeve-accent': color } as React.CSSProperties}
            >
              <span className="risk-parity__part1-sleeve-ticker">{ticker}</span>
              <span className="risk-parity__part1-sleeve-label">{label}</span>
              <span className="risk-parity__part1-sleeve-weight">{weight}</span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="risk-parity__part1-method" aria-label="Methodology summary">
        {METHODOLOGY.map(({ title, detail }) => (
          <li key={title} className="risk-parity__part1-method-card">
            <span className="risk-parity__part1-method-title">{title}</span>
            <p className="risk-parity__part1-method-detail">{detail}</p>
          </li>
        ))}
      </ul>

      <div className="risk-parity__part1-charts" id="rp-charts-part1">
        <ChartsGate data={chartData}>
          {(ready) => <Fin285aPart1Charts chartMeta={chartMeta} data={ready} />}
        </ChartsGate>
      </div>
    </section>
  );
}
