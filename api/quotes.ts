import { fetchYahooQuotes } from './_yahooQuotes';

type VercelRequest = {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  setHeader(name: string, value: string): void;
  status(code: number): { json(body: unknown): void };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const raw = req.query?.symbols;
  const symbols =
    typeof raw === 'string'
      ? raw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  if (!symbols.length) {
    return res.status(400).json({ error: 'Query param "symbols" is required (comma-separated).' });
  }

  if (symbols.length > 40) {
    return res.status(400).json({ error: 'Too many symbols (max 40).' });
  }

  try {
    const { quotes, previousCloses } = await fetchYahooQuotes(symbols);
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
    return res.status(200).json({
      quotes,
      previousCloses,
      fetchedAt: new Date().toISOString(),
      source: 'Yahoo Finance',
    });
  } catch {
    return res.status(502).json({ error: 'Failed to fetch quotes from Yahoo Finance.' });
  }
}
