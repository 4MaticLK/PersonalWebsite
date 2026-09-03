// Trading comparables for the Goodyear valuation, struck as of the report's valuation date
// (May 2, 2025) on FY2024 reported financials, so the comps and the DCF describe the same moment.
//
// Prices: Yahoo Finance daily close on 2025-05-02, unadjusted for later corporate actions.
// Fundamentals: each company's own FY2024 results disclosure (see `source` per row); Goodyear's
// figures come from the valuation workbook's FactSet Fundamentals pull, the same data behind the DCF.
//
// Multiples are ratios, so they compare across reporting currencies without translation. Absolute
// figures stay in each company's reporting currency and are never summed across rows.

export interface GoodyearCompRow {
  name: string;
  ticker: string;
  currency: 'USD' | 'EUR' | 'JPY';
  /** Close on 2025-05-02 in reporting currency, as traded that day. */
  price: number;
  /** Shares outstanding/diluted, millions. */
  shares: number;
  /** FY2024 revenue, millions of reporting currency. */
  revenue: number;
  /** FY2024 EBITDA, millions. Adjusted/segment EBITDA where that is the company's headline measure. */
  ebitda: number;
  /** FY2024 earnings per share, reporting currency. */
  eps: number;
  /** Net debt at Dec 31, 2024, millions. Negative would mean net cash. */
  netDebt: number;
  /** How EBITDA is defined for this row, since the headline measure differs by company. */
  ebitdaBasis: string;
  source: string;
  /** Shown as a caveat chip when the row is not a clean pure-play tire comparison. */
  caveat?: string;
}

export const GOODYEAR_COMPS_AS_OF = 'May 2, 2025';
export const GOODYEAR_COMPS_FINANCIALS_AS_OF = 'FY2024 (year ended Dec 31, 2024)';

export const GOODYEAR_COMPS: GoodyearCompRow[] = [
  {
    name: 'Goodyear Tire & Rubber',
    ticker: 'GT',
    currency: 'USD',
    price: 11.01,
    shares: 288,
    revenue: 18878,
    ebitda: 1822,
    eps: 0.2431,
    netDebt: 7922,
    ebitdaBasis: 'EBIT + D&A',
    source: 'Valuation workbook (FactSet Fundamentals)',
  },
  {
    name: 'Michelin',
    ticker: 'ML.PA',
    currency: 'EUR',
    price: 32.7,
    shares: 713.2,
    revenue: 27193,
    ebitda: 5361,
    eps: 2.65,
    netDebt: 3112,
    ebitdaBasis: 'Segment EBITDA',
    source: 'Michelin FY2024 results release, Feb 12 2025',
  },
  {
    name: 'Bridgestone',
    ticker: '5108.T',
    currency: 'JPY',
    price: 6022,
    shares: 684.8,
    revenue: 4430100,
    ebitda: 831361,
    eps: 416.19,
    netDebt: 21000,
    ebitdaBasis: 'Adjusted operating profit + D&A',
    source: 'Bridgestone FY2024 consolidated results, Feb 17 2025',
    caveat: 'Price and share count pre the 2:1 split of Dec 29, 2025',
  },
  {
    name: 'Continental',
    ticker: 'CON.DE',
    currency: 'EUR',
    price: 53.26,
    shares: 200.006,
    revenue: 39652,
    ebitda: 4498,
    eps: 5.78,
    netDebt: 3889,
    ebitdaBasis: 'Reported EBITDA',
    source: 'Continental FY2024 results, Mar 4 2025',
    caveat: 'Group figures include Automotive and ContiTech, not tires alone',
  },
  {
    name: 'Pirelli',
    ticker: 'PIRC.MI',
    currency: 'EUR',
    price: 5.53,
    shares: 1000,
    revenue: 6773.3,
    ebitda: 1516.4,
    eps: 0.5011,
    netDebt: 1925.8,
    ebitdaBasis: 'Adjusted EBITDA',
    source: 'Pirelli FY2024 preliminary results, Feb 26 2025',
  },
];

export interface GoodyearCompMultiples extends GoodyearCompRow {
  marketCap: number;
  enterpriseValue: number;
  evSales: number;
  evEbitda: number;
  pe: number;
  ebitdaMargin: number;
  netDebtEbitda: number;
}

export function computeCompMultiples(row: GoodyearCompRow): GoodyearCompMultiples {
  const marketCap = row.price * row.shares;
  const enterpriseValue = marketCap + row.netDebt;
  return {
    ...row,
    marketCap,
    enterpriseValue,
    evSales: enterpriseValue / row.revenue,
    evEbitda: enterpriseValue / row.ebitda,
    pe: row.price / row.eps,
    ebitdaMargin: row.ebitda / row.revenue,
    netDebtEbitda: row.netDebt / row.ebitda,
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface GoodyearCompsSummary {
  goodyear: GoodyearCompMultiples;
  peers: GoodyearCompMultiples[];
  peerMedian: {
    evSales: number;
    evEbitda: number;
    pe: number;
    ebitdaMargin: number;
    netDebtEbitda: number;
  };
  /** What GT's equity is worth per share if it traded at the peer median EV/EBITDA. */
  impliedPriceAtPeerEvEbitda: number;
}

export function goodyearCompsSummary(): GoodyearCompsSummary {
  const all = GOODYEAR_COMPS.map(computeCompMultiples);
  const goodyear = all.find((r) => r.ticker === 'GT')!;
  const peers = all.filter((r) => r.ticker !== 'GT');

  const peerMedian = {
    evSales: median(peers.map((p) => p.evSales)),
    evEbitda: median(peers.map((p) => p.evEbitda)),
    pe: median(peers.map((p) => p.pe)),
    ebitdaMargin: median(peers.map((p) => p.ebitdaMargin)),
    netDebtEbitda: median(peers.map((p) => p.netDebtEbitda)),
  };

  const impliedEv = peerMedian.evEbitda * goodyear.ebitda;
  const impliedPriceAtPeerEvEbitda = (impliedEv - goodyear.netDebt) / goodyear.shares;

  return { goodyear, peers, peerMedian, impliedPriceAtPeerEvEbitda };
}
