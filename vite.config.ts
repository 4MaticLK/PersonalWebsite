import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { PROJECTS } from './src/data/projects';
import { SITE_ORIGIN } from './src/constants/site';
import { fetchYahooQuotes, fetchYahooChartHistory } from './api/_yahooQuotes.ts';
import {
  handleSuggestionsGet,
  handleSuggestionsPost,
} from './api/_portfolioSuggestionsStore.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function readRequestBody(req: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function yahooQuotesDevApi(): Plugin {
  return {
    name: 'yahoo-quotes-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/quotes', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Allow', 'GET');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const url = new URL(req.url ?? '/', 'http://localhost');
          const symbols = (url.searchParams.get('symbols') ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

          if (!symbols.length) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Query param "symbols" is required.' }));
            return;
          }

          const { quotes, previousCloses } = await fetchYahooQuotes(symbols);
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              quotes,
              previousCloses,
              fetchedAt: new Date().toISOString(),
              source: 'Yahoo Finance',
            })
          );
        } catch {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Failed to fetch quotes from Yahoo Finance.' }));
        }
      });

      server.middlewares.use('/api/chart', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Allow', 'GET');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const url = new URL(req.url ?? '/', 'http://localhost');
          const symbol = (url.searchParams.get('symbol') ?? '').trim().toUpperCase();
          const rangeParam = url.searchParams.get('range') ?? '2y';
          const range = ['6mo', '1y', '2y', '5y', 'max'].includes(rangeParam)
            ? (rangeParam as '6mo' | '1y' | '2y' | '5y' | 'max')
            : '2y';

          if (!symbol) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Query param "symbol" is required.' }));
            return;
          }

          const history = await fetchYahooChartHistory(symbol, range);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ symbol, range, history }));
        } catch {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Failed to fetch chart history.' }));
        }
      });

      server.middlewares.use('/api/portfolio-suggestions', async (req, res) => {
        const sendJson = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };

        if (req.method === 'GET') {
          try {
            const url = new URL(req.url ?? '/', 'http://localhost');
            const query: Record<string, string | undefined> = {};
            url.searchParams.forEach((value, key) => {
              query[key] = value;
            });
            const data = await handleSuggestionsGet(query);
            sendJson(200, data);
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Could not load suggestions.';
            sendJson(msg.includes('not found') ? 404 : 500, { error: msg });
          }
          return;
        }

        if (req.method === 'POST') {
          try {
            const raw = await readRequestBody(req);
            const body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
            const data = await handleSuggestionsPost(body, req.headers.authorization);
            sendJson(201, data);
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Could not save suggestion.';
            const status = msg.includes('Not authorized') ? 401 : 400;
            sendJson(status, { error: msg });
          }
          return;
        }

        res.statusCode = 405;
        res.setHeader('Allow', 'GET, POST');
        sendJson(405, { error: 'Method not allowed' });
      });
    },
  };
}

function stripAbsoluteSeoTags(html: string): string {
  return html
    .replace(/\s*<link rel="canonical"[^>]*>\s*/g, '')
    .replace(/\s*<meta property="og:url"[^>]*>\s*/g, '')
    .replace(/\s*<meta property="og:image"[^>]*>\s*/g, '')
    .replace(/\s*<meta name="twitter:image"[^>]*>\s*/g, '');
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.PORTFOLIO_SUGGESTIONS_ADMIN_TOKEN) {
    process.env.PORTFOLIO_SUGGESTIONS_ADMIN_TOKEN = env.PORTFOLIO_SUGGESTIONS_ADMIN_TOKEN;
  }

  const originProduction = SITE_ORIGIN.trim().replace(/\/$/, '');
  const siteUrlForHtml = command === 'serve' ? 'http://localhost:5173' : originProduction || '';

  return {
    plugins: [
      react(),
      ...(command === 'serve' ? [yahooQuotesDevApi()] : []),
      {
        name: 'site-url-seo-files',
        transformIndexHtml(html) {
          if (siteUrlForHtml) {
            return html.replace(/__SITE_URL__/g, siteUrlForHtml);
          }
          return stripAbsoluteSeoTags(html);
        },
        closeBundle() {
          const robotsAllow = 'User-agent: *\nAllow: /\n';
          const dist = resolve(__dirname, 'dist');

          if (!originProduction) {
            writeFileSync(resolve(dist, 'robots.txt'), robotsAllow);
            return;
          }

          const loc = (path: string) => `${originProduction}${path === '/' ? '/' : path}`;

          const urlEntries = ['/', '/portfolio', ...PROJECTS.map((p) => `/work/${p.slug}`)]
            .map((path) => `  <url>\n    <loc>${loc(path)}</loc>\n  </url>`)
            .join('\n');

          const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
          writeFileSync(resolve(dist, 'sitemap.xml'), sitemap);
          writeFileSync(
            resolve(dist, 'robots.txt'),
            `${robotsAllow}\nSitemap: ${originProduction}/sitemap.xml\n`
          );
        },
      },
    ],
  };
});
