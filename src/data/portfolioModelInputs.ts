/** Long-run model inputs per holding (Section 3 of portfolio construction). */
export interface PortfolioModelInput {
  expReturnPct: number;
  volPct: number;
  beta: number;
}

export const PORTFOLIO_MODEL_ASSUMPTIONS = {
  marketVolPct: 15.5,
  riskFreePct: 4.3,
} as const;

export const BOND_TICKERS = new Set(['BND', 'GOVT', 'VTIP']);

/** Representative asset-class assumptions — not measured from price history. */
export const PORTFOLIO_MODEL_INPUTS: Record<string, PortfolioModelInput> = {
  VOO: { expReturnPct: 8.0, volPct: 15.5, beta: 1.0 },
  C: { expReturnPct: 8.0, volPct: 30, beta: 1.3 },
  VEA: { expReturnPct: 7.5, volPct: 17, beta: 0.9 },
  BND: { expReturnPct: 4.5, volPct: 5.5, beta: 0.02 },
  JPM: { expReturnPct: 8.0, volPct: 24, beta: 1.1 },
  AXP: { expReturnPct: 9.0, volPct: 27, beta: 1.2 },
  GOVT: { expReturnPct: 4.0, volPct: 5.0, beta: -0.05 },
  VWO: { expReturnPct: 8.0, volPct: 20, beta: 1.05 },
  NOC: { expReturnPct: 7.5, volPct: 22, beta: 0.7 },
  NVDA: { expReturnPct: 12.0, volPct: 45, beta: 1.7 },
  UNH: { expReturnPct: 8.0, volPct: 24, beta: 0.65 },
  LLY: { expReturnPct: 10.0, volPct: 28, beta: 0.55 },
  NEE: { expReturnPct: 7.5, volPct: 22, beta: 0.55 },
  TSM: { expReturnPct: 10.0, volPct: 32, beta: 1.2 },
  PLD: { expReturnPct: 7.5, volPct: 24, beta: 0.95 },
  PG: { expReturnPct: 6.5, volPct: 16, beta: 0.45 },
  CEG: { expReturnPct: 9.0, volPct: 35, beta: 0.9 },
  PHO: { expReturnPct: 8.0, volPct: 20, beta: 1.0 },
  CGW: { expReturnPct: 7.5, volPct: 18, beta: 0.95 },
  VTIP: { expReturnPct: 3.5, volPct: 2.5, beta: 0.0 },
  QQQ: { expReturnPct: 9.5, volPct: 19, beta: 1.15 },
  USMV: { expReturnPct: 7.0, volPct: 12, beta: 0.7 },
  GLD: { expReturnPct: 5.5, volPct: 15, beta: 0.05 },
  VOX: { expReturnPct: 8.5, volPct: 21, beta: 1.02 },
};
