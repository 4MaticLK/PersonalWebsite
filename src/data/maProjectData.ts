/** HubSpot standalone DCF sensitivity (enterprise value, $M) — HUBS Projection rows 76–80. */
export const HUBS_WACC_LEVELS = [11.87, 12.87, 13.87, 14.87, 15.87] as const;
export const HUBS_GROWTH_LEVELS = [2.5, 3.0, 3.5, 4.0, 4.5] as const;

export const HUBS_DCF_SENSITIVITY: number[][] = [
  [7048, 7374, 7738, 8149, 8615],
  [6279, 6534, 6817, 7131, 7483],
  [5644, 5848, 6072, 6318, 6590],
  [5116, 5282, 5462, 5659, 5875],
  [4669, 4806, 4953, 5114, 5288],
];

export const HUBS_DCF_BASE = { wacc: 12.87, growth: 3.5, ev: 6816.9 };
export const CRM_DCF_BASE = { wacc: 11.23, growth: 3.5, ev: 209854.7 };

export const FOOTBALL_FIELD = [
  { method: 'DCF (standalone)', low: 5848, mid: 6817, high: 8149 },
  { method: 'Trading comps', low: 12550, mid: 14819, high: 18601 },
  { method: 'Precedent transactions', low: 21606, mid: 28670, high: 32515 },
  { method: 'Proposed bid range', low: 13335, mid: 16769, high: 19755 },
] as const;

export const PROPOSED_BID_B = 17000;
/** 17000 / NTM revenue ($3,694.9M) */
export const HUBS_BID_EV_REV = 4.6;
export const PRECEDENT_MEDIAN_EV_REV = 8.4;

export const PROJECTION_YEARS = [2026, 2027, 2028, 2029, 2030] as const;

export type DealStructure = 'A' | 'B' | 'C';

export const DEAL_STRUCTURES: Record<
  DealStructure,
  { label: string; sub: string; combinedEps: number[]; accretionPct: number[] }
> = {
  A: {
    label: 'Option A',
    sub: '100% cash',
    combinedEps: [7.31, 9.31, 11.14, 12.67, 14.27],
    accretionPct: [-10.8, -1.8, 1.0, 2.2, 3.3],
  },
  B: {
    label: 'Option B',
    sub: '50% cash / 50% stock',
    combinedEps: [7.37, 8.85, 10.56, 12.04, 13.57],
    accretionPct: [-10.0, -6.8, -4.2, -3.0, -1.9],
  },
  C: {
    label: 'Option C',
    sub: '100% stock',
    combinedEps: [7.39, 8.8, 10.45, 11.86, 13.33],
    accretionPct: [-9.8, -7.2, -5.2, -4.4, -3.6],
  },
};

export const CRM_STANDALONE_EPS = [8.19, 9.49, 11.02, 12.41, 13.82];

export interface TradingComp {
  company: string;
  ticker: string;
  ev: number;
  revenue: number;
  evRev: number;
  evEbitda: number;
  ebitdaMargin: number;
}

export const TRADING_COMPS: TradingComp[] = [
  { company: 'Okta', ticker: 'OKTA', ev: 12523, revenue: 3183, evRev: 4.29, evEbitda: 14.9, ebitdaMargin: 26.3 },
  { company: 'Roku', ticker: 'ROKU', ev: 12774, revenue: 5502, evRev: 2.7, evEbitda: 19.9, ebitdaMargin: 11.7 },
  { company: 'Tyler Technologies', ticker: 'TYL', ev: 14273, revenue: 2531, evRev: 6.12, evEbitda: 19.3, ebitdaMargin: 29.2 },
  { company: 'Gen Digital', ticker: 'GEN', ev: 19493, revenue: 4961, evRev: 4.12, evEbitda: 7.9, ebitdaMargin: 50.0 },
  {
    company: 'Jack Henry & Associates',
    ticker: 'JKHY',
    ev: 11415,
    revenue: 2520,
    evRev: 4.63,
    evEbitda: 14.1,
    ebitdaMargin: 32.2,
  },
  { company: 'Dynatrace', ticker: 'DT', ev: 10503, revenue: 2008, evRev: 5.44, evEbitda: 17.3, ebitdaMargin: 30.3 },
  { company: 'Trimble', ticker: 'TRMB', ev: 16365, revenue: 3866, evRev: 4.56, evEbitda: 14.2, ebitdaMargin: 29.7 },
];

