import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
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
import {
  ACQUISITION_DEBT_SCHEDULE,
  CREDIT_METRICS,
  CRM_DCF_BASE,
  CRM_DCF_PROJECTION,
  DEAL_STRUCTURE_TABLE,
  formatBillions,
  formatMillions,
  HUBS_BID_EV_REV,
  PRECEDENT_MEDIAN_EV_REV,
  PRECEDENT_TRANSACTIONS,
  PRO_FORMA_COMBINED,
  PROPOSED_BID_B,
  SYNERGY_SCHEDULE,
  TRADING_COMPS,
  TRADING_COMPS_MEDIAN,
  WACC_BRIDGE,
} from '../../data/maProjectData';

const CHART_TOOLTIP = {
  contentStyle: {
    background: '#000000',
    border: '1px solid rgba(248,250,252,0.12)',
    borderRadius: 8,
  },
};

type CompMetric = 'evRev' | 'evEbitda';

type TableColumn = {
  key: string;
  label: string;
  align?: 'left' | 'right';
  mono?: boolean;
};

type TableRow = {
  id?: string | number;
  _variant?: 'footer' | 'emphasis';
  [key: string]: string | number | undefined;
};

function cellClass(col: TableColumn): string | undefined {
  const parts: string[] = [];
  if (col.align === 'right') parts.push('ma-project__td--num');
  if (col.mono) parts.push('ma-project__td--mono');
  return parts.length ? parts.join(' ') : undefined;
}

