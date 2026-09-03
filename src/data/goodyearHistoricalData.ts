// Extracted from GoodYear_Valuation_Final.xlsx (Beta_Calc, DEBT, Forecast, CCC, Ratio_Analysis tabs).
// All figures in millions of USD unless noted. Source: FactSet, company filings, valuation model.

export interface GoodyearPriceRow {
  date: string; // YYYY-MM-DD, month-end
  gt: number;
  gtReturn: number | null; // % MoM
  spx: number;
  spxReturn: number | null; // % MoM
}

export const GOODYEAR_PRICE_HISTORY: GoodyearPriceRow[] = [
  { date: '2020-05-29', gt: 7.61, gtReturn: null, spx: 3044.31, spxReturn: null },
  { date: '2020-06-30', gt: 8.945, gtReturn: 17.5427, spx: 3100.29, spxReturn: 1.8388 },
  { date: '2020-07-31', gt: 9.01, gtReturn: 0.7267, spx: 3271.12, spxReturn: 5.5105 },
  { date: '2020-08-31', gt: 9.595, gtReturn: 6.4928, spx: 3500.31, spxReturn: 7.0063 },
  { date: '2020-09-30', gt: 7.67, gtReturn: -20.0625, spx: 3363.0, spxReturn: -3.9228 },
  { date: '2020-10-30', gt: 8.28, gtReturn: 7.9531, spx: 3269.96, spxReturn: -2.7666 },
  { date: '2020-11-30', gt: 10.42, gtReturn: 25.8454, spx: 3621.63, spxReturn: 10.7547 },
  { date: '2020-12-31', gt: 10.91, gtReturn: 4.7025, spx: 3756.07, spxReturn: 3.7121 },
  { date: '2021-01-29', gt: 10.55, gtReturn: -3.2997, spx: 3714.24, spxReturn: -1.1136 },
  { date: '2021-02-26', gt: 16.81, gtReturn: 59.3365, spx: 3811.15, spxReturn: 2.6091 },
  { date: '2021-03-31', gt: 17.57, gtReturn: 4.5211, spx: 3972.89, spxReturn: 4.2439 },
  { date: '2021-04-30', gt: 17.21, gtReturn: -2.0489, spx: 4181.17, spxReturn: 5.2426 },
  { date: '2021-05-28', gt: 19.83, gtReturn: 15.2237, spx: 4204.11, spxReturn: 0.5485 },
  { date: '2021-06-30', gt: 17.15, gtReturn: -13.5149, spx: 4297.5, spxReturn: 2.2213 },
  { date: '2021-07-30', gt: 15.71, gtReturn: -8.3965, spx: 4395.26, spxReturn: 2.275 },
  { date: '2021-08-31', gt: 15.84, gtReturn: 0.8275, spx: 4522.68, spxReturn: 2.8989 },
  { date: '2021-09-30', gt: 17.7, gtReturn: 11.7424, spx: 4307.54, spxReturn: -4.7569 },
  { date: '2021-10-29', gt: 19.12, gtReturn: 8.0226, spx: 4605.38, spxReturn: 6.9143 },
  { date: '2021-11-30', gt: 20.11, gtReturn: 5.1778, spx: 4567.0, spxReturn: -0.8333 },
  { date: '2021-12-31', gt: 21.32, gtReturn: 6.0169, spx: 4766.18, spxReturn: 4.3613 },
  { date: '2022-01-31', gt: 20.73, gtReturn: -2.7674, spx: 4515.55, spxReturn: -5.2586 },
  { date: '2022-02-28', gt: 15.49, gtReturn: -25.2774, spx: 4373.94, spxReturn: -3.136 },
  { date: '2022-03-31', gt: 14.29, gtReturn: -7.7469, spx: 4530.41, spxReturn: 3.5774 },
  { date: '2022-04-29', gt: 13.32, gtReturn: -6.788, spx: 4131.93, spxReturn: -8.7958 },
  { date: '2022-05-31', gt: 12.92, gtReturn: -3.003, spx: 4132.15, spxReturn: 0.0054 },
  { date: '2022-06-30', gt: 10.71, gtReturn: -17.1053, spx: 3785.38, spxReturn: -8.3918 },
  { date: '2022-07-29', gt: 12.28, gtReturn: 14.6592, spx: 4130.29, spxReturn: 9.1114 },
  { date: '2022-08-31', gt: 14.03, gtReturn: 14.2508, spx: 3955.0, spxReturn: -4.2439 },
  { date: '2022-09-30', gt: 10.09, gtReturn: -28.0827, spx: 3585.62, spxReturn: -9.3394 },
  { date: '2022-10-31', gt: 12.7, gtReturn: 25.8672, spx: 3871.98, spxReturn: 7.9861 },
  { date: '2022-11-30', gt: 11.22, gtReturn: -11.6535, spx: 4080.11, spxReturn: 5.3753 },
  { date: '2022-12-30', gt: 10.15, gtReturn: -9.5365, spx: 3839.5, spxReturn: -5.8971 },
  { date: '2023-01-31', gt: 11.25, gtReturn: 10.8374, spx: 4076.6, spxReturn: 6.1755 },
  { date: '2023-02-28', gt: 11.36, gtReturn: 0.9778, spx: 3970.15, spxReturn: -2.6113 },
  { date: '2023-03-31', gt: 11.02, gtReturn: -2.993, spx: 4109.31, spxReturn: 3.5051 },
  { date: '2023-04-28', gt: 10.67, gtReturn: -3.176, spx: 4169.48, spxReturn: 1.4642 },
  { date: '2023-05-31', gt: 13.73, gtReturn: 28.6785, spx: 4179.83, spxReturn: 0.2481 },
  { date: '2023-06-30', gt: 13.68, gtReturn: -0.3642, spx: 4450.38, spxReturn: 6.4729 },
  { date: '2023-07-31', gt: 16.08, gtReturn: 17.5439, spx: 4588.96, spxReturn: 3.1139 },
  { date: '2023-08-31', gt: 12.91, gtReturn: -19.7139, spx: 4507.66, spxReturn: -1.7716 },
  { date: '2023-09-29', gt: 12.43, gtReturn: -3.718, spx: 4288.05, spxReturn: -4.8719 },
  { date: '2023-10-31', gt: 11.9, gtReturn: -4.2639, spx: 4193.8, spxReturn: -2.198 },
  { date: '2023-11-30', gt: 13.89, gtReturn: 16.7227, spx: 4567.8, spxReturn: 8.9179 },
  { date: '2023-12-29', gt: 14.32, gtReturn: 3.0958, spx: 4769.83, spxReturn: 4.4229 },
  { date: '2024-01-31', gt: 13.94, gtReturn: -2.6536, spx: 4845.65, spxReturn: 1.5895 },
  { date: '2024-02-29', gt: 11.88, gtReturn: -14.7776, spx: 5096.27, spxReturn: 5.1721 },
  { date: '2024-03-28', gt: 13.73, gtReturn: 15.5724, spx: 5254.35, spxReturn: 3.102 },
  { date: '2024-04-30', gt: 11.96, gtReturn: -12.8915, spx: 5035.69, spxReturn: -4.1616 },
  { date: '2024-05-31', gt: 12.31, gtReturn: 2.9264, spx: 5277.51, spxReturn: 4.802 },
  { date: '2024-06-28', gt: 11.35, gtReturn: -7.7985, spx: 5460.48, spxReturn: 3.4671 },
  { date: '2024-07-31', gt: 11.7, gtReturn: 3.0837, spx: 5522.3, spxReturn: 1.1321 },
  { date: '2024-08-30', gt: 8.82, gtReturn: -24.6154, spx: 5648.4, spxReturn: 2.2834 },
  { date: '2024-09-30', gt: 8.85, gtReturn: 0.3401, spx: 5762.48, spxReturn: 2.0198 },
  { date: '2024-10-31', gt: 8.01, gtReturn: -9.4915, spx: 5705.45, spxReturn: -0.9898 },
  { date: '2024-11-29', gt: 10.74, gtReturn: 34.0824, spx: 6032.38, spxReturn: 5.7303 },
  { date: '2024-12-31', gt: 9, gtReturn: -16.2011, spx: 5881.63, spxReturn: -2.4991 },
];