export const TRADING_COMPS_MEDIAN = { evRev: 4.56, evEbitda: 14.9 };

export interface PrecedentTransaction {
  target: string;
  acquirer: string;
  year: number;
  dealValue: number;
  ltmRevenue: number;
  evRev: number;
}

export const PRECEDENT_TRANSACTIONS: PrecedentTransaction[] = [
  { target: 'Zendesk', acquirer: 'Hellman & Friedman', year: 2022, dealValue: 10200, ltmRevenue: 1700, evRev: 6.0 },
  { target: 'Qualtrics', acquirer: 'Silver Lake / CPP', year: 2023, dealValue: 12500, ltmRevenue: 1800, evRev: 6.9 },
  { target: 'Ping Identity', acquirer: 'Thoma Bravo', year: 2022, dealValue: 2800, ltmRevenue: 332, evRev: 8.4 },
  { target: 'Avalara', acquirer: 'Vista Equity', year: 2022, dealValue: 8400, ltmRevenue: 756, evRev: 8.8 },
  { target: 'Coupa Software', acquirer: 'Thoma Bravo', year: 2023, dealValue: 8000, ltmRevenue: 952, evRev: 8.4 },
];

export const SYNERGY_SCHEDULE = PROJECTION_YEARS.map((year, i) => ({
  year: String(year),
  revenue: [50, 130, 200, 200, 200][i],
  cost: [62.5, 162.5, 250, 250, 250][i],
}));

/** Combined Financials — Option A pro-forma (rows 90, 103, 136, 87). */
export const PRO_FORMA_COMBINED = PROJECTION_YEARS.map((year, i) => ({
  year: String(year),
  revenue: [49214.7, 54660.3, 60900.0, 67167.2, 73419.0][i],
  ebitda: [14517.5, 16717.9, 19322.2, 21608.0, 23955.0][i],
  fcf: [11567.1, 14621.9, 16932.2, 18705.4, 20482.7][i],
  crmRevenue: [45469.9, 50244.2, 55771.1, 61348.2, 66869.5][i],
}));

/** Combined Financials — acquisition debt schedule (rows 121–124). */
export const ACQUISITION_DEBT_SCHEDULE = [
  { year: '2026', beginning: 10435, repayment: 9912.2, ending: 522.8 },
  { year: '2027', beginning: 522.8, repayment: 522.8, ending: 0 },
  { year: '2028', beginning: 0, repayment: 0, ending: 0 },
  { year: '2029', beginning: 0, repayment: 0, ending: 0 },
  { year: '2030', beginning: 0, repayment: 0, ending: 0 },
];

/** Combined Financials — key credit metrics (rows 158, 160). */
export const CREDIT_METRICS = PROJECTION_YEARS.map((year, i) => ({
  year: String(year),
  debtToEbitda: [1.11, 0.93, 0.8, 0.72, 0.65][i],
  interestCoverage: [15.9, 47.3, 59.6, 66.7, 73.9][i],
}));

export interface WaccRow {
  label: string;
  hubs: string;
  crm: string;
}

/** DCF Summary — assumptions rows 21–28. */
export const WACC_BRIDGE: WaccRow[] = [
  { label: 'Beta (levered)', hubs: '1.42', crm: '1.23' },
  { label: 'Risk-free rate', hubs: '4.39%', crm: '4.39%' },
  { label: 'Market risk premium', hubs: '6.00%', crm: '6.00%' },
  { label: 'Cost of equity', hubs: '12.89%', crm: '11.78%' },
  { label: 'After-tax cost of debt', hubs: '3.77%', crm: '4.46%' },
  { label: 'WACC', hubs: '12.87%', crm: '11.23%' },
  { label: 'Terminal growth', hubs: '3.50%', crm: '3.50%' },
];

