import { PORTFOLIO_THEMES, type PortfolioTheme } from '../data/portfolioTargets';
import type { HoldingRow } from './parsePersonalPortfolioCsv';

export interface ThemeWeight {
  theme: PortfolioTheme;
  weightPct: number;
  tickersHeld: string[];
}

export function computeThemeWeights(holdings: HoldingRow[]): ThemeWeight[] {
  const weightByTicker = new Map<string, number>();
  for (const h of holdings) {
    if (h.ticker === 'CASH' || h.ticker === 'OTHER') continue;
    weightByTicker.set(h.ticker, h.weightPct);
  }

  return PORTFOLIO_THEMES.map((theme) => {
    let weightPct = 0;
    const tickersHeld: string[] = [];
    for (const ticker of theme.tickers) {
      const w = weightByTicker.get(ticker);
      if (w != null && w > 0) {
        weightPct += w;
        tickersHeld.push(ticker);
      }
    }
    return { theme, weightPct, tickersHeld };
  }).sort((a, b) => b.weightPct - a.weightPct);
}
