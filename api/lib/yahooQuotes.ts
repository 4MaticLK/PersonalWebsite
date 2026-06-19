export type QuoteMap = Record<string, number>;

export interface YahooQuote {
  price: number;
  previousClose: number | null;
}

export type YahooQuotesResult = {
  quotes: QuoteMap;
  previousCloses: QuoteMap;
};

async function fetchYahooChartQuote(symbol: string): Promise<YahooQuote | null> {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?interval=1m&range=1d&includePrePost=true`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PersonalPortfolio/1.0)',
    },
  });

  if (!res.ok) return null;

  const json = (await res.json()) as {
    chart?: {
      result?: Array<{
        meta?: {
          regularMarketPrice?: number;
          chartPreviousClose?: number;
          preMarketPrice?: number;
          postMarketPrice?: number;
        };
        timestamp?: number[];
        indicators?: { quote?: Array<{ close?: (number | null)[] }> };
      }>;
    };
  };

  const result = json.chart?.result?.[0];
  const meta = result?.meta;

  let lastIntraday: number | null = null;
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  for (let i = closes.length - 1; i >= 0; i--) {
    const close = closes[i];
    if (close != null && Number.isFinite(close)) {
      lastIntraday = close;
      break;
    }
  }

  const price =
    meta?.postMarketPrice ??
    meta?.preMarketPrice ??
    lastIntraday ??
    meta?.regularMarketPrice ??
    meta?.chartPreviousClose ??
    null;
  if (price == null || !Number.isFinite(price)) return null;

  const previousClose = meta?.chartPreviousClose ?? null;
  return {
    price,
    previousClose:
      previousClose != null && Number.isFinite(previousClose) ? previousClose : null,
  };
}

/** Fetch latest prices from Yahoo Finance chart API (v7 quote endpoint is restricted). */
export async function fetchYahooQuotes(yahooSymbols: string[]): Promise<YahooQuotesResult> {
  if (!yahooSymbols.length) return { quotes: {}, previousCloses: {} };

  const rows = await Promise.all(
    yahooSymbols.map(async (symbol) => ({
      symbol,
      quote: await fetchYahooChartQuote(symbol),
    }))
  );

  const quotes: QuoteMap = {};
  const previousCloses: QuoteMap = {};
  for (const { symbol, quote } of rows) {
    if (!quote) continue;
    quotes[symbol] = quote.price;
    if (quote.previousClose != null) {
      previousCloses[symbol] = quote.previousClose;
    }
  }

  if (!Object.keys(quotes).length) {
    throw new Error('No quotes returned from Yahoo Finance');
  }

  return { quotes, previousCloses };
}

export interface ChartHistoryPoint {
  date: string;
  close: number;
}

/** Daily closes from Yahoo chart API. */
export async function fetchYahooChartHistory(
  symbol: string,
  range: '6mo' | '1y' | '2y' | '5y' | 'max' = '2y'
): Promise<ChartHistoryPoint[]> {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?interval=1d&range=${range}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PersonalPortfolio/1.0)',
    },
  });

  if (!res.ok) return [];

  const json = (await res.json()) as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: { adjclose?: Array<{ adjclose?: (number | null)[] }> };
      }>;
    };
  };

  const result = json.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.adjclose?.[0]?.adjclose ?? [];

  const points: ChartHistoryPoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (close == null || !Number.isFinite(close)) continue;
    const date = new Date(timestamps[i]! * 1000).toISOString().slice(0, 10);
    points.push({ date, close });
  }

  return points;
}