function SortableTable({
  columns,
  rows,
  caption,
  footerRows,
  sortable = true,
}: {
  caption: string;
  columns: TableColumn[];
  rows: TableRow[];
  footerRows?: TableRow[];
  sortable?: boolean;
}) {
  const [sortKey, setSortKey] = useState(columns[0]?.key ?? '');
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = useMemo(() => {
    const body = rows.filter((r) => r._variant !== 'footer');
    if (!sortable) return body;
    const copy = [...body];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortAsc ? av - bv : bv - av;
      }
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [rows, sortKey, sortAsc, sortable]);

  const footers = footerRows ?? rows.filter((r) => r._variant === 'footer');

  function onSort(key: string) {
    if (!sortable) return;
    if (key === sortKey) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function renderRow(row: TableRow, key: string) {
    const variant = row._variant;
    return (
      <tr
        key={key}
        className={
          variant === 'footer'
            ? 'ma-project__tr--footer'
            : variant === 'emphasis'
              ? 'ma-project__tr--emphasis'
              : undefined
        }
      >
        {columns.map((col) => (
          <td key={col.key} className={cellClass(col)}>
            {row[col.key]}
          </td>
        ))}
      </tr>
    );
  }

  return (
    <div className="ma-project__table-wrap">
      <table className="ma-project__table">
        <caption className="ma-project__table-caption">{caption}</caption>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={col.align === 'right' ? 'ma-project__th--num' : undefined}
              >
                {sortable ? (
                  <button
                    type="button"
                    className={`ma-project__th-btn${col.align === 'right' ? ' ma-project__th-btn--num' : ''}`}
                    onClick={() => onSort(col.key)}
                    aria-sort={sortKey === col.key ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                  >
                    <span>{col.label}</span>
                    <span
                      className={`ma-project__sort-icon${sortKey === col.key ? ' ma-project__sort-icon--active' : ''}`}
                      aria-hidden
                    >
                      {sortKey === col.key ? (sortAsc ? '▲' : '▼') : '⇅'}
                    </span>
                  </button>
                ) : (
                  <span className={`ma-project__th-label${col.align === 'right' ? ' ma-project__th-label--num' : ''}`}>
                    {col.label}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) =>
            renderRow(row, String(row.id ?? row.ticker ?? row.target ?? row.metric ?? row.year)),
          )}
          {footers.map((row) => renderRow(row, `footer-${String(row.id ?? row.ticker ?? 'summary')}`))}
        </tbody>
      </table>
    </div>
  );
}

export function TradingCompsSection() {
  const [metric, setMetric] = useState<CompMetric>('evRev');

  const chartData = TRADING_COMPS.map((c) => ({
    name: c.ticker,
    value: metric === 'evRev' ? c.evRev : c.evEbitda,
  }));

  const refLine =
    metric === 'evRev'
      ? [{ value: TRADING_COMPS_MEDIAN.evRev, label: 'Peer median' }, { value: HUBS_BID_EV_REV, label: 'Proposed bid' }]
      : [{ value: TRADING_COMPS_MEDIAN.evEbitda, label: 'Peer median' }];

  const tableRows = TRADING_COMPS.map((c) => ({
    id: c.ticker,
    ticker: c.ticker,
    company: c.company,
    ev: formatMillions(c.ev),
    revenue: formatMillions(c.revenue),
    evRev: `${c.evRev.toFixed(2)}×`,
    evEbitda: `${c.evEbitda.toFixed(1)}×`,
    ebitdaMargin: `${c.ebitdaMargin.toFixed(1)}%`,
  }));

  return (
    <section className="ma-project__section ma-project__panel" aria-labelledby="ma-trading-comps-heading">
      <div className="ma-project__section-header">
        <h2 id="ma-trading-comps-heading" className="ma-project__section-title">
          Trading comparables
        </h2>
        <div className="project-page__scenario-toggles" role="group" aria-label="Comparable metric">
          {(['evRev', 'evEbitda'] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`project-page__scenario-btn ${metric === m ? 'project-page__scenario-btn--active' : ''}`}
              onClick={() => setMetric(m)}
            >
              {m === 'evRev' ? 'EV / Revenue' : 'EV / EBITDA'}
            </button>
          ))}
        </div>
      </div>
      <p className="ma-project__section-lead">
        Seven public SaaS peers vs HubSpot implied multiples. The proposed bid at {HUBS_BID_EV_REV}×
        NTM revenue sits near the peer median ({TRADING_COMPS_MEDIAN.evRev.toFixed(2)}×).
      </p>
      <div className="ma-project__viz-stack">
        <div className="ma-project__chart-shell">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="rgba(248,250,252,0.08)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 11 }} />
            <YAxis
              tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 11 }}
              tickFormatter={(v) => `${v}×`}
            />
            <Tooltip {...CHART_TOOLTIP} formatter={(v: number) => [`${v.toFixed(2)}×`, metric === 'evRev' ? 'EV/Rev' : 'EV/EBITDA']} />
            {refLine.map((r) => (
              <ReferenceLine
                key={r.label}
                y={r.value}
                stroke={r.label.includes('bid') ? '#ffab5c' : '#8a8a8a'}
                strokeDasharray="4 4"
                label={{ value: r.label, fill: 'rgba(248,250,252,0.6)', fontSize: 11 }}
              />
            ))}
            <Bar dataKey="value" fill="rgba(56, 189, 248, 0.65)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      <SortableTable
        caption="Trading comparable company statistics"
        columns={[
          { key: 'ticker', label: 'Ticker', mono: true },
          { key: 'company', label: 'Company' },
          { key: 'ev', label: 'EV', align: 'right' },
          { key: 'revenue', label: 'FY1 Rev', align: 'right' },
          { key: 'evRev', label: 'EV/Rev', align: 'right' },
          { key: 'evEbitda', label: 'EV/EBITDA', align: 'right' },
          { key: 'ebitdaMargin', label: 'EBITDA %', align: 'right' },
        ]}
        rows={tableRows}
        footerRows={[
          {
            id: 'median',
            ticker: 'Median',
            company: 'Peer set',
            ev: '—',
            revenue: '—',
            evRev: `${TRADING_COMPS_MEDIAN.evRev.toFixed(2)}×`,
            evEbitda: `${TRADING_COMPS_MEDIAN.evEbitda.toFixed(1)}×`,
            ebitdaMargin: '—',
            _variant: 'footer',
          },
        ]}
      />
      </div>
    </section>
  );
}

