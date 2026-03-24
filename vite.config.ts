import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { PROJECTS } from './src/data/projects';
import { SITE_ORIGIN } from './src/constants/site';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function stripAbsoluteSeoTags(html: string): string {
  return html
    .replace(/\s*<link rel="canonical"[^>]*>\s*/g, '')
    .replace(/\s*<meta property="og:url"[^>]*>\s*/g, '')
    .replace(/\s*<meta property="og:image"[^>]*>\s*/g, '')
    .replace(/\s*<meta name="twitter:image"[^>]*>\s*/g, '');
}

export default defineConfig(({ command }) => {
  const originProduction = SITE_ORIGIN.trim().replace(/\/$/, '');
  const siteUrlForHtml = command === 'serve' ? 'http://localhost:5173' : originProduction || '';

  return {
    plugins: [
      react(),
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

          const urlEntries = ['/', ...PROJECTS.map((p) => `/work/${p.slug}`)]
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
