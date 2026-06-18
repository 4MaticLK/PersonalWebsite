import { quotableTickers, type QuoteMap } from './yahooSymbols';

export interface LiveQuotesResponse {
  quotes: QuoteMap;
  previousCloses: QuoteMap;
  fetchedAt: string;
  source: string;
}

export async function fetchLiveQuotes(tickers: string[]): Promise<LiveQuotesResponse> {
  const symbols = quotableTickers(tickers);
  if (!symbols.length) {
    throw new Error('No quotable symbols');
  }

  const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbols.join(','))}`);
  if (!res.ok) {
    throw new Error(`Quotes API responded with ${res.status}`);
  }
  return (await res.json()) as LiveQuotesResponse;
}

export interface ChartHistoryResponse {
  symbol: string;
  range: string;
  history: { date: string; close: number }[];
}

export async function fetchChartHistory(
  symbol: string,
  range: string
): Promise<ChartHistoryResponse> {
  const res = await fetch(
    `/api/chart?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`
  );
  if (!res.ok) {
    throw new Error(`Chart API responded with ${res.status}`);
  }
  return (await res.json()) as ChartHistoryResponse;
}
