import {
  handleSuggestionsGet,
  handleSuggestionsPost,
} from './_portfolioSuggestionsStore';

type VercelRequest = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  setHeader(name: string, value: string): void;
  status(code: number): { json(body: unknown): void };
};

function parseBody(body: unknown): Record<string, unknown> {
  if (body == null) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof body === 'object') return body as Record<string, unknown>;
  return {};
}

function queryRecord(
  query: Record<string, string | string[] | undefined> | undefined
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  if (!query) return out;
  for (const [key, value] of Object.entries(query)) {
    out[key] = Array.isArray(value) ? value[0] : value;
  }
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const data = await handleSuggestionsGet(queryRecord(req.query));
      res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=60');
      return res.status(200).json(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not load suggestions.';
      const status = msg.includes('not found') ? 404 : 500;
      return res.status(status).json({ error: msg });
    }
  }

  if (req.method === 'POST') {
    const body = parseBody(req.body);
    try {
      const data = await handleSuggestionsPost(body, req.headers?.authorization);
      return res.status(201).json(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save suggestion.';
      const status = msg.includes('Not authorized') ? 401 : 400;
      return res.status(status).json({ error: msg });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
