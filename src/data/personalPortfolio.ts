/** Metadata and copy for the live portfolio tracker section. */

export const PERSONAL_PORTFOLIO = {
  /** Fallback when meta.json is missing */
  fallbackAsOfDisplay: 'June 16, 2026',
  benchmarkName: 'SPY',

  /** Home page section */
  sectionTitle: 'Live Portfolio Tracker',
  sectionIntro:
    'A real Robinhood account connected to a custom analytics engine — live prices, allocation, benchmark comparison, and risk metrics.',

  /** Full /portfolio page */
  pageTitle: 'Live Portfolio Tracker',
  pageDescription:
    'Personal brokerage account wired to live market data. Explore current holdings, benchmark-relative performance, and risk analytics computed from transaction history.',
  pageMeta: 'Robinhood Individual · Built with React, Yahoo Finance, and FIFO cost-basis replay',

  framingLead:
    'This is a live dashboard on my own account — not a model portfolio or investment recommendation.',
  framingBody:
    'The emphasis is on the analytics: reconstructing returns from trades, comparing against SPY with the same timing, and measuring concentration and market sensitivity. Early trades included speculative names; the current book is concentrated in index ETFs, financials, and select growth positions.',

  disclaimer:
    'Personal account for education and demonstration. Past performance does not guarantee future results. Not investment advice.',

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
