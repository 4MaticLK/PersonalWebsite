/** Metadata and copy for the live portfolio tracker section. */

export const PERSONAL_PORTFOLIO = {
  benchmarkName: 'SPY',

  /** Home page section */
  sectionTitle: 'Live Portfolio Tracker',
  sectionIntro:
    'A hypothetical $100K model portfolio — live prices, allocation, benchmark comparison, and risk analytics.',

  /** Full /portfolio page */
  pageTitle: 'Live Portfolio Tracker',
  pageDescription:
    'A hypothetical $100K model portfolio with live market data — holdings, allocation, thematic exposures, rebalancing bands, and risk analytics.',
  pageMeta: 'Live prices · Yahoo Finance · 24 positions',

  framingLead: 'This is a hypothetical $100K model portfolio — not real capital, and not investment advice.',
  framingBody:
    'Live prices, allocation, benchmark comparison, and risk metrics for the full book.',

  disclaimer:
    'A hypothetical $100K model portfolio for education and demonstration — not real capital. Past performance does not guarantee future results. Not investment advice.',

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
