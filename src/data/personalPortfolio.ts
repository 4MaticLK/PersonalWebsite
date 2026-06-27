/** Metadata and copy for the live portfolio tracker section. */

export const PERSONAL_PORTFOLIO = {
  /** Fallback when meta.json is missing */
  fallbackAsOfDisplay: 'June 26, 2026',
  benchmarkName: 'SPY',

  /** Home page section */
  sectionTitle: 'Live Portfolio Tracker',
  sectionIntro:
    'My portfolio — live prices, allocation, benchmark comparison, and risk analytics.',

  /** Full /portfolio page */
  pageTitle: 'Live Portfolio Tracker',
  pageDescription:
    'My portfolio with live market data — holdings, allocation, thematic exposures, rebalancing bands, and risk analytics.',
  pageMeta: 'Live prices · Yahoo Finance · 24 positions',

  framingLead: 'This is my portfolio — not investment advice.',
  framingBody:
    'Live prices, allocation, benchmark comparison, and risk metrics for the full book.',

  disclaimer:
    'For education and demonstration. Past performance does not guarantee future results. Not investment advice.',

  homeCta: 'Explore analytics dashboard',
  experienceCta: 'Explore live tracker',

  /** Closed speculative / crypto tickers omitted from the public activity feed. */
  activityExcludedTickers: [
    'TRUMP',
    'DOGE',
    'CHIP',
    'XLM',
    'FORD',
    'BTC',
    'ETH',
    'T',
    'ETN',
    'HSBC',
  ] as const,

  dataPaths: {
    holdings: '/data/personal-portfolio/holdings.csv',
    transactions: '/data/personal-portfolio/transactions.csv',
    meta: '/data/personal-portfolio/meta.json',
  },
  quoteRefreshMs: 60_000,
} as const;