// Total debt excluding lease obligations, fiscal year-end. Source: FactSet Debt Capital Structure.
export const GOODYEAR_DEBT_HISTORY: { year: number; totalDebt: number }[] = [
  { year: 2017, totalDebt: 5689 },
  { year: 2018, totalDebt: 5726 },
  { year: 2019, totalDebt: 5414 },
  { year: 2020, totalDebt: 5740 },
  { year: 2021, totalDebt: 7142 },
  { year: 2022, totalDebt: 7635 },
  { year: 2023, totalDebt: 7356 },
  { year: 2024, totalDebt: 7521 },
];

export interface GoodyearRatioRow {
  year: string;
  currentRatio: number;
  quickRatio: number;
  debtRatio: number;
  eps: number;
  roa: number; // fraction
  roe: number; // fraction
  revenueGrowth: number; // fraction
  profitMargin: number; // fraction
}

export const GOODYEAR_RATIO_HISTORY: GoodyearRatioRow[] = [
  {
    year: "DEC '20",
    currentRatio: 1.1,
    quickRatio: 0.68,
    debtRatio: 0.8,
    eps: -5.36,
    roa: -0.0744,
    roe: -0.3376,
    revenueGrowth: -0.1644,
    profitMargin: -0.1018,
  },
  {
    year: "DEC '21",
    currentRatio: 1.11,
    quickRatio: 0.57,
    debtRatio: 0.76,
    eps: 2.93,
    roa: 0.0403,
    roe: 0.1892,
    revenueGrowth: 0.4186,
    profitMargin: 0.0437,
  },
  {
    year: "DEC '22",
    currentRatio: 1.21,
    quickRatio: 0.57,
    debtRatio: 0.76,
    eps: 0.71,
    roa: 0.0092,
    roe: 0.0392,
    revenueGrowth: 0.1904,
    profitMargin: 0.0097,
  },
  {
    year: "DEC '23",
    currentRatio: 1.07,
    quickRatio: 0.55,
    debtRatio: 0.78,
    eps: -2.42,
    roa: -0.0313,
    roe: -0.1382,
    revenueGrowth: -0.0355,
    profitMargin: -0.0343,
  },
  {
    year: "DEC '24",
    currentRatio: 1.04,
    quickRatio: 0.55,
    debtRatio: 0.77,
    eps: 0.24,
    roa: 0.0033,
    roe: 0.0149,
    revenueGrowth: -0.0592,
    profitMargin: 0.0037,
  },
];

