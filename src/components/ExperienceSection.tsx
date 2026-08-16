import { useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { PERSONAL_PORTFOLIO } from '../data/personalPortfolio';
import { WorkSection } from './WorkSection';
import { PersonalPortfolioSection } from './PersonalPortfolioSection';
import { CertificatesSection } from './CertificatesSection';

const LETTER_PDF_PATHS = {
  rsm: '/pdfs/RSM%20Georgia.pdf',
  bankOfGeorgia: '/pdfs/BOG%20Letter.pdf',
} as const;

const COMPANY_LOGOS = {
  rsm: '/logos/rsm.jpg',
  bankOfGeorgia: '/logos/bog.png',
  bentley: '/logos/Bentley.png',
} as const;

interface SchoolCourse {
  code: string;
  title: string;
  description: string;
}

interface School {
  logoUrl: string;
  name: string;
  degree: string;
  dates: string;
  /** Shown as a badge next to the dates when present. */
  gpa?: string;
  achievements?: string[];
  clubs?: string[];
  courses?: SchoolCourse[];
}

const EDUCATION: School[] = [
  {
    logoUrl: '/logos/Brandeis_seal_white.png',
    name: 'Brandeis University',
    degree: 'Candidate for Master of Science in Finance (STEM-Designated)',
    dates: '01/2026 – 12/2026',
    clubs: ['Global Markets Investment Club'],
    courses: [
      {
        code: 'FIN 217F',
        title: 'Corporate Financial Modeling',
        description:
          'Building integrated financial models in Excel, projecting company performance and valuing earnings streams through cases and hands-on spreadsheet work.',
      },
      {
        code: 'FIN 219G',
        title: 'Financial Modeling Bootcamp',
        description:
          'Advanced modeling technique building on the corporate modeling course, including LBO (capital structure) modeling and merger modeling.',
      },
      {
        code: 'FIN 242F',
        title: 'Credit Risk Analysis',
        description:
          'Credit risk from a commercial banker’s perspective: structuring asset-based and cash-flow loans, assessing borrower viability, and how the qualitative "story" behind a business shapes risk/return decisions, through bank-lending case studies.',
      },
      {
        code: 'FIN 285A',
        title: 'Computer Simulations and Risk Assessment',
        description:
          'Computational risk modeling in Python, using bootstrapping, extreme value theory, and copulas to quantify tail risk and confidence in risk measures.',
      },
      {
        code: 'FIN 232A',
        title: 'Mergers and Acquisitions Analysis',
        description:
          'Core M&A concepts (valuation, negotiation, deal structuring, corporate strategy, and financing) through case studies (Anheuser-Busch, Berkshire Partners, and others) and a semester-long project analyzing a real acquirer/target pair end-to-end.',
      },
      {
        code: 'FIN 261A',
        title: 'Fixed Income Securities',
        description:
          'Markets for Treasuries, corporate and municipal bonds, asset-backed securities, and fixed-income derivatives, with the quantitative tools to value them.',
      },
      {
        code: 'FIN 231F',
        title: 'Private Equity',
        description:
          'Private equity, investment banking, and M&A-oriented finance for students pursuing careers in those fields.',
      },
    ],
  },
  {
    logoUrl: '/logos/Bentley.png',
    name: 'Bentley University',
    degree:
      'Bachelor of Science in Corporate Finance and Accounting, Minor in Computer Information Systems',
    dates: '09/2021 – 05/2025',
    achievements: ["Dean's List (multiple semesters)"],
    courses: [
      {
        code: 'FI 306',
        title: 'Financial Markets and Investment',
        description:
          'Bond, equity, and options markets: how they set asset values, with hands-on valuation work in Bentley’s Trading Room.',
      },
      {
        code: 'FI 312',
        title: 'Quantitative Portfolio Management',
        description:
          'Quantitative models for stock selection, portfolio construction, and risk management, building on fundamental equity analysis.',
      },
      {
        code: 'FI 307',
        title: 'Advanced Managerial Finance',
        description:
          'Capital budgeting under uncertainty, capital structure and payout policy, investment banking, and corporate restructuring, taught through case studies.',
      },
      {
        code: 'FI 347',
        title: 'Financial Modeling',
        description:
          'Advanced Excel modeling for time value of money, cost of capital, forecasting, valuation, and portfolio theory.',
      },
      {
        code: 'FI 351',
        title: 'International Finance',
        description:
          'Foreign exchange determination, hedging, international capital markets, and multinational capital budgeting.',
      },
      {
        code: 'AC 311',
        title: 'Financial Accounting and Reporting I',
        description:
          'U.S. GAAP for financial statement preparation, covering asset valuation, income determination, and current liabilities.',
      },
      {
        code: 'AC 312',
        title: 'Financial Accounting and Reporting II',
        description:
          'GAAP for the liabilities and equity side of the balance sheet, covering leases, stockholders’ equity, EPS, and income tax accounting.',
      },
      {
        code: 'AC 310',
        title: 'Cost Management',
        description:
          'Product and service costing, budgeting, standard and activity-based costing, and performance analysis for management decisions.',
      },
      {
        code: 'GB 213',
        title: 'Business Statistics',
        description:
          'Probability, sampling distributions, confidence intervals, hypothesis testing, and linear regression for business decision-making.',
      },
      {
        code: 'CS 230',
        title: 'Introduction to Programming with Python',
        description:
          'Programming fundamentals and algorithmic thinking in Python, building several standalone applications.',
      },
      {
        code: 'GB 320',
        title: 'Integrated Business Project',
        description:
          'Capstone consulting project working directly with a client company to research and propose solutions to a real business problem.',
      },
    ],
  },
];

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
  const [expandedSchools, setExpandedSchools] = useState<Set<number>>(new Set());

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
              <h4 className="experience-section__heading experience-section__heading--education">
                Education
              </h4>
              <div className="experience-section__education">
                {EDUCATION.map((school, index) => {
                  const expanded = expandedSchools.has(index);
                  const hasDetail =
                    (school.courses && school.courses.length > 0) ||
                    (school.achievements && school.achievements.length > 0) ||
                    (school.clubs && school.clubs.length > 0);

                  return (
                    <div key={school.name} className="experience-section__school">
                      <div className="experience-section__school-main">
                        <img
                          src={school.logoUrl}
                          alt=""
                          className="experience-section__school-logo"
                          width={48}
                          height={48}
                        />
                        <div className="experience-section__school-text">
                          <div className="experience-section__school-header">
                            <p className="experience-section__school-name">{school.name}</p>
                            <p className="experience-section__school-dates">
                              {school.dates}
                              {school.gpa && (
                                <span className="experience-section__school-gpa">
                                  {' '}
                                  · {school.gpa}
                                </span>
                              )}
                            </p>
                          </div>
                          <p className="experience-section__school-degree">{school.degree}</p>
                        </div>
                      </div>

                      {hasDetail && (
                        <>
                          <button
                            type="button"
                            className="experience-section__school-toggle"
                            onClick={() =>
                              setExpandedSchools((prev) => {
                                const next = new Set(prev);
                                if (next.has(index)) next.delete(index);
                                else next.add(index);
                                return next;
                              })
                            }
                            aria-expanded={expanded}
                          >
                            {expanded ? 'Hide' : 'Show'} courses & achievements
                            <span
                              className="experience-section__school-toggle-chevron"
                              aria-hidden="true"
                            >
                              {expanded ? '▾' : '▸'}
                            </span>
                          </button>

                          {expanded && (
                            <div className="experience-section__school-detail">
                              {school.achievements && school.achievements.length > 0 && (
                                <div className="experience-section__school-detail-group">
                                  <h5 className="experience-section__school-detail-heading">
                                    Achievements
                                  </h5>
                                  <div className="experience-section__school-tags">
                                    {school.achievements.map((item) => (
                                      <span
                                        key={item}
                                        className="experience-section__school-tag experience-section__school-tag--achievement"
                                      >
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {school.clubs && school.clubs.length > 0 && (
                                <div className="experience-section__school-detail-group">
                                  <h5 className="experience-section__school-detail-heading">
                                    Clubs
                                  </h5>
                                  <div className="experience-section__school-tags">
                                    {school.clubs.map((item) => (
                                      <span key={item} className="experience-section__school-tag">
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {school.courses && school.courses.length > 0 && (
                                <div className="experience-section__school-detail-group">
                                  <h5 className="experience-section__school-detail-heading">
                                    Relevant coursework
                                  </h5>
                                  <ul className="experience-section__school-courses">
                                    {school.courses.map((course) => (
                                      <li
                                        key={course.code}
                                        className="experience-section__school-course"
                                      >
                                        <p className="experience-section__school-course-title">
                                          <span className="experience-section__school-course-code">
                                            {course.code}
                                          </span>{' '}
                                          {course.title}
                                        </p>
                                        <p className="experience-section__school-course-desc">
                                          {course.description}
                                        </p>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
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
              <div className="experience-section__item">
                <div className="experience-section__company-row">
                  <img
                    src={COMPANY_LOGOS.bentley}
                    alt=""
                    className="experience-section__company-logo"
                    width={48}
                    height={48}
                  />
                  <p className="experience-section__company">
                    <span className="experience-section__company-link">LEAF</span>
                  </p>
                  <span className="experience-section__location">
                    Bentley University, Waltham, MA
                  </span>
                </div>
                <div className="experience-section__item-header">
                  <span className="experience-section__item-title">
                    Peer Tutor, Economics, Accounting & Finance
                  </span>
                  <span className="experience-section__item-dates">09/2023 – 05/2025</span>
                </div>
                <ul className="experience-section__bullets">
                  <li>
                    Tutored Bentley undergraduates one-on-one and in small groups across economics,
                    accounting, and finance coursework, from introductory principles through
                    upper-level corporate finance and financial reporting
                  </li>
                  <li>
                    Broke down quantitative and conceptual material, including regression and
                    statistics, GAAP-based financial statements, and corporate valuation, into
                    clear, student-specific explanations
                  </li>
                  <li>
                    Built repeat tutoring relationships across three semesters, adapting approach to
                    each student’s course, instructor, and learning style
                  </li>
                </ul>
              </div>
            </div>
            <a href="#investment-portfolio" className="experience-section__cta">
              {PERSONAL_PORTFOLIO.experienceCta}
              <span className="experience-section__cta-arrow" aria-hidden>
                →
              </span>
            </a>
          </div>
        </div>
      </section>

      <PersonalPortfolioSection />

      <WorkSection />

      <CertificatesSection />

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
