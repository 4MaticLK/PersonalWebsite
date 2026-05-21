import { useState, type ReactNode } from 'react';
import type { Project } from '../data/projects';
import { BondEquityCorrelationChart } from './fin285a/BondEquityCorrelationChart';
import { ChartErrorBoundary } from './fin285a/ChartErrorBoundary';
import { Fin285aChartError, Fin285aChartLoading, Fin285aChartShell } from './fin285a/Fin285aChartShell';
import { RiskParityPart1Section } from './RiskParityPart1Section';
import { Fin285aPart2Charts } from './fin285a/Fin285aPart2Charts';
import {
  useFin285aChartData,
  type Fin285aChartData,
  type Fin285aChartDataReady,
} from './fin285a/useFin285aChartData';

const BENCHMARK_ETFS = ['AGG', 'ACWI', 'GSG', 'TIP'] as const;

const REGIME = {
  pre: {
    label: 'Pre-2022',
    correlation: '≈ −0.4 to 0',
    summary:
      'Bonds often hedged equity drawdowns. Risk parity and 60/40 portfolios benefited from negative or near-zero stock–bond correlation.',
  },
  post: {
    label: 'Post-2022',
    correlation: '≈ +0.6 to +0.8',
    summary:
      'During the inflation shock, stocks and bonds fell together. The traditional bond hedge broke—TIPS and real assets became critical diversifiers.',
  },
} as const;

type SleeveKey = 'equity' | 'bonds' | 'tips' | 'commodities';

const SLEEVES: Record<
  SleeveKey,
  {
    label: string;
    benchmarkPct: string;
    optimizedPct: string;
    funds: string;
    insight: string;
  }
> = {
  equity: {
    label: 'Equity',
    benchmarkPct: '48.49%',
    optimizedPct: '46.89%',
    funds: 'VTI, HEDJ, VWO, QQQ, IWM, EWJ, INDA',
    insight:
      'Regional dispersion was large (e.g. QQQ vs VWO). Granular ETFs capture U.S., Europe, and EM differently than a single ACWI sleeve.',
  },
  bonds: {
    label: 'Nominal bonds',
    benchmarkPct: '76.12%',
    optimizedPct: '58.62%',
    funds: 'AGG, BNDX, TLT, LQD, HYG',
    insight:
      'Duration dominated outcomes: long Treasuries (TLT) lagged while high yield (HYG) held up better in the 2019–2025 test window.',
  },
  tips: {
    label: 'TIPS',
    benchmarkPct: '34.74%',
    optimizedPct: '57.16%',
    funds: 'TIP, STPZ',
    insight:
      'Short-duration TIPS (STPZ) were a relative safe haven versus long nominal bonds when rates and inflation surprised to the upside.',
  },
  commodities: {
    label: 'Commodities',
    benchmarkPct: '40.66%',
    optimizedPct: '37.33%',
    funds: 'GLD, USO, CPER, SLV, DBA, UNG',
    insight:
      'Precious metals (GLD, SLV) diversified well; energy (USO, UNG) faced drawdowns and roll drag—splitting GSG matters for risk control.',
  },
};

const TAKEAWAYS = [
  'Correlation regimes matter: monitor whether bonds still hedge equities before scaling risk parity or 60/40 exposure.',
  'Validate models out of sample: MA covariance with a longer training window generalized better than EWMA on tracking-error forecasts.',
  'Granular sleeves improve replication: broad ETFs hide large within-asset-class dispersion that drives tracking error and diversification.',
] as const;

function renderDescriptionHtml(paragraph: string) {
  const html = paragraph
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+?)\*/g, '<em>$1</em>');
  return { __html: html };
}

function Fin285aChartsGate({
  data,
  children,
}: {
  data: Fin285aChartData;
  children: (ready: Fin285aChartDataReady) => ReactNode;
}) {
  if (data.status === 'loading') {
    return <Fin285aChartLoading label="chart data" />;
  }
  if (data.status === 'error') {
    return <Fin285aChartError label="chart data" />;
  }
  return <ChartErrorBoundary label="Interactive charts">{children(data)}</ChartErrorBoundary>;
}