export function PrecedentTransactionsSection() {
  const chartData = [
    ...PRECEDENT_TRANSACTIONS.map((t) => ({
      name: t.target,
      evRev: t.evRev,
      dealValue: t.dealValue,
    })),
    { name: 'HUBS bid', evRev: HUBS_BID_EV_REV, dealValue: PROPOSED_BID_B, isBid: true },
  ];

  const tableRows = PRECEDENT_TRANSACTIONS.map((t) => ({
    id: t.target,
    target: t.target,
    acquirer: t.acquirer,
    year: t.year,
    dealValue: formatMillions(t.dealValue),
    ltmRevenue: formatMillions(t.ltmRevenue),
    evRev: `${t.evRev.toFixed(1)}×`,
  }));

  return (
    <section className="ma-project__section ma-project__panel" aria-labelledby="ma-precedent-heading">
      <h2 id="ma-precedent-heading" className="ma-project__section-title">
        Precedent SaaS transactions
      </h2>
      <p className="ma-project__section-lead">
        Recent control transactions traded at a median {PRECEDENT_MEDIAN_EV_REV}× LTM revenue, roughly
        half the proposed HubSpot bid multiple, reflecting a discount for size and the 2026 market.
      </p>
      <div className="ma-project__viz-stack">
      <div className="ma-project__chart-shell">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="rgba(248,250,252,0.08)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 11 }} />
            <YAxis
              yAxisId="mult"
              tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 11 }}
              tickFormatter={(v) => `${v}×`}
            />
            <YAxis
              yAxisId="val"
              orientation="right"
              tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 11 }}
              tickFormatter={(v) => `$${v / 1000}B`}
            />
            <Tooltip
              {...CHART_TOOLTIP}
              formatter={(v: number, name: string) =>
                name === 'EV/LTM Rev' ? [`${v.toFixed(1)}×`, name] : [formatBillions(v), name]
              }
            />
            <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(248,250,252,0.75)' }} />
            <ReferenceLine
              yAxisId="mult"
              y={PRECEDENT_MEDIAN_EV_REV}
              stroke="#8a8a8a"
              strokeDasharray="4 4"
              label={{ value: 'Precedent median', fill: 'rgba(248,250,252,0.6)', fontSize: 11 }}
            />
            <Bar yAxisId="mult" dataKey="evRev" name="EV/LTM Rev" fill="rgba(56, 189, 248, 0.55)" radius={[4, 4, 0, 0]} />
            <Line
              yAxisId="val"
              type="monotone"
              dataKey="dealValue"
              name="Deal value"
              stroke="#ffab5c"
              strokeWidth={2}
              dot={{ r: 4, fill: '#ffab5c' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <SortableTable
        caption="Selected precedent transactions (2018–2023)"
        columns={[
          { key: 'target', label: 'Target' },
          { key: 'acquirer', label: 'Acquirer' },
          { key: 'year', label: 'Year', align: 'right' },
          { key: 'dealValue', label: 'Deal value', align: 'right' },
          { key: 'ltmRevenue', label: 'LTM rev', align: 'right' },
          { key: 'evRev', label: 'EV/Rev', align: 'right' },
        ]}
        rows={tableRows}
      />
      </div>
    </section>
  );
}

