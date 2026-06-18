/** Map portfolio tickers to Yahoo Finance symbols. null = keep CSV price (no live feed). */
const YAHOO_SYMBOL: Record<string, string | null> = {
  CASH: null,
  OTHER: null,
  CHIP: null,
  TRUMP: null,
  BTC: 'BTC-USD',
  ETH: 'ETH-USD',
  DOGE: 'DOGE-USD',
  AVAX: 'AVAX-USD',
  XLM: 'XLM-USD',
};

export function toYahooSymbol(ticker: string): string | null {
  const key = ticker.trim().toUpperCase();
  if (key in YAHOO_SYMBOL) return YAHOO_SYMBOL[key];
  return key;
}

export function quotableTickers(tickers: string[]): string[] {
  const yahoo = new Set<string>();
  for (const t of tickers) {
    const sym = toYahooSymbol(t);
    if (sym) yahoo.add(sym);
  }
  return [...yahoo];
}

export type QuoteMap = Record<string, number>;

/** Map Yahoo symbol back to portfolio ticker (for crypto pairs). */
export function quotePriceForTicker(ticker: string, quotes: QuoteMap): number | null {
  const yahoo = toYahooSymbol(ticker);
  if (!yahoo) return null;
  const price = quotes[yahoo];
  return price != null && Number.isFinite(price) ? price : null;
}