export interface RiskParityProjectContentProps {
  project: Project;
}

export function RiskParityProjectContent({ project }: RiskParityProjectContentProps) {
  const [regime, setRegime] = useState<'pre' | 'post'>('pre');
  const [sleeve, setSleeve] = useState<SleeveKey>('equity');
  const regimeData = REGIME[regime];
  const sleeveData = SLEEVES[sleeve];
  const chartData = useFin285aChartData();
  const chartMeta = project.chartImages ?? [];
  const bondMeta = chartMeta.find((c) => c.file.includes('bond-equity'));

  return (
    <div className="risk-parity">
      <header id="rp-overview" className="risk-parity__intro">
        {project.description != null && project.description.length > 0 && (
          <div className="project-page__body project-page__body--report-first risk-parity__overview">
            {project.description.split(/\n\n+/).map((para, i) => (
              <p
                key={i}
                className="project-page__body-p"
                dangerouslySetInnerHTML={renderDescriptionHtml(para)}
              />
            ))}
          </div>
        )}

        <div className="risk-parity__intro-panel">
          <div className="risk-parity__hero-chips" aria-label="Benchmark ETF proxies">
            {BENCHMARK_ETFS.map((ticker) => (
              <span key={ticker} className="risk-parity__chip">
                {ticker}
              </span>
            ))}
            <span className="risk-parity__chip risk-parity__chip--muted">
              200% leverage · monthly rebalance
            </span>
          </div>

          {(project.pdfFile != null || project.excelFile != null) && (
            <div className="project-page__downloads risk-parity__downloads">
              {project.pdfFile && (
                <a
                  href={`/pdfs/${encodeURIComponent(project.pdfFile)}`}
                  className="project-page__download project-page__download--primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open presentation (PDF)
                </a>
              )}
              {project.excelFile && (
                <a
                  href={`/pdfs/${encodeURIComponent(project.excelFile)}`}
                  download={project.excelFile}
                  className="project-page__download project-page__download--secondary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download daily price data (Excel)
                </a>
              )}
            </div>
          )}

          <section className="project-page__key-metrics risk-parity__metrics" aria-labelledby="rp-metrics-heading">
            <h2 id="rp-metrics-heading" className="project-page__key-metrics-heading">
              Key results
            </h2>
            <div className="project-page__key-metrics-grid">
              <div className="project-page__key-metrics-card project-page__key-metrics-card--accent">
                <span className="project-page__key-metrics-label">Regime insight</span>
                <span className="project-page__key-metrics-value">2022 shift</span>
                <span className="project-page__key-metrics-sub">
                  Bond–equity correlation turned positive in the inflation shock
                </span>
              </div>
              <div className="project-page__key-metrics-card">
                <span className="project-page__key-metrics-label">Best TE validation</span>
                <span className="project-page__key-metrics-value">~12 bps gap</span>
                <span className="project-page__key-metrics-sub">
                  7-year train, MA model (forecast vs realized)
                </span>
              </div>
              <div className="project-page__key-metrics-card">
                <span className="project-page__key-metrics-label">Test-period Sharpe</span>
                <span className="project-page__key-metrics-value">~0.77–0.78</span>
                <span className="project-page__key-metrics-sub">
                  Optimized vs benchmark, 2019–2025 out-of-sample
                </span>
              </div>
              <div className="project-page__key-metrics-card">
                <span className="project-page__key-metrics-label">Universe</span>
                <span className="project-page__key-metrics-value">20 ETFs</span>
                <span className="project-page__key-metrics-sub">
                  4 sleeves · train 2014–2018 / test 2019–2025
                </span>
              </div>
            </div>
          </section>
        </div>
      </header>

      <RiskParityPart1Section chartMeta={chartMeta} chartData={chartData} />

      <section
        id="rp-regime"
        className="risk-parity__section risk-parity__section--charts"
        aria-labelledby="rp-regime-heading"
      >
        <div className="risk-parity__section-header">
          <h2 id="rp-regime-heading" className="risk-parity__section-title">
            Bond–equity correlation regime
          </h2>
          <div
            className="project-page__scenario-toggles"
            role="group"
            aria-label="Correlation regime period"
          >
            {(['pre', 'post'] as const).map((key) => (
              <button
                key={key}
                type="button"
                className={`project-page__scenario-btn ${regime === key ? 'project-page__scenario-btn--active' : ''}`}
                onClick={() => setRegime(key)}
                aria-pressed={regime === key}
              >
                {REGIME[key].label}
              </button>
            ))}
          </div>
        </div>
        <div className="risk-parity__regime-layout">
          <div className="risk-parity__regime-stat">
            <span className="risk-parity__regime-stat-label">Typical correlation</span>
            <span className="risk-parity__regime-stat-value">{regimeData.correlation}</span>
            <p className="risk-parity__regime-stat-desc">{regimeData.summary}</p>
          </div>
          <div className="risk-parity__regime-chart" id="rp-charts-regime">
            <Fin285aChartsGate data={chartData}>
              {(ready) => (
                <Fin285aChartShell
                  id="fin285a-chart-corr-be"
                  title={bondMeta?.caption ?? 'Rolling bond–equity correlation'}
                  description={bondMeta?.description}
                >
                  <BondEquityCorrelationChart data={ready.bondCorr} />
                </Fin285aChartShell>
              )}
            </Fin285aChartsGate>
          </div>
        </div>
      </section>

      <section
        id="rp-part-2"
        className="risk-parity__section risk-parity__section--charts"
        aria-labelledby="rp-part-2-heading"
      >
        <h2 id="rp-part-2-heading" className="risk-parity__section-title">
          Part 2 — Tracking error minimization (20 ETFs)
        </h2>
        <div className="risk-parity__section-layout risk-parity__section-layout--stacked">
          <div className="risk-parity__section-prose">
            <p className="risk-parity__lead">
              Split each benchmark sleeve into liquid sub-ETFs and solve for weights that minimize
              tracking error against the Part 1 benchmark, subject to leverage and sleeve constraints.
            </p>
            <div
              className="project-page__scenario-toggles risk-parity__sleeve-toggles"
              role="tablist"
              aria-label="Asset sleeve"
            >
              {(Object.keys(SLEEVES) as SleeveKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={sleeve === key}
                  className={`project-page__scenario-btn ${sleeve === key ? 'project-page__scenario-btn--active' : ''}`}
                  onClick={() => setSleeve(key)}
                >
                  {SLEEVES[key].label}
                </button>
              ))}
            </div>
            <div className="risk-parity__sleeve-panel" role="tabpanel">
              <div className="risk-parity__sleeve-weights">
                <div>
                  <span className="risk-parity__sleeve-weights-label">Benchmark sleeve</span>
                  <span className="risk-parity__sleeve-weights-value">{sleeveData.benchmarkPct}</span>
                </div>
                <div>
                  <span className="risk-parity__sleeve-weights-label">Optimized sleeve</span>
                  <span className="risk-parity__sleeve-weights-value">{sleeveData.optimizedPct}</span>
                </div>
              </div>
              <p className="risk-parity__sleeve-funds">
                <strong>Funds:</strong> {sleeveData.funds}
              </p>
              <p className="risk-parity__sleeve-insight">{sleeveData.insight}</p>
            </div>
          </div>
          <div className="risk-parity__section-charts">
            <Fin285aChartsGate data={chartData}>
              {(ready) => <Fin285aPart2Charts chartMeta={chartMeta} data={ready} />}
            </Fin285aChartsGate>
          </div>
        </div>
      </section>

      <section
        id="rp-validation"
        className="risk-parity__section"
        aria-labelledby="rp-validation-heading"
      >
        <h2 id="rp-validation-heading" className="risk-parity__section-title">
          Model validation
        </h2>
        <div className="risk-parity__validation-grid">
          <div className="risk-parity__validation-step">
            <span className="risk-parity__validation-step-num">1</span>
            <div>
              <h3 className="risk-parity__validation-step-title">Train (2014–2018)</h3>
              <p>
                Estimate covariance (MA or EWMA), optimize weights, compute in-sample tracking
                error.
              </p>
            </div>
          </div>
          <div className="risk-parity__validation-step">
            <span className="risk-parity__validation-step-num">2</span>
            <div>
              <h3 className="risk-parity__validation-step-title">Test (2019–2025)</h3>
              <p>Freeze weights; measure realized out-of-sample tracking error on unseen returns.</p>
            </div>
          </div>
          <div className="risk-parity__validation-step">
            <span className="risk-parity__validation-step-num">3</span>
            <div>
              <h3 className="risk-parity__validation-step-title">Compare</h3>
              <p>
                MA (5yr train): forecast ~223 bps vs realized ~298 bps (75 bps gap). Best
                sensitivity: 7yr train + MA (~12 bps gap).
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="risk-parity__section" aria-labelledby="rp-takeaways-heading">
        <h2 id="rp-takeaways-heading" className="risk-parity__section-title">
          Takeaways
        </h2>
        <ul className="risk-parity__bullets">
          {TAKEAWAYS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {project.codeFiles != null && project.codeFiles.length > 0 && (
        <section
          id="rp-replicate"
          className="risk-parity__section risk-parity__replicate"
          aria-labelledby="rp-replicate-heading"
        >
          <h2 id="rp-replicate-heading" className="risk-parity__section-title">
            Replicate this project
          </h2>
          <p className="risk-parity__lead">
            Download the Jupyter notebooks, price data, and dependencies to rerun the full analysis
            locally. Notebooks are provided without saved cell outputs so you can reproduce results
            from a clean run.
          </p>
          <ol className="risk-parity__replicate-steps">
            <li>
              Install Python 3.10+ and create a virtual environment; run{' '}
              <code>pip install -r requirements.txt</code> from the downloaded folder.
            </li>
            <li>
              Run <strong>Part1.ipynb</strong> (downloads four ETFs from Yahoo Finance; internet
              required).
            </li>
            <li>
              Keep <strong>AssetPrices_Part2.xlsx</strong> in the same folder as{' '}
              <strong>Part2.ipynb</strong>, then run Part 2 (or set{' '}
              <code>FLAG_DOWNLOAD_DATA = True</code> in the notebook to refresh prices).
            </li>
          </ol>
          <ul className="risk-parity__code-list">
            {project.codeFiles.map((file) => (
              <li key={file.path} className="risk-parity__code-item">
                <a
                  href={`/${file.path.split('/').map(encodeURIComponent).join('/')}`}
                  download={file.label}
                  className="risk-parity__code-link"
                >
                  {file.label}
                </a>
                {file.description != null && (
                  <span className="risk-parity__code-desc">{file.description}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className="risk-parity__appendix">
        <summary>Technical appendix</summary>
        <div className="risk-parity__appendix-body">
          <p>
            <strong>Risk parity objective:</strong> minimize squared deviations of each asset&apos;s
            risk contribution from equal risk budgets, subject to weights summing to 200% and
            minimum weights per asset.
          </p>
          <p>
            <strong>Tracking error objective:</strong> minimize TE = √(w′Σ<sub>ff</sub>w −
            2w′Σ<sub>fb</sub> + σ²<sub>b</sub>) with sleeve floors, equity and commodity caps, and
            non-negative weights.
          </p>
          <p>
            Implementation: Python (NumPy, SciPy SLSQP), monthly log returns from Yahoo Finance
            adjusted closes. Transaction costs not modeled.
          </p>
        </div>
      </details>
    </div>
  );
}
