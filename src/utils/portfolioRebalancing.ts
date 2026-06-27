import {
  PORTFOLIO_TARGET_WEIGHTS,
  REBALANCE_ABS_BAND_PCT,
  REBALANCE_REL_BAND,
} from '../data/portfolioTargets';
import type { HoldingRow } from './parsePersonalPortfolioCsv';

export type RebalanceAction = 'trim' | 'add' | 'hold';

export interface RebalanceRow {
  ticker: string;
  name: string;
  currentPct: number;
  targetPct: number;
  driftPct: number;
  action: RebalanceAction;
  triggered: boolean;
}

export interface RebalanceStatus {
  rows: RebalanceRow[];
  triggeredCount: number;
  inBandCount: number;
}

export function rebalanceTriggered(currentPct: number, targetPct: number): boolean {
  const drift = Math.abs(currentPct - targetPct);
  if (drift > REBALANCE_ABS_BAND_PCT) return true;
  if (targetPct > 0 && drift / targetPct > REBALANCE_REL_BAND) return true;
  return false;
}

export function rebalanceAction(currentPct: number, targetPct: number): RebalanceAction {
  if (!rebalanceTriggered(currentPct, targetPct)) return 'hold';
  return currentPct > targetPct ? 'trim' : 'add';
}

export function computeRebalanceStatus(holdings: HoldingRow[]): RebalanceStatus {
  const listed = holdings.filter((h) => h.ticker !== 'CASH' && h.ticker !== 'OTHER');
  const weightByTicker = new Map(listed.map((h) => [h.ticker, h.weightPct]));
  const nameByTicker = new Map(listed.map((h) => [h.ticker, h.name]));

  const tickers = [...new Set([...Object.keys(PORTFOLIO_TARGET_WEIGHTS), ...weightByTicker.keys()])];

  const rows: RebalanceRow[] = tickers
    .map((ticker) => {
      const currentPct = weightByTicker.get(ticker) ?? 0;
      const targetPct = PORTFOLIO_TARGET_WEIGHTS[ticker] ?? 0;
      const driftPct = currentPct - targetPct;
      const triggered = rebalanceTriggered(currentPct, targetPct);
      return {
        ticker,
        name: nameByTicker.get(ticker) ?? ticker,
        currentPct,
        targetPct,
        driftPct,
        action: rebalanceAction(currentPct, targetPct),
        triggered,
      };
    })
    .sort((a, b) => Math.abs(b.driftPct) - Math.abs(a.driftPct));

  return {
    rows,
    triggeredCount: rows.filter((r) => r.triggered).length,
    inBandCount: rows.filter((r) => !r.triggered).length,
  };
}
