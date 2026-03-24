import { useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { WorkSection } from './WorkSection';

const LETTER_PDF_PATHS = {
  rsm: '/pdfs/RSM%20Georgia.pdf',
  bankOfGeorgia: '/pdfs/BOG%20Letter.pdf',
} as const;

const COMPANY_LOGOS = {
  rsm: '/logos/rsm.jpg',
  bankOfGeorgia: '/logos/bog.png',
} as const;

const FOCUS_AREAS = [
  {
    title: 'Banking and advisory',
    description:
      'Financial statement and cash flow analysis, credit style thinking, operating and liquidity risk review, business process evaluation',
  },
  {
    title: 'Valuation and deals',
    description:
      'Valuation support, driver-based analysis, scenario and sensitivity thinking, translating assumptions into a clear investment narrative',
  },
  {
    title: 'Quant and markets',
    description:
      'Portfolio analytics, risk measurement mindset, factor and performance attribution concepts, data-driven decision support',
  },
  {
    title: 'Accounting foundation',
    description:
      'Reporting support, reconciliations, internal control evaluation, documentation and tie-outs that hold up under review',
  },
  {
    title: 'Execution',
    description: 'Excel-based modeling and schedules built for clarity, reuse, and auditability',
  },
] as const;

const SKILLS_ITEMS = [
  {
    key: 'technical',
    title: 'Technical Skills',
    text: 'Excel (VLOOKUP, SUMIFS, PivotTables, Macros), FactSet, QuickBooks, CaseWare, Python',
  },
  {
    key: 'activities',
    title: 'Activities',
    text: 'Economics, Accounting, and Finance Tutor at Bentley (September 2023 – May 2025)',
  },
  {
    key: 'certifications',
    title: 'Certifications',
    text: 'Bloomberg Market Concepts (BMC), Essential Financial Modeling (Gridlines)',
  },
  { key: 'volunteer', title: 'Volunteer', text: 'Service-Learning Program (2+2=5)' },
  {
    key: 'languages',
    title: 'Languages',
    text: 'English (Fluent), Georgian (Native), Russian (Conversational)',
  },
] as const;

const SKILLS_ICONS = {
  technical: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  activities: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  certifications: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  volunteer: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  languages: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
};

const sectionCls = (visible: boolean, autoHeight = false) =>
  `page-section page-section--fullscreen experience-section scroll-reveal ${autoHeight ? 'page-section--auto-height' : ''} ${visible ? 'scroll-reveal--visible' : ''}`;

export function ExperienceSection() {
  const { revealRef: revealSummary, isVisible: summaryVisible } = useScrollReveal();
  const { revealRef: revealWork, isVisible: workVisible } = useScrollReveal();
  const { revealRef: revealSkills, isVisible: skillsVisible } = useScrollReveal();
  const [expandedFocusIndex, setExpandedFocusIndex] = useState<number | null>(null);

  return (
    <>
      <section id="summary" ref={revealSummary} className={sectionCls(summaryVisible)}>
        <div className="page-section__scroll">
          <div className="page-section__scroll-inner">
            <h2 className="experience-section__title">Summary</h2>
            <div className="experience-section__summary-block">
              <p className="experience-section__summary-intro">
                Finance-focused analyst with a strong accounting foundation and experience across
                audit, financial reporting, and analytical advisory in U.S. and international
                settings (RSM; Bank of Georgia). I translate financial statements and business
                processes into decision-ready insight, spanning performance and cash flow driver
                analysis, controls-informed risk assessment, and valuation support.
              </p>
              <p className="experience-section__summary-intro">
                I build decision-ready models and schedules in Excel, pressure-test assumptions, and
                communicate clear takeaways to senior stakeholders. I am seeking opportunities in
                corporate finance, advisory, valuation, or broader finance roles where I can
                contribute immediately while continuing to develop transaction- and
                investment-relevant judgment.
              </p>
              <h4 className="experience-section__heading">Focus areas</h4>
              <p className="experience-section__focus-hint">Click a card to expand</p>
              <div className="experience-section__focus-grid">
                {FOCUS_AREAS.map((area, index) => (
                  <button
                    key={area.title}
                    type="button"
                    className={`experience-section__focus-card ${expandedFocusIndex === index ? 'experience-section__focus-card--expanded' : ''}`}
                    onClick={() =>
                      setExpandedFocusIndex(expandedFocusIndex === index ? null : index)
                    }
                    aria-expanded={expandedFocusIndex === index}
                  >
                    <span className="experience-section__focus-card-header">
                      <span className="experience-section__focus-card-title">{area.title}</span>
                      <span className="experience-section__focus-card-chevron" aria-hidden="true">
                        {expandedFocusIndex === index ? '▾' : '▸'}
                      </span>
                    </span>
                    <span className="experience-section__focus-card-desc">{area.description}</span>
                  </button>
                ))}
              </div>
              <a href="#work-experience" className="experience-section__cta">
                See my work
                <span className="experience-section__cta-arrow" aria-hidden>
                  →
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="work-experience" ref={revealWork} className={sectionCls(workVisible, true)}>
        <div className="page-section__scroll">
          <div className="page-section__scroll-inner">
            <h2 className="experience-section__title">Work Experience</h2>
            <div className="experience-section__block">
              <div className="experience-section__item">
                <div className="experience-section__company-row">
                  <img
                    src={COMPANY_LOGOS.rsm}
                    alt=""
                    className="experience-section__company-logo"
                    width={48}
                    height={48}
                  />
                  <p className="experience-section__company">
                    <a
                      href={LETTER_PDF_PATHS.rsm}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="experience-section__company-link"
                      title="Letter of recommendation"
                    >
                      RSM
                    </a>
                  </p>
                  <span className="experience-section__location">Tbilisi, Georgia (Country)</span>
                </div>
                <div className="experience-section__item-header">
                  <span className="experience-section__item-title">Financial Audit Associate</span>
                  <span className="experience-section__item-dates">05/2024 – 08/2024</span>
                </div>
                <ul className="experience-section__bullets">
                  <li>
                    Managed AR, inventory (weighted-average costing), write-offs, SG&A, and cash
                    testing in CaseWare during two-month audit of a large agricultural retailer,
                    proposing adjustments and confirming compliance with IFRS
                  </li>
                  <li>
                    Executed end-to-end audit of $250K alcohol-producer subsidiary, analyzing sales,
                    COGS, cash, inventory, and fixed assets
                  </li>
                  <li>
                    Prepared review-ready workpapers in CaseWare, managed multi-area account
                    testing, resolved client and manager queries, and ensured audit quality and
                    timely completion
                  </li>
                  <li>
                    Assisted outsourced accounting engagement for China-based construction company,
                    assisting with transaction recording, account reconciliations, and monthly close
                    support under IFRS-aligned reporting
                  </li>
                </ul>
              </div>
              <div className="experience-section__item">
                <div className="experience-section__company-row">
                  <img
                    src={COMPANY_LOGOS.bankOfGeorgia}
                    alt=""
                    className="experience-section__company-logo"
                    width={48}
                    height={48}
                  />
                  <p className="experience-section__company">
                    <a
                      href={LETTER_PDF_PATHS.bankOfGeorgia}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="experience-section__company-link"
                      title="Letter of recommendation"
                    >
                      Bank of Georgia
                    </a>
                  </p>
                  <span className="experience-section__location">Tbilisi, Georgia (Country)</span>
                </div>
                <div className="experience-section__item-header">
                  <span className="experience-section__item-title">Corporate Banking Intern</span>
                  <span className="experience-section__item-dates">07/2023 – 08/2023</span>
                </div>
                <ul className="experience-section__bullets">
                  <li>
                    Developed credit analysis models from raw financials, performing ratio and
                    sensitivity analyses that enabled approval of $2M+ corporate facilities and
                    surfaced risks driving rejection of $3M loan request
                  </li>
                  <li>
                    Evaluated borrower liquidity, leverage, and cash flow trends across corporate
                    and project finance clients, directly informing credit decisions, including
                    long-term financing approval for a renewable hydroelectric project
                  </li>
                  <li>
                    Examined regulatory and market conditions in Georgia’s microfinance industry and
                    agricultural export sector (blueberries), assessing regulatory impacts, demand
                    trends, and sector risks; summarized insights for corporate banking department
                  </li>
                </ul>
              </div>
            </div>
            <a href="#academic-projects" className="experience-section__cta">
              See my projects
              <span className="experience-section__cta-arrow" aria-hidden>
                →
              </span>
            </a>
          </div>
        </div>
      </section>

      <WorkSection />

      <section id="skills-and-activities" ref={revealSkills} className={sectionCls(skillsVisible)}>
        <div className="page-section__scroll">
          <div className="page-section__scroll-inner">
            <h2 className="experience-section__title">Skills & Activities</h2>
            <div className="experience-section__skills-grid">
              {SKILLS_ITEMS.map((item) => (
                <div key={item.key} className="experience-section__skills-card">
                  <span className="experience-section__skills-card-icon" aria-hidden>
                    {SKILLS_ICONS[item.key]}
                  </span>
                  <h4 className="experience-section__skills-card-title">{item.title}</h4>
                  <p className="experience-section__skills-card-text">{item.text}</p>
                </div>
              ))}
            </div>
            <a
              href="#card"
              className="experience-section__cta experience-section__cta--back-to-top"
              aria-label="Return to top"
            >
              <span
                className="experience-section__cta-arrow experience-section__cta-arrow--up"
                aria-hidden
              >
                ↑
              </span>
              Return to top
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
