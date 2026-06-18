import type { ClosedTrade, PositionPerformance } from './computePortfolioAnalytics';
import { isAnchorTicker } from './portfolioDisplay';
import { quotePriceForTicker, type QuoteMap } from './yahooSymbols';

export interface ClosedTradeHighlights {
  best: ClosedTrade | null;
  worst: ClosedTrade | null;
}

export function closedTradeHighlights(closedTrades: ClosedTrade[]): ClosedTradeHighlights {
  const tracked = closedTrades.filter((t) => t.tracked && t.costBasis > 0);
  if (!tracked.length) return { best: null, worst: null };

  let best = tracked[0]!;
  let worst = tracked[0]!;
  for (const trade of tracked) {
    if (trade.gainPct > best.gainPct) best = trade;
    if (trade.gainPct < worst.gainPct) worst = trade;
  }

  return { best, worst };
}

export interface AnchorEngineInsight {
  anchorWeightPct: number;
  engineWeightPct: number;
  anchorTodayPct: number | null;
  engineTodayPct: number | null;
  /** Share of today's absolute book move from single names (0–100). */
  engineShareOfDayMovePct: number | null;
}

export function anchorEngineInsight(positions: PositionPerformance[]): AnchorEngineInsight {
  let anchorWeightPct = 0;
  let engineWeightPct = 0;
  let anchorDayWeighted = 0;
  let engineDayWeighted = 0;

  for (const p of positions) {
    if (isAnchorTicker(p.ticker)) {
      anchorWeightPct += p.weightPct;
      if (p.dayChangePct != null) anchorDayWeighted += p.weightPct * p.dayChangePct;
    } else {
      engineWeightPct += p.weightPct;
      if (p.dayChangePct != null) engineDayWeighted += p.weightPct * p.dayChangePct;
    }
  }

  const anchorTodayPct = anchorWeightPct > 0 ? anchorDayWeighted / anchorWeightPct : null;
  const engineTodayPct = engineWeightPct > 0 ? engineDayWeighted / engineWeightPct : null;

  const totalAbsMove = Math.abs(anchorDayWeighted) + Math.abs(engineDayWeighted);
  const engineShareOfDayMovePct =
    totalAbsMove > 0.001 ? (Math.abs(engineDayWeighted) / totalAbsMove) * 100 : null;

  return {
    anchorWeightPct,
    engineWeightPct,
    anchorTodayPct,
    engineTodayPct,
    engineShareOfDayMovePct,
  };
}

export interface SoldTradeCounterfactual {
  ticker: string;
  sellDate: string;
  realizedGainPct: number;
  /** Appreciation from sell price to today's quote (%). */
  sinceSellPct: number;
}

export interface SoldTradeCounterfactualHighlights {
  leftOnTable: SoldTradeCounterfactual | null;
  timedExit: SoldTradeCounterfactual | null;
}

function closedTradeSinceSellPct(trade: ClosedTrade, quotes: QuoteMap): number | null {
  if (!trade.tracked || trade.sharesSold <= 0) return null;
  const current = quotePriceForTicker(trade.ticker, quotes);
  if (current == null) return null;
  const sellPrice = trade.proceeds / trade.sharesSold;
  if (sellPrice <= 0) return null;
  return (current / sellPrice - 1) * 100;
}

export function soldTradeCounterfactualHighlights(
  closedTrades: ClosedTrade[],
  quotes: QuoteMap
): SoldTradeCounterfactualHighlights {
  const withQuote: SoldTradeCounterfactual[] = [];

  for (const trade of closedTrades) {
    const sinceSellPct = closedTradeSinceSellPct(trade, quotes);
    if (sinceSellPct == null) continue;
    withQuote.push({
      ticker: trade.ticker,
      sellDate: trade.sellDate,
      realizedGainPct: trade.gainPct,
      sinceSellPct,
    });
  }

  let leftOnTable: SoldTradeCounterfactual | null = null;
  let timedExit: SoldTradeCounterfactual | null = null;

  for (const item of withQuote) {
    if (item.sinceSellPct > 0.01) {
      if (!leftOnTable || item.sinceSellPct > leftOnTable.sinceSellPct) {
        leftOnTable = item;
      }
    }
    if (item.sinceSellPct < -0.01) {
      if (!timedExit || item.sinceSellPct < timedExit.sinceSellPct) {
        timedExit = item;
      }
    }
  }

  return { leftOnTable, timedExit };
}
