/**
 * Hotel resort valuation case study (RSM Georgia engagement, valuation date 30 June 2026).
 *
 * Anonymized on purpose: the client, the location below region level and every absolute GEL
 * figure from the engagement are withheld. Only public inputs (discount-rate build, peer filings)
 * and ratios / percentage changes are published. Do not add the concluded value, management's
 * plan figures or the client's comments here.
 */

export const HOTEL_VALUATION_SLUG = 'hotel-resort-valuation';

export const HOTEL_VALUATION_KEY_STATS = [
  { label: 'Approach', value: '10-yr DCF + Gordon growth' },
  { label: 'Property discount rate', value: '13.25%' },
  { label: 'Terminal growth / exit cap', value: '3.0% / 10.25%' },
  { label: 'Plan-to-valuation bridge', value: '14 adjustments' },
] as const;

export interface DiscountRateRow {
  component: string;
  value: string;
  source: string;
  /** Subtotal or concluded rate, rendered with emphasis. */
  emphasis?: boolean;
}

export const DISCOUNT_RATE_BUILD: DiscountRateRow[] = [
  {
    component: 'Georgian Government GEL bond yield (c.10 years)',
    value: '9.00%',
    source: 'MoF GEL bond placed May 2026 at 9.00%; Cbonds 10Y GEL curve 9.06%',
  },
  {
    component: 'Less: Georgia sovereign default spread',
    value: '(2.56%)',
    source: 'Damodaran, Jan 2026 (Moody’s Ba2)',
  },
  {
    component: 'GEL risk-free rate, ex sovereign default risk',
    value: '6.44%',
    source: 'Country risk is then counted once, through the equity risk premium',
    emphasis: true,
  },
  {
    component: 'Equity risk premium for Georgia',
    value: '8.13%',
    source: 'Damodaran: 4.23% mature-market ERP + 3.90% country risk premium',
  },
  {
    component: 'Asset (unlevered) beta: Hotel/Gaming, emerging markets',
    value: '0.58',
    source: 'Damodaran, 3-year average 2023–25; developed-market 0.83 shown for reference only',
  },
  {
    component: 'Systematic hotel risk premium (β × ERP)',
    value: '4.73%',
    source: 'Calculated',
  },
  {
    component: 'Asset-specific premium',
    value: '2.00%',
    source: 'Illiquidity, single regional property, no trading record',
  },
  {
    component: 'Required return, calculated',
    value: '13.17%',
    source: 'Rounded to the nearest 0.25%',
    emphasis: true,
  },
  {
    component: 'Property discount rate adopted',
    value: '13.25%',
    source: 'Nominal, pre-tax, unlevered GEL; implied real rate 9.95%',
    emphasis: true,
  },
];

export const DISCOUNT_RATE_CROSS_CHECKS = [
  { reference: 'GEL government bond (c.10 years)', rate: '9.00%', spread: '+4.25pp' },
  { reference: 'NBG monetary policy rate (Jun 2026)', rate: '8.25%', spread: '+5.00pp' },
  { reference: 'GEL lending rate (World Bank / NBG)', rate: '12.03%', spread: '+1.22pp' },
  {
    reference: 'Branded Kakheti resort, impairment test (Dec 2023)',
    rate: '13.10%',
    spread: '+0.15pp',
  },
] as const;

export interface BridgeStep {
  adjustment: string;
  why: string;
  /** Share of the total gap between the management-plan case and the valuation, in %. */
  shareOfGap: number;
}

