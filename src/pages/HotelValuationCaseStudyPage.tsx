import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SITE_DEFAULT_TITLE, SITE_NAME } from '../constants/site';
import {
  DISCOUNT_RATE_BUILD,
  DISCOUNT_RATE_CROSS_CHECKS,
  DOWNSIDE_CASE_PCT,
  HOTEL_VALUATION_KEY_STATS,
  KEY_JUDGEMENTS,
  MODEL_TABS,
  ONE_WAY_SENSITIVITIES,
  PEER_EBITDA_MARGIN,
  PEER_PAYROLL,
  PEER_YEARS,
  PLAN_BRIDGE,
  SENSITIVITY_GRIDS,
  type PeerRow,
} from '../data/hotelValuationCaseStudy';

const PAGE_TITLE = 'Hotel Resort DCF Valuation';

const signedPct = (v: number) =>
  v === 0 ? '0.0%' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}%`;

/** Heat-map tint for a % change vs base; capped so the extremes stay readable. */
const cellTint = (v: number) => {
  const alpha = Math.min(Math.abs(v) / 35, 1) * 0.35;
  const rgb = v >= 0 ? 'var(--color-positive-rgb)' : 'var(--color-negative-rgb)';
  return v === 0 ? undefined : { background: `rgba(${rgb}, ${alpha.toFixed(3)})` };
};

const maxOneWay = Math.max(...ONE_WAY_SENSITIVITIES.flatMap((s) => [-s.down, s.up]));
const maxBridgeShare = Math.max(...PLAN_BRIDGE.map((s) => s.shareOfGap));

function PeerTable({ title, rows, subject }: { title: string; rows: PeerRow[]; subject: string }) {
  return (
    <div className="project-page__table-block">
      <h3 className="project-page__table-title">{title}</h3>
      <div className="valuation-case__scroll">
        <table className="valuation-case__table">
          <thead>
            <tr>
              <th>Peer</th>
              {PEER_YEARS.map((y) => (
                <th key={y}>{y}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td>
                  {r.name}
                  {r.keys && <span className="valuation-case__muted"> · {r.keys}</span>}
                </td>
                {r.values.map((v, i) => (
                  <td key={PEER_YEARS[i]}>{v == null ? '—' : `${v.toFixed(1)}%`}</td>
                ))}
              </tr>
            ))}
            <tr className="valuation-case__row--subject">
              <td>Subject hotel, stabilised forecast</td>
              <td colSpan={PEER_YEARS.length}>{subject}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function HotelValuationCaseStudyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${PAGE_TITLE} | ${SITE_NAME}`;
    return () => {
      document.title = SITE_DEFAULT_TITLE;
    };
  }, []);

  return (
    <div className="project-page valuation-case">
      <nav className="project-page__nav" aria-label="Case study navigation">
        <Link to="/#work-experience" className="project-page__nav-back">
          <span className="project-page__nav-back-arrow" aria-hidden="true">
            ←
          </span>
          Work Experience
        </Link>
        <span className="project-page__nav-sep" aria-hidden="true">
          /
        </span>
        <span className="project-page__nav-current">{PAGE_TITLE}</span>
      </nav>
      <main className="project-page__main" id="main-content" tabIndex={-1}>
        <h1 className="project-page__title">{PAGE_TITLE}: 38-Key Resort, Kakheti, Georgia</h1>
        <p className="project-page__desc">
          Market value of a newly built resort hotel on a live RSM Georgia engagement, from a USALI
          operating forecast through a GEL property discount rate to a reconciliation with
          management’s business plan.
        </p>
        <p className="project-page__meta">September – October 2026 · Valuation date 30 June 2026</p>

        <p className="valuation-case__notice">
          Client engagement: the client’s name, the concluded value and management’s own figures are
          withheld. What follows is the method, the public inputs behind the discount rate, peer
          data from public filings, and results shown as ratios and percentage changes.
        </p>

        <dl className="project-page__key-stats">
          {HOTEL_VALUATION_KEY_STATS.map((stat) => (
            <div key={stat.label} className="project-page__key-stat">
              <dt className="project-page__key-stat-label">{stat.label}</dt>
              <dd className="project-page__key-stat-value">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className="project-page__body">
          <p className="project-page__body-p">
            The asset is a 38-key resort (6 suites, 32 standard rooms) with a restaurant and bars, a
            500-guest banquet hall, a pool, padel and tennis courts and a conference room. At the
            valuation date it was about 90% built and in soft opening, with full opening nine months
            later. The basis of value is market value <em>as is</em>: land, buildings and FF&amp;E,
            with working capital, vehicles, financing and the owner’s other businesses excluded.
          </p>
          <p className="project-page__body-p">
            I contributed to the income-approach model: a 10-year discounted cash flow of
            asset-level, pre-tax cash flows in nominal GEL (Georgia taxes profit only when it is
            distributed), mid-year discounting, a Gordon-growth terminal value on a normalised Year
            11, and the present value of the remaining construction capex deducted to move from
            value <em>as complete</em> to value <em>as is</em>.
          </p>
        </div>

        <section className="project-page__section valuation-case__section">
          <h2 className="project-page__assumptions-heading">How the model is built</h2>
          <p className="project-page__body-p">
            Sixteen working tabs behind a cover sheet, colour-coded by role. Every hard-coded
            assumption lives on Inputs with its source beside it; Revenue builds volumes × prices,
            Operating_Forecast turns them into a USALI P&amp;L down to EBITDA and NOI, and DCF
            discounts the result. Reconciliation and Sensitivity re-run the whole model through
            Excel data tables, and 21 integrity checks (plus 3 warnings on margins, payroll and
            terminal-value weight) feed a single status flag on the cover.
          </p>
          <div className="valuation-case__tabs">
            {MODEL_TABS.map((g) => (
              <div key={g.group} className="valuation-case__tab-group">
                <h3 className="project-page__table-title">{g.group}</h3>
                <ul>
                  {g.tabs.map((t) => (
                    <li key={t}>
                      <code>{t}</code>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="project-page__body">
            <p className="project-page__body-p">
              <strong>Revenue</strong> is four departments, net of 18% VAT. Rooms: occupancy × ADR
              on 38 keys, with OTA commission booked as a rooms expense. F&amp;B: covers driven by
              guests per occupied room, outlet take-up rates and average checks, plus non-resident
              covers. Events: weddings and parties × guests × spend, plus stage hire. Leisure:
              outside pool visitors, court-days and guest tours.
            </p>
            <p className="project-page__body-p">
              <strong>Costs</strong> follow USALI: departmental costs, then undistributed costs to
              gross operating profit, then the operator fee and fixed charges (property tax, land
              tax, insurance) to EBITDA, then an FF&amp;E reserve to NOI. Payroll is built position
              by position from the staffing plan, grossed up for income tax and pension
              contributions and escalated at CPI plus 1.5% real wage growth.
            </p>
          </div>
        </section>

        <section className="project-page__section valuation-case__section">
          <h2 className="project-page__assumptions-heading">Discount rate: 13.25%</h2>
          <p className="project-page__body-p">
            An asset-level, unlevered, pre-tax return in nominal GEL. Capital structure, the debt
            tax shield and small-company premia belong to a company valuation, not a property, so
            they are left out. Country risk is counted once: the sovereign default spread comes out
            of the GEL bond yield and goes back in through Georgia’s equity risk premium.
          </p>
          <div className="project-page__table-block">
            <div className="valuation-case__scroll">
              <table className="valuation-case__table valuation-case__table--build">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Value</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {DISCOUNT_RATE_BUILD.map((r) => (
                    <tr
                      key={r.component}
                      className={r.emphasis ? 'valuation-case__row--subtotal' : undefined}
                    >
                      <td>{r.component}</td>
                      <td>{r.value}</td>
                      <td className="valuation-case__muted">{r.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="project-page__table-block valuation-case__spaced">
            <h3 className="project-page__table-title">Cross-checks against the GEL market</h3>
            <div className="valuation-case__scroll">
              <table className="valuation-case__table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Rate</th>
                    <th>13.25% vs reference</th>
                  </tr>
                </thead>
                <tbody>
                  {DISCOUNT_RATE_CROSS_CHECKS.map((r) => (
                    <tr key={r.reference}>
                      <td>{r.reference}</td>
                      <td>{r.rate}</td>
                      <td>{r.spread}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="valuation-case__note">
              The rate sits above senior GEL lending (an equity-type return on an unlevered asset)
              and just above a trading, branded Kakheti resort, consistent with a new property that
              has no operating history.
            </p>
          </div>
        </section>

        <section className="project-page__section valuation-case__section">
          <h2 className="project-page__assumptions-heading">
            Reconciling management’s plan to the valuation
          </h2>
          <p className="project-page__body-p">
            Management’s operating assumptions were run through the same framework first, so the
            only differences between their case and ours are explicit, quantified adjustments.
            Switching them on one at a time closes the gap. Shares below are each step’s part of the
            total gap in value.
          </p>
          <div className="project-page__table-block">
            <ol className="valuation-case__bridge">
              {PLAN_BRIDGE.map((s) => (
                <li key={s.adjustment} className="valuation-case__bridge-row">
                  <div className="valuation-case__bridge-text">
                    <span className="valuation-case__bridge-label">{s.adjustment}</span>
                    <span className="valuation-case__muted">{s.why}</span>
                  </div>
                  <div className="valuation-case__bar-track" aria-hidden="true">
                    <div
                      className="valuation-case__bar valuation-case__bar--down"
                      style={{ width: `${(s.shareOfGap / maxBridgeShare) * 100}%` }}
                    />
                  </div>
                  <span className="valuation-case__bridge-value">
                    {s.shareOfGap === 0 ? 'nil' : `${s.shareOfGap.toFixed(1)}%`}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <p className="valuation-case__note">
            Over half the gap is costs the plan left out entirely or budgeted below resort norms:
            undistributed costs, the FF&amp;E reserve, the operator fee and property tax. Volumes
            and prices were otherwise taken as provided, and the stabilised EBITDA margin still
            lands near 41%, above every Kakheti peer below, which a reviewer should press on.
          </p>
        </section>

        <section className="project-page__section valuation-case__section">
          <h2 className="project-page__assumptions-heading">Sensitivity</h2>
          <p className="project-page__body-p">
            Events volume, ADR, occupancy and the discount rate each move value by roughly 9–11% for
            the shocks shown. On an independent view of volumes (lower occupancy, fewer weddings and
            a slower ramp-up) value is <strong>{signedPct(DOWNSIDE_CASE_PCT)}</strong> below the
            base case, which is why the report states plainly that the conclusion depends on the
            business plan being achieved.
          </p>
          <div className="project-page__table-block">
            <h3 className="project-page__table-title">One-way sensitivities (change in value)</h3>
            <ul className="valuation-case__tornado">
              {ONE_WAY_SENSITIVITIES.map((s) => (
                <li key={s.driver} className="valuation-case__tornado-row">
                  <span className="valuation-case__tornado-label">{s.driver}</span>
                  <span className="valuation-case__tornado-val valuation-case__tornado-val--down">
                    {signedPct(s.down)}
                  </span>
                  <div className="valuation-case__tornado-bars" aria-hidden="true">
                    <div className="valuation-case__tornado-half valuation-case__tornado-half--left">
                      <div
                        className="valuation-case__bar valuation-case__bar--down"
                        style={{ width: `${(-s.down / maxOneWay) * 100}%` }}
                      />
                    </div>
                    <div className="valuation-case__tornado-half">
                      <div
                        className="valuation-case__bar valuation-case__bar--up"
                        style={{ width: `${(s.up / maxOneWay) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="valuation-case__tornado-val">{signedPct(s.up)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="valuation-case__grids">
            {SENSITIVITY_GRIDS.map((g) => (
              <div key={g.title} className="project-page__table-block">
                <h3 className="project-page__table-title">{g.title} (% vs base)</h3>
                <div className="valuation-case__scroll">
                  <table className="valuation-case__table valuation-case__table--grid">
                    <thead>
                      <tr>
                        <th>
                          {g.rowLabel} \ {g.colLabel}
                        </th>
                        {g.cols.map((c) => (
                          <th key={c}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((r, i) => (
                        <tr key={r}>
                          <td>{r}</td>
                          {g.values[i].map((v, j) => (
                            <td
                              key={g.cols[j]}
                              style={cellTint(v)}
                              className={v === 0 ? 'valuation-case__cell--base' : undefined}
                            >
                              {v === 0 ? 'Base' : signedPct(v)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="project-page__section valuation-case__section">
          <h2 className="project-page__assumptions-heading">Market benchmarks</h2>
          <p className="project-page__body-p">
            Peer operating data comes from audited financial statements filed on reporting.ge. Peers
            are owner-operated (Tsinandali is franchised and third-party managed), while the
            subject’s margin is after a 3% operator fee.
          </p>
          <div className="valuation-case__grids">
            <PeerTable title="EBITDA margin" rows={PEER_EBITDA_MARGIN} subject="c.41%" />
            <PeerTable title="Payroll as % of revenue" rows={PEER_PAYROLL} subject="c.18%" />
          </div>
          <p className="valuation-case__note">
            The two tables tell the same story from both sides: the subject’s forecast margin is
            high mainly because its payroll is light against a 23–34% peer range, and that payroll
            comes straight from management’s staffing plan.
          </p>
        </section>

        <section className="project-page__section valuation-case__section">
          <h2 className="project-page__assumptions-heading">Judgement calls</h2>
          <div className="valuation-case__judgements">
            {KEY_JUDGEMENTS.map((j) => (
              <div key={j.title} className="project-page__table-block">
                <h3 className="project-page__table-title">{j.title}</h3>
                <p className="valuation-case__note">{j.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
