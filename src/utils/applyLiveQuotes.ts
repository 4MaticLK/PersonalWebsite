import {
  normalizeHoldingsWeights,
  type HoldingRow,
} from './parsePersonalPortfolioCsv';
import {
  quotePriceForTicker,
  quotableTickers,
  type QuoteMap,
} from './yahooSymbols';

export type LiveQuoteMode = 'live' | 'csv' | 'partial';

export interface LiveQuotesMeta {
  mode: LiveQuoteMode;
  fetchedAt: string | null;
  source: string;
  /** Tickers still using CSV because no Yahoo symbol or missing quote */
  staticTickers: string[];
}

export function mergeLiveQuotesIntoHoldings(
  holdings: HoldingRow[],
  quotes: QuoteMap
): { holdings: HoldingRow[]; meta: Pick<LiveQuotesMeta, 'mode' | 'staticTickers'> } {
  const staticTickers: string[] = [];

  const updated = holdings.map((h) => {
    if (h.ticker === 'CASH' || h.ticker === 'OTHER') return h;

    const livePrice = quotePriceForTicker(h.ticker, quotes);
    if (livePrice == null) {
      staticTickers.push(h.ticker);
      return h;
    }

    const marketValue = h.shares > 0 ? h.shares * livePrice : h.marketValue;
    return {
      ...h,
      currentPrice: livePrice,
      marketValue,
    };
  });

  const normalized = normalizeHoldingsWeights(updated);
  const investable = holdings.filter((h) => h.ticker !== 'CASH' && h.ticker !== 'OTHER');
  const quotableCount = quotableTickers(investable.map((h) => h.ticker)).length;

  let mode: LiveQuoteMode = 'csv';
  if (quotableCount > 0 && staticTickers.length === 0) mode = 'live';
  else if (staticTickers.length < investable.length) mode = 'partial';

  return { holdings: normalized, meta: { mode, staticTickers } };
}