/** The 14 reconciling items, expressed as a share of the plan-to-valuation gap (sums to 100%). */
export const PLAN_BRIDGE: BridgeStep[] = [
  {
    adjustment: 'Undistributed costs at market levels',
    why: 'A&G, sales & marketing (plus launch budget), repairs ramp and a utilities uplift, where the plan budgeted resort-atypical lows',
    shareOfGap: 24.7,
  },
  {
    adjustment: 'FF&E replacement reserve (2% → 4% of revenue)',
    why: 'Not in the plan; the HVS norm is 3–5%',
    shareOfGap: 14.4,
  },
  {
    adjustment: '3% operator fee',
    why: 'Keeps the operator’s return out of the property value',
    shareOfGap: 11.1,
  },
  {
    adjustment: 'Events, banquet and leisure positions added',
    why: 'Departments the staffing plan did not crew',
    shareOfGap: 10.9,
  },
  {
    adjustment: 'Property tax (1% of NBV) and land tax',
    why: 'Statutory charges missing from the plan',
    shareOfGap: 10.2,
  },
  {
    adjustment: 'Occupancy capped at 65%',
    why: 'Upper end of Kakheti resort evidence',
    shareOfGap: 9.2,
  },
  {
    adjustment: 'Casual banquet staff costed per guest',
    why: 'Scales with event size instead of a flat amount per wedding',
    shareOfGap: 6.9,
  },
  {
    adjustment: 'Soft opening in Year 1',
    why: '75% of keys sellable and 75% of event volumes while construction finishes',
    shareOfGap: 5.2,
  },
  {
    adjustment: 'Events cost of sales 30% incl. beverages',
    why: 'Plan covered food cost only',
    shareOfGap: 3.3,
  },
  {
    adjustment: 'Rooms costs per occupied room night',
    why: 'Laundry and other rooms costs driven by volume, not a fixed budget',
    shareOfGap: 3.3,
  },
  {
    adjustment: '10% contingency on remaining capex',
    why: 'Cost-to-complete list not yet confirmed as complete',
    shareOfGap: 0.8,
  },
  {
    adjustment: 'Band income recognised net (agent, IFRS 15)',
    why: 'Lowers revenue, no effect on profit or value',
    shareOfGap: 0,
  },
  {
    adjustment: 'Events volumes per plan',
    why: 'Adopted, tested in the downside case instead',
    shareOfGap: 0,
  },
  {
    adjustment: 'Guest tours at net commission',
    why: 'Adopted as planned',
    shareOfGap: 0,
  },
];

/** One-way sensitivities: change in value vs the base case, in %. */
export const ONE_WAY_SENSITIVITIES = [
  { driver: 'Events volume ±20%', down: -10.3, up: 10.3 },
  { driver: 'ADR ±10%', down: -9.6, up: 9.6 },
  { driver: 'Occupancy ±5pp', down: -9.5, up: 9.5 },
  { driver: 'Discount rate +/−1pp', down: -9.4, up: 11.4 },
  { driver: 'Payroll +/−10%', down: -4.8, up: 4.8 },
  { driver: 'Events spend per guest ±10%', down: -4.4, up: 4.4 },
  { driver: 'FF&E reserve +/−1pp', down: -3.0, up: 3.0 },
  { driver: 'Operator fee +/−1pp', down: -2.9, up: 2.9 },
  { driver: 'Terminal growth ±0.5pp', down: -2.2, up: 2.4 },
  { driver: 'Remaining capex +/−20%', down: -1.4, up: 1.4 },
] as const;

export interface SensitivityGrid {
  title: string;
  rowLabel: string;
  colLabel: string;
  rows: string[];
  cols: string[];
  /** % change vs base; [rowIndex][colIndex]. */
  values: number[][];
}

export const SENSITIVITY_GRIDS: SensitivityGrid[] = [
  {
    title: 'Discount rate × terminal growth',
    rowLabel: 'Terminal growth',
    colLabel: 'Discount rate',
    rows: ['2.0%', '2.5%', '3.0%', '3.5%', '4.0%'],
    cols: ['11.25%', '12.25%', '13.25%', '14.25%', '15.25%'],
    values: [
      [18.4, 5.9, -4.0, -12.5, -19.6],
      [21.8, 8.7, -2.2, -10.9, -18.4],
      [25.9, 11.5, 0, -9.3, -17.1],
      [30.2, 15.0, 2.5, -7.5, -15.6],
      [35.2, 18.4, 5.3, -5.3, -14.0],
    ],
  },
  {
    title: 'Stabilised occupancy × ADR',
    rowLabel: 'Occupancy',
    colLabel: 'ADR vs base',
    rows: ['59%', '62%', '65%', '68%', '71%'],
    cols: ['−20%', '−10%', '0%', '+10%', '+20%'],
    values: [
      [-28.7, -19.9, -11.2, -2.5, 6.2],
      [-24.0, -14.6, -5.6, 3.7, 12.8],
      [-19.3, -9.7, 0, 9.7, 19.3],
      [-14.3, -4.4, 5.9, 15.9, 26.2],
      [-9.7, 0.9, 11.5, 22.1, 32.7],
    ],
  },
];

