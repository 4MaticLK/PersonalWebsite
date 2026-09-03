import { useEffect, useState } from 'react';
import { fetchLiveQuotes } from '../utils/fetchLiveQuotes';

const GT_SYMBOL = 'GT';
const REFRESH_MS = 60_000;

export interface GoodyearLiveQuote {
  price: number;
  previousClose: number | null;
  fetchedAt: string;
  source: string;
}

export type GoodyearQuoteStatus = 'loading' | 'live' | 'unavailable';

/**
 * Live GT quote for the valuation page, so the price target is compared against the market
 * rather than only the May 2, 2025 close frozen into the report. Reuses the portfolio
 * tracker's /api/quotes route; falls back silently when the feed is unavailable.
 */
export function useGoodyearLiveQuote(enabled: boolean) {
  const [quote, setQuote] = useState<GoodyearLiveQuote | null>(null);
  const [status, setStatus] = useState<GoodyearQuoteStatus>('loading');

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function refresh() {
      try {
        const { quotes, previousCloses, fetchedAt, source } = await fetchLiveQuotes([GT_SYMBOL]);
        if (cancelled) return;

        const price = quotes[GT_SYMBOL];
        if (price == null || !Number.isFinite(price)) {
          setStatus('unavailable');
          return;
        }

        setQuote({
          price,
          previousClose: previousCloses[GT_SYMBOL] ?? null,
          fetchedAt,
          source,
        });
        setStatus('live');
      } catch {
        if (!cancelled) setStatus('unavailable');
      }
    }

    void refresh();
    const timer = setInterval(() => void refresh(), REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enabled]);

  return { quote, status };
}
