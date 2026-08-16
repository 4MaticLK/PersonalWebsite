/** Used for <title> and Open Graph site name */
export const SITE_NAME = 'Levan Kvinikadze';

/** Default browser tab title on the home page. Must match the <title> and og:title in index.html,
 * otherwise React rewrites the tab title on mount and it visibly flickers. */
export const SITE_DEFAULT_TITLE = `${SITE_NAME} — Investments, valuation & portfolio`;

/**
 * Production origin only (no trailing slash), e.g. 'https://www.yourdomain.com'.
 * Used at build time for canonical URL, Open Graph / Twitter image URLs, sitemap, and robots.txt.
 * Replace the placeholder before deploying; local dev uses http://localhost:5173 for those tags instead.
 */
export const SITE_ORIGIN = 'https://www.levankvinikadze.com';
