/** Target weights (% of total portfolio). Update here when allocation changes. */
export const PORTFOLIO_TARGET_WEIGHTS: Record<string, number> = {
  VOO: 11.0,
  BND: 10.0,
  VEA: 9.0,
  GOVT: 6.5,
  USMV: 5.5,
  AXP: 5.0,
  C: 5.0,
  JPM: 5.0,
  VWO: 4.5,
  GLD: 4.0,
  NOC: 4.0,
  LLY: 3.0,
  UNH: 3.0,
  NVDA: 2.5,
  PG: 2.5,
  PLD: 2.5,
  TSM: 2.5,
  VOX: 2.5,
  VTIP: 2.5,
  CGW: 2.0,
  NEE: 2.0,
  PHO: 2.0,
  QQQ: 2.0,
  CEG: 1.5,
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
    tickers: ['NVDA', 'TSM', 'CEG', 'NEE', 'QQQ', 'PLD'],
  },
  {
    id: 'international',
    label: 'International equity',
    description: 'Developed, emerging, and overseas semis; CGW adds global exposure.',
    tickers: ['VEA', 'VWO', 'TSM', 'CGW'],
  },
  {
    id: 'diversifiers',
    label: 'Diversifiers',
    description:
      'Added in the Aug 2026 rebalance specifically to cut beta, tracking error, and correlation to the market — low-vol equity, gold, and a sector this book had zero exposure to.',
    tickers: ['USMV', 'GLD', 'VOX'],
  },
];