export interface DealStructureRow {
  metric: string;
  a: string;
  b: string;
  c: string;
  highlight?: 'A' | 'B' | 'C';
}

/** Combined Financials — deal structure rows 18–25, accretion rows 52/61/70. */
export const DEAL_STRUCTURE_TABLE: DealStructureRow[] = [
  { metric: 'Structure', a: '100% cash', b: '50/50 cash & stock', c: '100% stock' },
  { metric: 'Cash deployed', a: '$6.6B', b: '$6.6B', c: '$0' },
  { metric: 'Stock issued', a: '$0', b: '$8.5B', c: '$17.0B' },
  { metric: 'New debt', a: '$10.4B', b: '$1.9B', c: '$0' },
  { metric: 'New shares (M)', a: '0', b: '43.5', c: '87.1' },
  { metric: 'Diluted shares (M)', a: '956', b: '999.5', c: '1043.1' },
  { metric: 'Year 1 dilution', a: '−10.8%', b: '−10.0%', c: '−9.8%' },
  { metric: 'Accretive by', a: '2028', b: 'Not in window', c: 'Not in window', highlight: 'A' },
  { metric: 'Year 5 accretion', a: '+3.3%', b: '−1.9%', c: '−3.6%', highlight: 'A' },
];

/** DCF Summary — CRM standalone revenue & FCF (rows 4, 10). */
export const CRM_DCF_PROJECTION = PROJECTION_YEARS.map((year, i) => ({
  year: String(year),
  revenue: [45469.9, 50244.2, 55771.1, 61348.2, 66869.5][i],
  fcf: [11874.5, 14182.7, 16210.6, 17829.3, 19427.6][i],
}));

export function bilinearInterpEv(wacc: number, growth: number): number {
  const xVals = HUBS_WACC_LEVELS;
  const yVals = HUBS_GROWTH_LEVELS;
  const grid = HUBS_DCF_SENSITIVITY;

  const xClamped = Math.max(xVals[0], Math.min(xVals[xVals.length - 1], wacc));
  const yClamped = Math.max(yVals[0], Math.min(yVals[yVals.length - 1], growth));

  let xi = 0;
  for (let i = 0; i < xVals.length - 1; i++) {
    if (xClamped >= xVals[i] && xClamped <= xVals[i + 1]) {
      xi = i;
      break;
    }
  }
  let yi = 0;
  for (let j = 0; j < yVals.length - 1; j++) {
    if (yClamped >= yVals[j] && yClamped <= yVals[j + 1]) {
      yi = j;
      break;
    }
  }

  const x1 = xVals[xi];
  const x2 = xVals[xi + 1];
  const y1 = yVals[yi];
  const y2 = yVals[yi + 1];

  const q11 = grid[xi][yi];
  const q12 = grid[xi][yi + 1];
  const q21 = grid[xi + 1][yi];
  const q22 = grid[xi + 1][yi + 1];

  const wx = x2 === x1 ? 0 : (xClamped - x1) / (x2 - x1);
  const wy = y2 === y1 ? 0 : (yClamped - y1) / (y2 - y1);

  return (1 - wx) * (1 - wy) * q11 + wx * (1 - wy) * q21 + (1 - wx) * wy * q12 + wx * wy * q22;
}

export function formatBillions(millions: number, digits = 1): string {
  return `$${(millions / 1000).toFixed(digits)}B`;
}

export function formatMillions(millions: number, digits = 0): string {
  if (Math.abs(millions) >= 1000) return formatBillions(millions, digits > 0 ? digits : 1);
  return `$${millions.toFixed(digits)}M`;
}