export interface GoodyearCccRow {
  year: number;
  daysInventory: number;
  daysReceivables: number;
  daysPayables: number;
  cashConversionCycle: number;
}

// From cash-conversion-cycle build (Exhibit 4). 2019 excluded — no prior-year average available.
export const GOODYEAR_CCC_HISTORY: GoodyearCccRow[] = [
  {
    year: 2020,
    daysInventory: 92.75,
    daysReceivables: 53.74,
    daysPayables: 108.49,
    cashConversionCycle: 38.0,
  },
  {
    year: 2021,
    daysInventory: 79.07,
    daysReceivables: 42.46,
    daysPayables: 97.59,
    cashConversionCycle: 23.94,
  },
  {
    year: 2022,
    daysInventory: 90.0,
    daysReceivables: 43.68,
    daysPayables: 98.67,
    cashConversionCycle: 35.02,
  },
  {
    year: 2023,
    daysInventory: 93.51,
    daysReceivables: 48.4,
    daysPayables: 103.24,
    cashConversionCycle: 38.68,
  },
  {
    year: 2024,
    daysInventory: 89.37,
    daysReceivables: 49.96,
    daysPayables: 102.64,
    cashConversionCycle: 36.69,
  },
];

export interface GoodyearForecastRow {
  year: number;
  revenue: number;
  ebit: number;
  nopat: number;
  unleveredFcf: number | null;
}

// Base year (2024, actual) plus 5-year forecast. Source: Forecast tab.
export const GOODYEAR_FORECAST: GoodyearForecastRow[] = [
  { year: 2024, revenue: 18878, ebit: 773, nopat: 579.75, unleveredFcf: null },
  { year: 2025, revenue: 19513.88, ebit: 843.67, nopat: 632.75, unleveredFcf: 498.44 },
  { year: 2026, revenue: 20171.17, ebit: 872.09, nopat: 654.06, unleveredFcf: 515.23 },
  { year: 2027, revenue: 20850.6, ebit: 901.46, nopat: 676.1, unleveredFcf: 532.58 },
  { year: 2028, revenue: 21552.92, ebit: 931.82, nopat: 698.87, unleveredFcf: 550.52 },
  { year: 2029, revenue: 22278.9, ebit: 963.21, nopat: 722.41, unleveredFcf: 569.06 },
];

// DCF mechanics: forecast unlevered FCF is independent of WACC/terminal growth (those only
// affect discounting and the terminal value), so a fresh price can be computed for any
// WACC/terminal-growth pair using the same 5-year FCF stream as the model.
export const GOODYEAR_DCF_UNLEVERED_FCF = [
  498.438467, 515.227584, 532.582215, 550.521411, 569.064859,
];
export const GOODYEAR_DCF_NET_DEBT = 7922;
export const GOODYEAR_DCF_DILUTED_SHARES = 288;

export function goodyearDcfPricePerShare(wacc: number, terminalGrowth: number): number {
  const fcf = GOODYEAR_DCF_UNLEVERED_FCF;
  let pvFcf = 0;
  fcf.forEach((cf, i) => {
    pvFcf += cf / Math.pow(1 + wacc, i + 1);
  });
  const terminalValue = (fcf[fcf.length - 1] * (1 + terminalGrowth)) / (wacc - terminalGrowth);
  const pvTerminal = terminalValue / Math.pow(1 + wacc, fcf.length);
  const enterpriseValue = pvFcf + pvTerminal;
  const equityValue = enterpriseValue - GOODYEAR_DCF_NET_DEBT;
  return equityValue / GOODYEAR_DCF_DILUTED_SHARES;
}

export const GOODYEAR_WACC_BASE = 0.06656139448457017;
export const GOODYEAR_SENSITIVITY_WACC = [0.06, GOODYEAR_WACC_BASE, 0.07, 0.075, 0.08];
export const GOODYEAR_SENSITIVITY_GROWTH = [0.015, 0.02, 0.025, 0.03];
