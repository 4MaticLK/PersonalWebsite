/** Target weights (% of total portfolio). Update here when allocation changes. */
export const PORTFOLIO_TARGET_WEIGHTS: Record<string, number> = {
  VOO: 11.5,
  C: 10.6,
  VEA: 9.0,
  BND: 8.0,
  JPM: 5.2,
  AXP: 5.2,
  GOVT: 5.0,
  VWO: 4.5,
  NOC: 4.4,
  NVDA: 3.6,
  UNH: 3.0,
  LLY: 3.0,
  NEE: 3.0,
  TSM: 3.0,
  EOSE: 2.9,
  PLD: 2.5,
  PG: 2.5,
  CEG: 2.5,
  OKLO: 2.2,
  PHO: 2.0,
  CGW: 2.0,
  VTIP: 1.9,
  QQQ: 1.7,
  RVI: 1.0,
};

/** Rebalance when drift exceeds absolute band or relative band vs target. */
export const REBALANCE_ABS_BAND_PCT = 5;
export const REBALANCE_REL_BAND = 0.25;

export interface PortfolioTheme {
  id: string;
  label: string;
  description: string;
  tickers: readonly string[];
}

export const PORTFOLIO_THEMES: PortfolioTheme[] = [
  {
    id: 'financials',
    label: 'Financials',
    description: 'Banks and payments — rate- and credit-cycle sensitive.',
    tickers: ['C', 'JPM', 'AXP'],
  },
  {
    id: 'ai-power',
    label: 'AI / data-center power',
    description:
      'Semis, power, storage, and infrastructure tied to AI capex sentiment across sectors.',
    tickers: ['NVDA', 'TSM', 'OKLO', 'CEG', 'EOSE', 'RVI', 'NEE', 'QQQ', 'PLD'],
  },
  {
    id: 'international',
    label: 'International equity',
    description: 'Developed, emerging, and overseas semis; CGW adds global exposure.',
    tickers: ['VEA', 'VWO', 'TSM', 'CGW'],
  },
  {
    id: 'speculative',
    label: 'Speculative sleeve',
    description: 'High-volatility names — small in dollars, contained by design.',
    tickers: ['EOSE', 'OKLO', 'RVI'],
  },
];
