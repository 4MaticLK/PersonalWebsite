import { fetchYahooChartHistory } from '@personal-website/server-lib/yahooQuotes';

type VercelRequest = {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  setHeader(name: string, value: string): void;
  status(code: number): { json(body: unknown): void };
};

const VALID_RANGES = new Set(['6mo', '1y', '2y', '5y', 'max']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const symbolRaw = req.query?.symbol;
  const symbol = typeof symbolRaw === 'string' ? symbolRaw.trim().toUpperCase() : '';
  if (!symbol) {
    return res.status(400).json({ error: 'Query param "symbol" is required.' });
  }

  const rangeRaw = req.query?.range;
  const range =
    typeof rangeRaw === 'string' && VALID_RANGES.has(rangeRaw)
      ? (rangeRaw as '6mo' | '1y' | '2y' | '5y' | 'max')
      : '2y';

  try {
    const history = await fetchYahooChartHistory(symbol, range);
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ symbol, range, history });
  } catch {
    return res.status(502).json({ error: 'Failed to fetch chart history.' });
  }
}
