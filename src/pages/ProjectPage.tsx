import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectBySlug } from '../data/projects';
import { MergersAcquisitionsModel } from '../components/MergersAcquisitionsModel';
import { ExcelViewer } from '../components/ExcelViewer';
import { EfficientFrontierChart } from '../components/EfficientFrontierChart';
import { PriceMovementChart } from '../components/PriceMovementChart';
import { RegressionChart } from '../components/RegressionChart';
import { ReturnsOverTimeChart } from '../components/ReturnsOverTimeChart';
import { CorrelationHeatmapChart } from '../components/CorrelationHeatmapChart';

export function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const project = slug ? getProjectBySlug(slug) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!project) {
    return (
      <div className="project-page">
        <nav className="project-page__nav" aria-label="Project navigation">
          <Link to="/#academic-projects" className="project-page__nav-back">
            <span className="project-page__nav-back-arrow" aria-hidden="true">←</span>
            Academic Projects
          </Link>
        </nav>
        <main className="project-page__main">
          <p>Project not found.</p>
        </main>
      </div>
    );
  }

  const isMergersAcquisitions = project.slug === 'mergers-and-acquisitions' && project.excelFile;
  const isPortfolioProject = project.slug === 'financial-markets-and-investments';
  const isPaper = project.type === 'paper';
  const isReportFirst =
    !isPaper &&
    project.type === 'project' &&
    project.pdfFile != null &&
    !isPortfolioProject &&
    !isMergersAcquisitions;

  const [goodyearLogoSrc, setGoodyearLogoSrc] = useState<string | null>('/logos/GY_Wordmark_Logo_With_Wingfoot_Gold_RGB.png');
  const [goodyearLogoUseText, setGoodyearLogoUseText] = useState(false);
  const MCD_LOGO_PATH = '/logos/mcdonalds-png-logo-simple-m-1.png';
  const NOC_LOGO_PATH = '/logos/northrop_grumman-logo_brandlogos.net_mqy0p.png';
  const [mcdLogoSrc, setMcdLogoSrc] = useState<string | null>(MCD_LOGO_PATH);
  const [mcdLogoUseText, setMcdLogoUseText] = useState(false);
  const [nocLogoSrc, setNocLogoSrc] = useState<string | null>(NOC_LOGO_PATH);
  const [nocLogoUseText, setNocLogoUseText] = useState(false);
  const AB_LOGO_PATH = '/logos/anheuser-busch-4-logo-png-transparent.png';
  const [abLogoSrc, setAbLogoSrc] = useState<string | null>(AB_LOGO_PATH);
  const [abLogoUseText, setAbLogoUseText] = useState(false);
  const [goodyearScenario, setGoodyearScenario] = useState<'base' | 'bull' | 'bear'>('base');
  const [goodyearExpandedAssumption, setGoodyearExpandedAssumption] = useState<string | null>(null);
  const GOODYEAR_LOGO_REMOTE = 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Goodyear_logo.svg';
  const MCD_LOGO_REMOTE = 'https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg';
  const NOC_LOGO_REMOTE = 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Northrop_Grumman_logo.svg';
  const AB_LOGO_REMOTE = 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Anheuser-Busch_InBev_logo.svg';

  const goodyearScenarios = {
    base: { priceTarget: '$11.48', upside: '~4.3%', wacc: '6.66%', terminalGrowth: '2%', recommendation: 'Buy', recommendationSub: 'stock trading below intrinsic value' },
    bull: { priceTarget: '$30.96', upside: '~181%', wacc: '6%', terminalGrowth: '3%', recommendation: 'Buy', recommendationSub: 'terminal growth 3%, WACC 6%' },
    bear: { priceTarget: '$0.85', upside: '~−92%', wacc: '8%', terminalGrowth: '1.5%', recommendation: 'Sell', recommendationSub: 'terminal growth 1.5%, WACC 8%' },
  } as const;
  const goodyearScenarioData = goodyearScenarios[goodyearScenario];

  return (
    <div className="project-page">
      <nav className="project-page__nav" aria-label="Project navigation">
        <Link to="/#academic-projects" className="project-page__nav-back">
          <span className="project-page__nav-back-arrow" aria-hidden="true">←</span>
          Academic Projects
        </Link>
        <span className="project-page__nav-sep" aria-hidden="true">/</span>
        <span className="project-page__nav-current">{project.name}</span>
      </nav>
      <main className="project-page__main">
        {project.slug === 'goodyear-equity-research-valuation' && (
          <div className="project-page__company-hero">
            {goodyearLogoUseText ? (
              <span className="project-page__company-name-fallback">Goodyear</span>
            ) : goodyearLogoSrc ? (
              <img
                src={goodyearLogoSrc}
                alt="Goodyear Tire & Rubber"
                className="project-page__company-logo"
                onError={() => {
                  if (goodyearLogoSrc === '/logos/GY_Wordmark_Logo_With_Wingfoot_Gold_RGB.png') {
                    setGoodyearLogoSrc(GOODYEAR_LOGO_REMOTE);
                  } else {
                    setGoodyearLogoUseText(true);
                  }
                }}
              />
            ) : null}
          </div>
        )}
        {project.slug === 'financial-markets-and-investments' && (
          <div className="project-page__portfolio-hero">
            <div className="project-page__portfolio-hero-item">
              {mcdLogoUseText ? (
                <span className="project-page__company-name-fallback">McDonald's</span>
              ) : mcdLogoSrc ? (
                <img
                  src={mcdLogoSrc}
                  alt="McDonald's"
                  className="project-page__company-logo"
                  onError={() => {
                    if (mcdLogoSrc === MCD_LOGO_PATH) {
                      setMcdLogoSrc(MCD_LOGO_REMOTE);
                    } else {
                      setMcdLogoUseText(true);
                    }
                  }}
                />
              ) : null}
            </div>
            <div className="project-page__portfolio-hero-item project-page__portfolio-hero-item--noc">
              {nocLogoUseText ? (
                <span className="project-page__company-name-fallback">Northrop Grumman</span>
              ) : nocLogoSrc ? (
                <img
                  src={nocLogoSrc}
                  alt="Northrop Grumman"
                  className="project-page__company-logo"
                  onError={() => {
                    if (nocLogoSrc === NOC_LOGO_PATH) {
                      setNocLogoSrc(NOC_LOGO_REMOTE);
                    } else {
                      setNocLogoUseText(true);
                    }
                  }}
                />
              ) : null}
            </div>
          </div>
        )}
        {project.slug === 'mergers-and-acquisitions' && (
          <div className="project-page__company-hero project-page__company-hero--ab">
            {abLogoUseText ? (
              <span className="project-page__company-name-fallback">Anheuser-Busch</span>
            ) : abLogoSrc ? (
              <img
                src={abLogoSrc}
                alt="Anheuser-Busch"
                className="project-page__company-logo"
                onError={() => {
                  if (abLogoSrc === AB_LOGO_PATH) {
                    setAbLogoSrc(AB_LOGO_REMOTE);
                  } else {
                    setAbLogoUseText(true);
                  }
                }}
              />
            ) : null}
          </div>
        )}
        <h1 className="project-page__title">{project.name}</h1>
        <p className="project-page__desc">{project.shortDescription}</p>
        {(project.projectDate != null || project.dataAsOf != null || project.paperDate != null) && (
          <p className="project-page__meta">
            {[project.projectDate ?? project.paperDate, project.dataAsOf].filter(Boolean).join(' · ')}
          </p>
        )}

        {isPaper && (
          <>
            {project.abstract && (
              <div className="project-page__abstract">
                <h2 className="project-page__abstract-title">Abstract</h2>
                <p className="project-page__abstract-text">{project.abstract}</p>
              </div>
            )}
            {project.paperImages && project.paperImages.length > 0 && (
              <div className="project-page__paper-images" aria-label="Context images">
                {project.paperImages.map((item, i) => (
                  <figure key={i} className="project-page__paper-fig">
                    <img
                      src={`/images/${encodeURIComponent(item.file)}`}
                      alt=""
                      className="project-page__paper-img"
                    />
                    <figcaption className="project-page__paper-figcaption">{item.label}</figcaption>
                  </figure>
                ))}
              </div>
            )}
            {project.paperTopics && project.paperTopics.length > 0 && (
              <div className="project-page__paper-topics">
                <h2 className="project-page__paper-topics-title">Key topics</h2>
                <ul className="project-page__paper-topics-list">
                  {project.paperTopics.map((topic, i) => (
                    <li key={i} className="project-page__paper-topics-item">{topic}</li>
                  ))}
                </ul>
              </div>
            )}
            {project.body && (
              <div className="project-page__body project-page__body--paper">
                {project.body.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="project-page__body-p">{para}</p>
                ))}
              </div>
            )}
            {project.pdfFile && (
              <a
                href={`/pdfs/${encodeURIComponent(project.pdfFile)}`}
                download={project.pdfFile}
                className="project-page__download project-page__download--after-abstract"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download PDF
              </a>
            )}
          </>
        )}

        {isMergersAcquisitions && project.description != null && project.description.length > 0 && (
          <div className="project-page__body">
            {project.description.split(/\n\n+/).map((para, i) => (
              <p key={i} className="project-page__body-p">{para}</p>
            ))}
          </div>
        )}
        {isMergersAcquisitions && project.excelFile && !isPaper && (
          <MergersAcquisitionsModel
            downloadUrl={`/pdfs/${project.excelFile}`}
            downloadFilename={project.excelFile}
          />
        )}
        {!isMergersAcquisitions && !isPaper && (
          <>
            {isPortfolioProject && project.description != null && project.description.length > 0 && (
              <div className="project-page__body project-page__body--report-first">
                {project.description.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="project-page__body-p">{para}</p>
                ))}
              </div>
            )}
            {isPortfolioProject && (
              <section className="project-page__section project-page__section--charts" aria-labelledby="portfolio-charts-heading">
                <h2 id="portfolio-charts-heading" className="project-page__charts-title">Portfolio analysis</h2>

                <div className="portfolio-charts__block" aria-labelledby="portfolio-risk-return-heading">
                  <h3 id="portfolio-risk-return-heading" className="portfolio-charts__block-title">Risk & return</h3>
                  <div className="portfolio-charts__grid">
                    <EfficientFrontierChart riskFreeRateOverride={4.23} />
                  </div>
                </div>

                <div className="portfolio-charts__block" aria-labelledby="portfolio-data-context-heading">
                  <h3 id="portfolio-data-context-heading" className="portfolio-charts__block-title">Data & context</h3>
                  <div className="portfolio-chart">
                    <PriceMovementChart embedded />
                    <ReturnsOverTimeChart embedded />
                  </div>
                </div>

                <div className="portfolio-charts__block" aria-labelledby="portfolio-relationship-heading">
                  <h3 id="portfolio-relationship-heading" className="portfolio-charts__block-title">Relationship to market</h3>
                  <div className="portfolio-charts__grid">
                    <RegressionChart />
                  </div>
                </div>

                <div className="portfolio-charts__block" aria-labelledby="portfolio-diversification-heading">
                  <h3 id="portfolio-diversification-heading" className="portfolio-charts__block-title">Diversification</h3>
                  <div className="portfolio-charts__grid">
                    <CorrelationHeatmapChart />
                  </div>
                </div>
              </section>
            )}
            {isReportFirst && (
              <>
                {project.description != null && project.description.length > 0 && (
                  <div className="project-page__body project-page__body--report-first">
                    {project.description.split(/\n\n+/).map((para, i) => {
                      const html = para
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*([^*]+?)\*/g, '<em>$1</em>');
                      return (
                        <p
                          key={i}
                          className="project-page__body-p"
                          dangerouslySetInnerHTML={{ __html: html }}
                        />
                      );
                    })}
                  </div>
                )}
                {project.slug === 'goodyear-equity-research-valuation' && (
                  <div className="project-page__key-metrics" aria-label="Key valuation metrics">
                    <div className="project-page__key-metrics-header">
                      <h2 className="project-page__key-metrics-heading">Key metrics</h2>
                      <div className="project-page__scenario-toggles" role="group" aria-label="Valuation scenario">
                        {(['base', 'bull', 'bear'] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`project-page__scenario-btn ${goodyearScenario === s ? 'project-page__scenario-btn--active' : ''}`}
                            onClick={() => setGoodyearScenario(s)}
                          >
                            {s === 'base' ? 'Base' : s === 'bull' ? 'Bull' : 'Bear'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="project-page__key-metrics-grid">
                      <div
                        className="project-page__key-metrics-card project-page__key-metrics-card--accent"
                        title="Recommendation from DCF valuation and qualitative factors; varies by scenario."
                      >
                        <span className="project-page__key-metrics-label">Recommendation</span>
                        <span className="project-page__key-metrics-value">{goodyearScenarioData.recommendation}</span>
                        <span className="project-page__key-metrics-sub">{goodyearScenarioData.recommendationSub}</span>
                      </div>
                      <div
                        className="project-page__key-metrics-card"
                        title="Fair value per share from DCF model; scenario determines key driver assumptions."
                      >
                        <span className="project-page__key-metrics-label">Price target</span>
                        <span className="project-page__key-metrics-value">{goodyearScenarioData.priceTarget}</span>
                        <span className="project-page__key-metrics-sub">per share ({goodyearScenario} case DCF)</span>
                      </div>
                      <div
                        className="project-page__key-metrics-card"
                        title="Implied return vs May 2, 2025 closing price ($11.01)."
                      >
                        <span className="project-page__key-metrics-label">Upside</span>
                        <span className="project-page__key-metrics-value">{goodyearScenarioData.upside}</span>
                        <span className="project-page__key-metrics-sub">vs May 2, 2025 close ($11.01)</span>
                      </div>
                      <div
                        className="project-page__key-metrics-card project-page__key-metrics-card--double"
                        title="WACC and terminal growth rate used in the DCF; both vary by scenario."
                      >
                        <span className="project-page__key-metrics-label">WACC · Terminal growth</span>
                        <div className="project-page__key-metrics-value-row">
                          <span className="project-page__key-metrics-value"><span className="project-page__key-metrics-value-inline">WACC</span> {goodyearScenarioData.wacc}</span>
                          <span className="project-page__key-metrics-value"><span className="project-page__key-metrics-value-inline">Term.</span> {goodyearScenarioData.terminalGrowth}</span>
                        </div>
                        <span className="project-page__key-metrics-sub">discount rate & perpetuity growth ({goodyearScenario} case)</span>
                      </div>
                      <div
                        className="project-page__key-metrics-card"
                        title="Total debt minus cash and equivalents; from Dec 2024 balance sheet."
                      >
                        <span className="project-page__key-metrics-label">Net debt</span>
                        <span className="project-page__key-metrics-value">$7.92B</span>
                        <span className="project-page__key-metrics-sub">as of Dec 2024</span>
                      </div>
                    </div>
                  </div>
                )}
                {project.slug === 'goodyear-equity-research-valuation' && (
                  <div className="project-page__assumptions">
                    <h2 className="project-page__assumptions-heading">Valuation assumptions & key ratios</h2>
                    <div className="project-page__tables-wrap">
                      <div className="project-page__table-block">
                        <h3 className="project-page__table-title">DCF assumptions</h3>
                        <div className="project-page__assumption-cards">
                          {[
                            { id: 'wacc', label: 'WACC', value: '6.66%', rationaleJsx: true, rationale: (
                              <>
                                <span className="project-page__formula">w<sub>E</sub>R<sub>E</sub> + w<sub>D</sub>R<sub>D</sub>(1 − T)</span>. R<sub>E</sub> from CAPM: 4.58% r<sub>f</sub>, 4.33% ERP, β = 1.51 (Goodyear vs S&P 500 monthly returns, May 2020–Dec 2024). R<sub>D</sub> = interest expense ÷ avg 2023–24 interest-bearing debt. Weights: valuation-date equity and 2024 debt; T = 25%.
                              </>
                            ) },
                            { id: 'terminal', label: 'Terminal growth rate', value: '2.0%', rationale: 'I use a 2.0% terminal growth rate to reflect long-run inflation-like growth for a mature industrial business, keeping the terminal value conservative. It is also set below WACC as a basic DCF consistency check.' },
                            { id: 'tax', label: 'Effective tax rate', value: '25%', rationale: 'I assume a 25% tax rate as a normalized long-run effective rate to convert EBIT into after-tax operating profit and to apply the debt tax shield in WACC. This avoids letting any single-year tax noise distort the valuation.' },
                            { id: 'ebit', label: 'EBIT (2023 → 2029)', value: '~$653M → ~$963M', rationale: 'Revenue growth and margin improvement from volume recovery, mix, and cost initiatives. Ranges reflect base-case operating leverage; bull/bear scenarios adjust growth and margins.' },
                          ].map(({ id, label, value, rationale, rationaleJsx }) => (
                            <div
                              key={id}
                              className={`project-page__assumption-card ${goodyearExpandedAssumption === id ? 'project-page__assumption-card--open' : ''}`}
                            >
                              <button
                                type="button"
                                className="project-page__assumption-card-head"
                                onClick={() => setGoodyearExpandedAssumption((prev) => (prev === id ? null : id))}
                                aria-expanded={goodyearExpandedAssumption === id}
                              >
                                <span className="project-page__assumption-card-label">{label}</span>
                                <span className="project-page__assumption-card-value">{value}</span>
                                <span className="project-page__assumption-card-chevron" aria-hidden="true">{goodyearExpandedAssumption === id ? '▼' : '▶'}</span>
                              </button>
                              {goodyearExpandedAssumption === id && (
                                <div className="project-page__assumption-card-body">
                                  {rationaleJsx ? (
                                    <div className="project-page__assumption-card-rationale">{rationale}</div>
                                  ) : (
                                    <p className="project-page__assumption-card-rationale">{rationale}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="project-page__table-block">
                        <h3 className="project-page__table-title">Key ratios (Dec 2024)</h3>
                        <table className="project-page__table">
                          <tbody>
                            <tr><td>Current ratio</td><td>1.04</td></tr>
                            <tr><td>Quick ratio</td><td>0.55</td></tr>
                            <tr><td>Debt ratio</td><td>0.77</td></tr>
                            <tr><td>Earnings per share</td><td>$0.24</td></tr>
                            <tr><td>Return on assets</td><td>0.33%</td></tr>
                            <tr><td>Return on equity</td><td>1.49%</td></tr>
                            <tr><td>Revenue growth (YoY)</td><td>−5.92%</td></tr>
                            <tr><td>Profit margin</td><td>0.37%</td></tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                <div className="project-page__downloads project-page__downloads--report-first">
                  {project.pdfFile && (
                    <a
                      href={`/pdfs/${encodeURIComponent(project.pdfFile)}`}
                      className="project-page__download project-page__download--primary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open full report in new tab (PDF)
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
                </>
            )}
            {!isReportFirst && project.excelFile && (
              <a
                href={`/pdfs/${encodeURIComponent(project.excelFile)}`}
                download={project.excelFile}
                className="project-page__download"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Excel model
              </a>
            )}
            {!isReportFirst && !isPortfolioProject && project.description ? (
              <div className="project-page__body">
                {project.description.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="project-page__body-p">{para}</p>
                ))}
              </div>
            ) : (
              !isReportFirst && !project.excelFile ? (
                <p className="project-page__placeholder">
                  Interactive content and full project details will be added in Phase 5.
                </p>
              ) : null
            )}
            {project.chartImages && project.chartImages.length > 0 && (
              <div className="project-page__charts">
                <h2 className="project-page__charts-heading">Charts & results</h2>
                <p className="project-page__charts-note">
                  Key charts from the model. Export from Excel as image to add more.
                </p>
                <div className="project-page__charts-grid">
                  {project.chartImages.map((item, i) => (
                    <figure key={i} className="project-page__chart-fig">
                      <img
                        src={`/images/${encodeURIComponent(item.file)}`}
                        alt={item.caption ?? `Chart ${i + 1}`}
                        className="project-page__chart-img"
                      />
                      {item.caption && (
                        <figcaption className="project-page__chart-caption">{item.caption}</figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </div>
            )}
            {project.excelFile && (
              <div className="project-page__viewer">
                <h2 className="project-page__viewer-heading">
                  {isReportFirst ? 'Explore the Excel model' : 'View spreadsheet in browser'}
                </h2>
                <p className="project-page__viewer-note">
                  Read-only preview. Switch sheets and toggle formulas below. Use <strong>Download Excel model</strong> above to open in Excel.
                </p>
                <ExcelViewer url={`/pdfs/${encodeURIComponent(project.excelFile)}`} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
