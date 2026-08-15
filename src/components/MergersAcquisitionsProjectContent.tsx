import { Fragment, useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Project } from '../data/projects';
import {
  bilinearInterpEv,
  CRM_STANDALONE_EPS,
  DEAL_STRUCTURES,
  FOOTBALL_FIELD,
  formatBillions,
  HUBS_BID_EV_REV,
  HUBS_DCF_BASE,
  HUBS_DCF_SENSITIVITY,
  HUBS_GROWTH_LEVELS,
  HUBS_WACC_LEVELS,
  PROJECTION_YEARS,
  PROPOSED_BID_B,
  TRADING_COMPS_MEDIAN,
  type DealStructure,
} from '../data/maProjectData';
import {
  CreditMetricsSection,
  CrmDcfSummarySection,
  DealStructureComparisonSection,
  DebtPaydownSection,
  PrecedentTransactionsSection,
  ProFormaFinancialsSection,
  SynergyBuildUpSection,
  TradingCompsSection,
} from './ma/MaProjectSections';
import { ExcelViewer } from './ExcelViewer';
import { MaProjectSubnav } from './MaProjectSubnav';

function renderDescriptionHtml(para: string): { __html: string } {
  const html = para
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+?)\*/g, '<em>$1</em>');
  return { __html: html };
}

function FootballFieldChart() {
  const scaleMax = 35000;

  return (
    <div className="ma-project__football" role="img" aria-label="Valuation football field summary">
      {FOOTBALL_FIELD.map((row) => {
        const leftPct = (row.low / scaleMax) * 100;
        const widthPct = ((row.high - row.low) / scaleMax) * 100;
        const midPct = (row.mid / scaleMax) * 100;
        return (
          <div key={row.method} className="ma-project__football-row">
            <span className="ma-project__football-label">{row.method}</span>
            <div className="ma-project__football-track">
              <div
                className="ma-project__football-range"
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              />
              <span
                className="ma-project__football-mid"
                style={{ left: `${midPct}%` }}
                title={`Midpoint ${formatBillions(row.mid)}`}
              />
            </div>
            <span className="ma-project__football-values">
              {formatBillions(row.low)} – {formatBillions(row.high)}
            </span>
          </div>
        );
      })}
      <div className="ma-project__football-row ma-project__football-row--bid">
        <span className="ma-project__football-label">Proposed bid</span>
        <div className="ma-project__football-track">
          <span
            className="ma-project__football-bid-marker"
            style={{ left: `${(PROPOSED_BID_B / scaleMax) * 100}%` }}
          />
        </div>
        <span className="ma-project__football-values ma-project__football-values--bid">
          {formatBillions(PROPOSED_BID_B)}
        </span>
      </div>
      <div className="ma-project__football-axis" aria-hidden="true">
        <span>$0</span>
        <span>$10B</span>
        <span>$20B</span>
        <span>$30B</span>
      </div>
    </div>
  );
}