export function CrmDcfSummarySection() {
  return (
    <section className="ma-project__section ma-project__panel" aria-labelledby="ma-crm-dcf-heading">
      <h2 id="ma-crm-dcf-heading" className="ma-project__section-title">
        Salesforce standalone DCF
      </h2>
      <p className="ma-project__section-lead">
        Acquirer valuation context: CRM standalone enterprise value and projected cash generation
        underpin debt capacity for the cash bid.
      </p>
      <div className="ma-project__accretion-metrics">
        <div className="project-page__key-metrics-card project-page__key-metrics-card--accent">
          <span className="project-page__key-metrics-label">Standalone EV</span>
          <span className="project-page__key-metrics-value">{formatBillions(CRM_DCF_BASE.ev)}</span>
          <span className="project-page__key-metrics-sub">five-year FCFF DCF</span>
        </div>
        <div className="project-page__key-metrics-card">
          <span className="project-page__key-metrics-label">WACC</span>
          <span className="project-page__key-metrics-value">{CRM_DCF_BASE.wacc}%</span>
          <span className="project-page__key-metrics-sub">vs HUBS {12.87}%</span>
        </div>
        <div className="project-page__key-metrics-card">
          <span className="project-page__key-metrics-label">2030E FCF</span>
          <span className="project-page__key-metrics-value">
            {formatBillions(CRM_DCF_PROJECTION[4].fcf, 1)}
          </span>
          <span className="project-page__key-metrics-sub">supports rapid deleveraging</span>
        </div>
      </div>
      <div className="ma-project__viz-stack">
      <div className="ma-project__chart-shell">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={CRM_DCF_PROJECTION} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="rgba(248,250,252,0.08)" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 12 }} />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 11 }}
              tickFormatter={(v) => `$${Math.round(v / 1000)}B`}
            />
            <Tooltip
              {...CHART_TOOLTIP}
              formatter={(v: number, name: string) => [formatMillions(v, 0), name]}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(248,250,252,0.75)' }} />
            <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="rgba(138, 138, 138, 0.35)" radius={[4, 4, 0, 0]} />
            <Line yAxisId="left" type="monotone" dataKey="fcf" name="Free cash flow" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <SortableTable
        caption="WACC assumptions: HUBS vs CRM"
        columns={[
          { key: 'label', label: 'Assumption' },
          { key: 'hubs', label: 'HubSpot', align: 'right' },
          { key: 'crm', label: 'Salesforce', align: 'right' },
        ]}
        rows={WACC_BRIDGE.map((r, i) => ({
          id: i,
          ...r,
          _variant: r.label === 'WACC' ? ('emphasis' as const) : undefined,
        }))}
        sortable={false}
      />
      </div>
    </section>
  );
}

export function SynergyBuildUpSection() {
  return (
    <section className="ma-project__section ma-project__panel" aria-labelledby="ma-synergy-heading">
      <h2 id="ma-synergy-heading" className="ma-project__section-title">
        Synergy build-up
      </h2>
      <p className="ma-project__section-lead">
        Run-rate synergies reach $450M by 2028 ($200M revenue + $250M cost), phased in over three
        years post-close.
      </p>
      <div className="ma-project__viz-stack">
      <div className="ma-project__chart-shell">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={SYNERGY_SCHEDULE} margin={{ top: 12, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="rgba(248,250,252,0.08)" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 11 }} tickFormatter={(v) => `$${v}M`} />
            <Tooltip {...CHART_TOOLTIP} formatter={(v: number) => [`$${v}M`, '']} />
            <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(248,250,252,0.75)' }} />
            <Bar dataKey="revenue" name="Revenue synergies" stackId="syn" fill="rgba(56, 189, 248, 0.7)" />
            <Bar dataKey="cost" name="Cost synergies" stackId="syn" fill="rgba(255, 143, 46, 0.65)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <SortableTable
        caption="Synergy schedule ($M)"
        columns={[
          { key: 'year', label: 'Year' },
          { key: 'revenue', label: 'Revenue syn.', align: 'right' },
          { key: 'cost', label: 'Cost syn.', align: 'right' },
          { key: 'total', label: 'Total', align: 'right' },
        ]}
        rows={SYNERGY_SCHEDULE.map((r) => ({
          id: r.year,
          year: r.year,
          revenue: `$${r.revenue}M`,
          cost: `$${r.cost}M`,
          total: `$${r.revenue + r.cost}M`,
        }))}
      />
      </div>
    </section>
  );
}