export interface PeerRow {
  name: string;
  keys?: string;
  /** FY2021–FY2025; null where not reported. */
  values: (number | null)[];
}

export const PEER_YEARS = ['FY21', 'FY22', 'FY23', 'FY24', 'FY25'] as const;

/** EBITDA margin (%) from audited financial statements filed on reporting.ge. */
export const PEER_EBITDA_MARGIN: PeerRow[] = [
  { name: 'Lopota Lake Resort & Spa', keys: '311 keys', values: [40.5, 39.3, 34.1, 33.9, 32.2] },
  { name: 'Radisson Collection Tsinandali', values: [12.7, 14.1, 17.0, 16.8, null] },
  { name: 'Ambassadori Kachreti Golf Resort', values: [21.1, 6.7, 8.3, -7.9, null] },
  { name: 'Kvareli Palace', values: [-0.6, 15.0, 10.4, -17.0, null] },
];

/** Payroll as % of revenue, same sources. */
export const PEER_PAYROLL: PeerRow[] = [
  { name: 'Lopota Lake Resort & Spa', values: [23.0, 27.0, 28.4, 31.6, 34.1] },
  { name: 'Radisson Collection Tsinandali', values: [27.0, 24.1, 23.5, 23.9, null] },
  { name: 'Ambassadori Kachreti Golf Resort', values: [24.6, 30.1, 31.1, 37.5, null] },
];

export const MODEL_TABS = [
  { group: 'Inputs', tabs: ['Inputs', 'Discount_Rate', 'Mgmt_Plan', 'Payroll'] },
  { group: 'Calculation', tabs: ['Revenue', 'Operating_Forecast', 'Capex_Tax', 'Working_Capital'] },
  { group: 'Output', tabs: ['Summary', 'DCF', 'Reconciliation', 'Sensitivity'] },
  {
    group: 'Control & documentation',
    tabs: ['Checks', 'Benchmarks', 'Basis_of_Preparation', 'Client_Comments'],
  },
] as const;

export const KEY_JUDGEMENTS = [
  {
    title: 'A 2% asset-specific premium, not 1%',
    body: 'A lower premium was argued for, and 1pp off the rate would add about 11% to value. I kept 2%: the forecast leans on a business plan for a property with no trading record, and a single regional hotel has a thin buyer pool. 1% fits an established, trading hotel.',
  },
  {
    title: 'No real growth in perpetuity',
    body: 'Terminal growth is 3.0% nominal, equal to the NBG inflation target. Perpetual real growth is hard to defend for one ageing building, and real rate growth is already in the explicit period (ADR +3%, +2%, then +0.5% a year above CPI).',
  },
  {
    title: 'Keep the operator fee on an owner-operated hotel',
    body: 'This values the property, not the operating business. Whoever runs the hotel earns a return, so a 3% fee comes out of the cash flows even though the owner operates it today. The incentive fee was dropped because on-site management is already costed in payroll.',
  },
  {
    title: 'Book band income net',
    body: 'Most of the wedding band fee is passed straight to the band, so under IFRS 15 the hotel is an agent. Revenue drops, profit does not, and the revenue line becomes comparable with peers.',
  },
  {
    title: 'Cap occupancy at the top of the market evidence',
    body: 'The plan kept climbing past the market evidence: the largest Kakheti resort has run at 50–55% occupancy, and the branded comparable’s impairment test used 65% stabilised. I adopted the plan up to 65% and showed the cost of missing it in a separate downside case.',
  },
] as const;

export const DOWNSIDE_CASE_PCT = -22.1;