function HubSpotDcfExplorer() {
  const [wacc, setWacc] = useState(HUBS_DCF_BASE.wacc);
  const [growth, setGrowth] = useState(HUBS_DCF_BASE.growth);

  const impliedEv = useMemo(() => bilinearInterpEv(wacc, growth), [wacc, growth]);
  const vsBase = impliedEv - HUBS_DCF_BASE.ev;

  return (
    <section className="ma-project__section ma-project__panel" aria-labelledby="ma-dcf-heading">
      <h2 id="ma-dcf-heading" className="ma-project__section-title">
        HubSpot standalone DCF sensitivity
      </h2>
      <p className="ma-project__section-lead">
        Adjust WACC and terminal growth to see how HubSpot&apos;s implied enterprise value changes.
        Values interpolate from the model&apos;s sensitivity grid.
      </p>

      <div className="ma-project__dcf-panel">
        <div className="ma-project__dcf-inputs">
          <label className="ma-project__dcf-label">
            <span>WACC (%)</span>
            <input
              type="range"
              min={HUBS_WACC_LEVELS[0]}
              max={HUBS_WACC_LEVELS[HUBS_WACC_LEVELS.length - 1]}
              step={0.1}
              value={wacc}
              onChange={(e) => setWacc(Number(e.target.value))}
            />
            <input
              type="number"
              min={HUBS_WACC_LEVELS[0]}
              max={HUBS_WACC_LEVELS[HUBS_WACC_LEVELS.length - 1]}
              step={0.1}
              value={wacc}
              onChange={(e) => setWacc(Number(e.target.value))}
              className="ma-project__dcf-number"
            />
          </label>
          <label className="ma-project__dcf-label">
            <span>Terminal growth (%)</span>
            <input
              type="range"
              min={HUBS_GROWTH_LEVELS[0]}
              max={HUBS_GROWTH_LEVELS[HUBS_GROWTH_LEVELS.length - 1]}
              step={0.1}
              value={growth}
              onChange={(e) => setGrowth(Number(e.target.value))}
            />
            <input
              type="number"
              min={HUBS_GROWTH_LEVELS[0]}
              max={HUBS_GROWTH_LEVELS[HUBS_GROWTH_LEVELS.length - 1]}
              step={0.1}
              value={growth}
              onChange={(e) => setGrowth(Number(e.target.value))}
              className="ma-project__dcf-number"
            />
          </label>
        </div>

        <div className="ma-project__dcf-output">
          <span className="ma-project__dcf-output-label">Implied enterprise value</span>
          <span className="ma-project__dcf-output-value">{formatBillions(impliedEv, 2)}</span>
          <span className="ma-project__dcf-output-sub">
            {vsBase >= 0 ? '+' : '−'}
            {formatBillions(Math.abs(vsBase), 2)} vs base case ({formatBillions(HUBS_DCF_BASE.ev)})
          </span>
        </div>

        <div className="ma-project__heatmap" aria-label="DCF sensitivity heatmap">
          <div className="ma-project__heatmap-corner" />
          {HUBS_GROWTH_LEVELS.map((g) => (
            <div key={g} className="ma-project__heatmap-col-head">
              {g.toFixed(1)}%
            </div>
          ))}
          {HUBS_WACC_LEVELS.map((w, wi) => (
            <Fragment key={w}>
              <div className="ma-project__heatmap-row-head">{w.toFixed(2)}%</div>
              {HUBS_GROWTH_LEVELS.map((g, gi) => {
                const val = HUBS_DCF_SENSITIVITY[wi][gi];
                const isActive = Math.abs(wacc - w) < 0.55 && Math.abs(growth - g) < 0.55;
                const isBase = w === HUBS_DCF_BASE.wacc && g === HUBS_DCF_BASE.growth;
                return (
                  <button
                    key={`${w}-${g}`}
                    type="button"
                    className={[
                      'ma-project__heatmap-cell',
                      isActive ? 'ma-project__heatmap-cell--active' : '',
                      isBase ? 'ma-project__heatmap-cell--base' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => {
                      setWacc(w);
                      setGrowth(g);
                    }}
                    title={`WACC ${w}%, growth ${g}% → ${formatBillions(val)}`}
                  >
                    {(val / 1000).toFixed(1)}B
                  </button>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function AccretionAnalysis() {
  const [structure, setStructure] = useState<DealStructure>('A');
  const deal = DEAL_STRUCTURES[structure];

  const chartData = PROJECTION_YEARS.map((year, i) => ({
    year: String(year),
    combined: deal.combinedEps[i],
    standalone: CRM_STANDALONE_EPS[i],
    accretion: deal.accretionPct[i],
  }));

  return (
    <section className="ma-project__section ma-project__panel" aria-labelledby="ma-accretion-heading">
      <div className="ma-project__section-header">
        <h2 id="ma-accretion-heading" className="ma-project__section-title">
          Accretion / dilution by financing structure
        </h2>
        <div className="project-page__scenario-toggles" role="group" aria-label="Deal structure">
          {(['A', 'B', 'C'] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={`project-page__scenario-btn ${structure === key ? 'project-page__scenario-btn--active' : ''}`}
              onClick={() => setStructure(key)}
            >
              {DEAL_STRUCTURES[key].label}
            </button>
          ))}
        </div>
      </div>
      <p className="ma-project__section-lead">
        {deal.label} ({deal.sub}): combined pro-forma EPS vs CRM standalone. Option A is the only
        structure that turns accretive within the five-year projection.
      </p>

      <div className="ma-project__accretion-metrics">
        <div className="project-page__key-metrics-card">
          <span className="project-page__key-metrics-label">Year 1 dilution</span>
          <span className="project-page__key-metrics-value">{deal.accretionPct[0].toFixed(1)}%</span>
          <span className="project-page__key-metrics-sub">GAAP EPS impact (2026)</span>
        </div>
        <div className="project-page__key-metrics-card">
          <span className="project-page__key-metrics-label">Break-even</span>
          <span className="project-page__key-metrics-value">
            {structure === 'A' ? '2028' : 'Not in window'}
          </span>
          <span className="project-page__key-metrics-sub">first accretive projection year</span>
        </div>
        <div className="project-page__key-metrics-card project-page__key-metrics-card--accent">
          <span className="project-page__key-metrics-label">Year 5 accretion</span>
          <span className="project-page__key-metrics-value">{deal.accretionPct[4].toFixed(1)}%</span>
          <span className="project-page__key-metrics-sub">2030 combined vs standalone</span>
        </div>
      </div>

      <div className="ma-project__chart-shell">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="rgba(248,250,252,0.08)" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 12 }} />
            <YAxis
              yAxisId="eps"
              tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 12 }}
              tickFormatter={(v) => `$${v}`}
              domain={['auto', 'auto']}
            />
            <YAxis
              yAxisId="pct"
              orientation="right"
              tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                background: '#000000',
                border: '1px solid rgba(248,250,252,0.12)',
                borderRadius: 8,
              }}
              formatter={(value: number, name: string) => {
                if (name === 'Accretion / (dilution)') return [`${value.toFixed(1)}%`, name];
                return [`$${value.toFixed(2)}`, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(248,250,252,0.75)' }} />
            <ReferenceLine yAxisId="pct" y={0} stroke="rgba(248,250,252,0.25)" />
            <Bar
              yAxisId="pct"
              dataKey="accretion"
              name="Accretion / (dilution)"
              fill="rgba(255, 143, 46, 0.55)"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="eps"
              type="monotone"
              dataKey="standalone"
              name="CRM standalone EPS"
              stroke="#8a8a8a"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="eps"
              type="monotone"
              dataKey="combined"
              name="Combined EPS"
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#38bdf8' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function MaProjectDownloads({ project }: { project: Project }) {
  if (project.pdfFile == null && project.excelFile == null) return null;

  return (
    <div className="project-page__downloads project-page__downloads--report-first ma-project__downloads">
      {project.pdfFile && (
        <a
          href={`/pdfs/${encodeURIComponent(project.pdfFile)}`}
          className="project-page__download project-page__download--primary"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open full memorandum (PDF)
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
          Download Excel model
        </a>
      )}
    </div>
  );
}

interface MergersAcquisitionsProjectContentProps {
  project: Project;
}

export function MergersAcquisitionsProjectContent({ project }: MergersAcquisitionsProjectContentProps) {
  const excelUrl = project.excelFile ? `/pdfs/${encodeURIComponent(project.excelFile)}` : null;

  return (
    <div className="ma-project">
      <header id="ma-overview" className="ma-project__overview">
        <div className="ma-project__intro">
          <div className="ma-project__intro-main">
            <div className="ma-project__hero-chips" aria-label="Deal summary">
              <span className="ma-project__chip">CRM → HUBS</span>
              <span className="ma-project__chip">$17.0B proposed</span>
              <span className="ma-project__chip ma-project__chip--muted">FIN 232a · Apr 2026</span>
            </div>

            {project.description != null && project.description.length > 0 && (
              <div className="project-page__body project-page__body--report-first ma-project__intro-prose">
                {project.description.split(/\n\n+/).map((para, i) => (
                  <p
                    key={i}
                    className="project-page__body-p"
                    dangerouslySetInnerHTML={renderDescriptionHtml(para)}
                  />
                ))}
              </div>
            )}

            <MaProjectDownloads project={project} />
          </div>

          <section
            className="project-page__key-metrics ma-project__intro-metrics"
            aria-labelledby="ma-metrics-heading"
          >
          <h2 id="ma-metrics-heading" className="project-page__key-metrics-heading">
            Transaction snapshot
          </h2>
          <div className="project-page__key-metrics-grid">
            <div className="project-page__key-metrics-card project-page__key-metrics-card--accent">
              <span className="project-page__key-metrics-label">Proposed consideration</span>
              <span className="project-page__key-metrics-value">$17.0B</span>
              <span className="project-page__key-metrics-sub">100% cash (Option A recommended)</span>
            </div>
            <div className="project-page__key-metrics-card">
              <span className="project-page__key-metrics-label">EV / NTM revenue</span>
              <span className="project-page__key-metrics-value">{HUBS_BID_EV_REV.toFixed(1)}×</span>
              <span className="project-page__key-metrics-sub">
                vs {TRADING_COMPS_MEDIAN.evRev.toFixed(2)}× peer median trading multiple
              </span>
            </div>
            <div className="project-page__key-metrics-card">
              <span className="project-page__key-metrics-label">HubSpot DCF (base)</span>
              <span className="project-page__key-metrics-value">
                {formatBillions(HUBS_DCF_BASE.ev, 1)}
              </span>
              <span className="project-page__key-metrics-sub">standalone enterprise value midpoint</span>
            </div>
            <div className="project-page__key-metrics-card">
              <span className="project-page__key-metrics-label">Run-rate synergies</span>
              <span className="project-page__key-metrics-value">$450M</span>
              <span className="project-page__key-metrics-sub">$200M revenue + $250M cost by 2028</span>
            </div>
            <div className="project-page__key-metrics-card project-page__key-metrics-card--double">
              <span className="project-page__key-metrics-label">Premium · Per-share offer</span>
              <div className="project-page__key-metrics-value-row">
                <span className="project-page__key-metrics-value">
                  <span className="project-page__key-metrics-value-inline">Prem.</span> ~23%
                </span>
                <span className="project-page__key-metrics-value">
                  <span className="project-page__key-metrics-value-inline">Offer</span> ~$302
                </span>
              </div>
              <span className="project-page__key-metrics-sub">vs HUBS trading ~$262 (Mar 2026)</span>
            </div>
            <div className="project-page__key-metrics-card">
              <span className="project-page__key-metrics-label">Acquisition debt paydown</span>
              <span className="project-page__key-metrics-value">~2 yrs</span>
              <span className="project-page__key-metrics-sub">$10.4B new debt from combined FCF</span>
            </div>
          </div>
        </section>
        </div>

        <MaProjectSubnav />
      </header>

      <section id="ma-valuation" className="ma-project__chapter" aria-label="Valuation analysis">
        <header className="ma-project__chapter-head">
          <h2 className="ma-project__chapter-title">Valuation</h2>
          <p className="ma-project__chapter-lead">
            DCF, trading comps, and precedent transactions framing the proposed bid.
          </p>
        </header>
        <div className="ma-project__chapter-body">
          <section className="ma-project__section ma-project__panel" aria-labelledby="ma-football-heading">
          <h3 id="ma-football-heading" className="ma-project__section-title">
            Valuation football field
          </h3>
          <p className="ma-project__section-lead">
            Ranges from DCF, trading comps, and precedent SaaS transactions, with the proposed $17.0B
            bid plotted against the blended bid range.
          </p>
          <FootballFieldChart />
        </section>
        <HubSpotDcfExplorer />
        <CrmDcfSummarySection />
        <TradingCompsSection />
        <PrecedentTransactionsSection />
        </div>
      </section>

      <section id="ma-economics" className="ma-project__chapter" aria-label="Deal economics">
        <header className="ma-project__chapter-head">
          <h2 className="ma-project__chapter-title">Deal economics</h2>
          <p className="ma-project__chapter-lead">
            Synergies, pro-forma financials, and post-close leverage metrics.
          </p>
        </header>
        <div className="ma-project__chapter-body">
          <SynergyBuildUpSection />
          <ProFormaFinancialsSection />
          <DebtPaydownSection />
          <CreditMetricsSection />
        </div>
      </section>

      <section id="ma-financing" className="ma-project__chapter" aria-label="Financing and accretion">
        <header className="ma-project__chapter-head">
          <h2 className="ma-project__chapter-title">Financing</h2>
          <p className="ma-project__chapter-lead">
            Cash vs. stock structures and the path to EPS accretion.
          </p>
        </header>
        <div className="ma-project__chapter-body">
          <DealStructureComparisonSection />
          <AccretionAnalysis />
        </div>
      </section>

      {excelUrl && (
        <section id="ma-model" className="ma-project__chapter" aria-label="Excel model">
          <header className="ma-project__chapter-head">
            <h2 className="ma-project__chapter-title">Model</h2>
            <p className="ma-project__chapter-lead">
              Full 16-sheet workbook with formulas, pro-forma statements, and sensitivities.
            </p>
          </header>
          <section className="ma-project__section ma-project__panel" aria-labelledby="ma-excel-heading">
            <h3 id="ma-excel-heading" className="ma-project__section-title">
              Spreadsheet preview
            </h3>
            <p className="ma-project__section-lead">
              Read-only browser preview. Download the Excel file for editable formulas and full model
              detail.
            </p>
            <ExcelViewer url={excelUrl} />
          </section>
        </section>
      )}
    </div>
  );
}