export function ProFormaFinancialsSection() {
  const [showCrmOverlay, setShowCrmOverlay] = useState(true);

  return (
    <section className="ma-project__section ma-project__panel" aria-labelledby="ma-proforma-heading">
      <div className="ma-project__section-header">
        <h2 id="ma-proforma-heading" className="ma-project__section-title">
          Pro-forma combined financials (Option A)
        </h2>
        <label className="ma-project__toggle">
          <input
            type="checkbox"
            checked={showCrmOverlay}
            onChange={(e) => setShowCrmOverlay(e.target.checked)}
          />
          Show CRM standalone revenue
        </label>
      </div>
      <p className="ma-project__section-lead">
        Combined revenue scales to {formatBillions(PRO_FORMA_COMBINED[4].revenue)} by 2030 with EBITDA
        margin expansion driven by HubSpot margin ramp and synergy realization.
      </p>
      <div className="ma-project__chart-shell">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={PRO_FORMA_COMBINED} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="rgba(248,250,252,0.08)" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 12 }} />
            <YAxis
              tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 11 }}
              tickFormatter={(v) => `$${Math.round(v / 1000)}B`}
            />
            <Tooltip {...CHART_TOOLTIP} formatter={(v: number, name: string) => [formatMillions(v, 0), name]} />
            <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(248,250,252,0.75)' }} />
            <Bar dataKey="revenue" name="Combined revenue" fill="rgba(56, 189, 248, 0.45)" radius={[4, 4, 0, 0]} />
            {showCrmOverlay && (
              <Line type="monotone" dataKey="crmRevenue" name="CRM standalone revenue" stroke="#8a8a8a" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            )}
            <Line type="monotone" dataKey="ebitda" name="Combined EBITDA" stroke="#ffab5c" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="fcf" name="Free cash flow" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function DebtPaydownSection() {
  const chartData = ACQUISITION_DEBT_SCHEDULE.filter((r) => r.beginning > 0 || r.year === '2028');

  return (
    <section className="ma-project__section ma-project__panel" aria-labelledby="ma-debt-heading">
      <h2 id="ma-debt-heading" className="ma-project__section-title">
        Acquisition debt paydown
      </h2>
      <p className="ma-project__section-lead">
        $10.4B of new acquisition debt is repaid almost entirely from Year 1 free cash flow ($9.9B),
        with the balance cleared in Year 2.
      </p>
      <div className="ma-project__viz-stack">
      <div className="ma-project__chart-shell">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={ACQUISITION_DEBT_SCHEDULE} margin={{ top: 12, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="rgba(248,250,252,0.08)" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 11 }} tickFormatter={(v) => `$${Math.round(v / 1000)}B`} />
            <Tooltip {...CHART_TOOLTIP} formatter={(v: number, name: string) => [formatMillions(v, 0), name]} />
            <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(248,250,252,0.75)' }} />
            <Bar dataKey="beginning" name="Beginning balance" fill="rgba(255, 143, 46, 0.45)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="repayment" name="Repayment" fill="rgba(52, 211, 153, 0.55)" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="ending" name="Ending balance" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <SortableTable
        caption="Acquisition debt schedule ($M)"
        columns={[
          { key: 'year', label: 'Year' },
          { key: 'beginning', label: 'Beginning', align: 'right' },
          { key: 'repayment', label: 'Repayment', align: 'right' },
          { key: 'ending', label: 'Ending', align: 'right' },
        ]}
        rows={chartData.map((r) => ({
          id: r.year,
          year: r.year,
          beginning: formatMillions(r.beginning),
          repayment: formatMillions(r.repayment),
          ending: formatMillions(r.ending),
        }))}
      />
      </div>
    </section>
  );
}

export function CreditMetricsSection() {
  return (
    <section className="ma-project__section ma-project__panel" aria-labelledby="ma-credit-heading">
      <h2 id="ma-credit-heading" className="ma-project__section-title">
        Credit metrics (Option A)
      </h2>
      <p className="ma-project__section-lead">
        Combined entity maintains investment-grade leverage with Debt/EBITDA never exceeding 1.1×
        and interest coverage above 15× in all projection years.
      </p>
      <div className="ma-project__viz-stack">
      <div className="ma-project__chart-shell">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={CREDIT_METRICS} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="rgba(248,250,252,0.08)" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 12 }} />
            <YAxis yAxisId="lev" tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 11 }} tickFormatter={(v) => `${v}×`} domain={[0, 1.5]} />
            <YAxis yAxisId="cov" orientation="right" tick={{ fill: 'rgba(248,250,252,0.65)', fontSize: 11 }} tickFormatter={(v) => `${v}×`} />
            <Tooltip {...CHART_TOOLTIP} formatter={(v: number, name: string) => [`${v.toFixed(1)}×`, name]} />
            <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(248,250,252,0.75)' }} />
            <ReferenceLine yAxisId="lev" y={1.0} stroke="rgba(248,250,252,0.25)" strokeDasharray="4 4" />
            <Bar yAxisId="lev" dataKey="debtToEbitda" name="Total Debt / EBITDA" fill="rgba(255, 143, 46, 0.55)" radius={[4, 4, 0, 0]} />
            <Line yAxisId="cov" type="monotone" dataKey="interestCoverage" name="Interest coverage" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <SortableTable
        caption="Key credit metrics by year"
        columns={[
          { key: 'year', label: 'Year' },
          { key: 'debtToEbitda', label: 'Debt/EBITDA', align: 'right' },
          { key: 'interestCoverage', label: 'Int. coverage', align: 'right' },
        ]}
        rows={CREDIT_METRICS.map((r) => ({
          id: r.year,
          year: r.year,
          debtToEbitda: `${r.debtToEbitda.toFixed(2)}×`,
          interestCoverage: `${r.interestCoverage.toFixed(1)}×`,
        }))}
      />
      </div>
    </section>
  );
}

export function DealStructureComparisonSection() {
  const [highlight, setHighlight] = useState<'A' | 'B' | 'C'>('A');

  return (
    <section className="ma-project__section ma-project__panel" aria-labelledby="ma-structure-heading">
      <div className="ma-project__section-header">
        <h2 id="ma-structure-heading" className="ma-project__section-title">
          Financing structure comparison
        </h2>
        <div className="project-page__scenario-toggles" role="group" aria-label="Highlight structure">
          {(['A', 'B', 'C'] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={`project-page__scenario-btn ${highlight === key ? 'project-page__scenario-btn--active' : ''}`}
              onClick={() => setHighlight(key)}
            >
              Option {key}
            </button>
          ))}
        </div>
      </div>
      <p className="ma-project__section-lead">
        Option A avoids permanent dilution and is the only structure that reaches EPS accretion within
        the five-year window.
      </p>
      <div className="ma-project__table-wrap">
        <table className="ma-project__table ma-project__table--structure">
          <caption className="ma-project__table-caption">Deal structure summary</caption>
          <thead>
            <tr>
              <th scope="col" className="ma-project__th--label">
                Metric
              </th>
              <th
                scope="col"
                className={`ma-project__th--num${highlight === 'A' ? ' ma-project__col--active' : ''}`}
              >
                Option A
              </th>
              <th
                scope="col"
                className={`ma-project__th--num${highlight === 'B' ? ' ma-project__col--active' : ''}`}
              >
                Option B
              </th>
              <th
                scope="col"
                className={`ma-project__th--num${highlight === 'C' ? ' ma-project__col--active' : ''}`}
              >
                Option C
              </th>
            </tr>
          </thead>
          <tbody>
            {DEAL_STRUCTURE_TABLE.map((row) => (
              <tr
                key={row.metric}
                className={row.highlight ? 'ma-project__tr--emphasis' : undefined}
              >
                <th scope="row">{row.metric}</th>
                <td className={`ma-project__td--num${highlight === 'A' ? ' ma-project__col--active' : ''}`}>
                  {row.a}
                </td>
                <td className={`ma-project__td--num${highlight === 'B' ? ' ma-project__col--active' : ''}`}>
                  {row.b}
                </td>
                <td className={`ma-project__td--num${highlight === 'C' ? ' ma-project__col--active' : ''}`}>
                  {row.c}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
