import { fetchYahooQuotes } from '../../lib/yahooQuotes.ts';
import { buildAvgCostMap } from './computePortfolioAnalytics.ts';
import type { HoldingRow, TransactionRow } from './parsePersonalPortfolioCsv.ts';
import { quotableTickers, quotePriceForTicker } from './yahooSymbols.ts';

const DEFAULT_NAMES: Record<string, string> = {
  VOO: 'Vanguard S&P 500 ETF',
  VTIP: 'Vanguard Short-Term TIPS ETF',
  QQQ: 'Invesco QQQ Trust',
  NVDA: 'NVIDIA',
  JPM: 'JPMorgan Chase',
  C: 'Citigroup',
  AXP: 'American Express',
  NOC: 'Northrop Grumman',
  EOSE: 'Eos Energy Enterprises',
  OKLO: 'Oklo',
  RVI: 'Robinhood Ventures Fund I',
};

const DEFAULT_SECTORS: Record<string, string> = {
  VOO: 'US Equity',
  VTIP: 'Fixed Income',
  QQQ: 'US Equity',
  NVDA: 'Technology',
  JPM: 'Financials',
  C: 'Financials',
  AXP: 'Financials',
  NOC: 'Industrials',
  EOSE: 'Energy',
  OKLO: 'Energy',
  RVI: 'Private Markets',
};

function formatCsvNum(n: number, digits = 5): string {
  if (!Number.isFinite(n)) return '';
  const s = n.toFixed(digits);
  return s.replace(/\.?0+$/, '') || '0';
}

export function serializeHoldingsCsv(holdings: HoldingRow[]): string {
  const header = 'ticker,name,shares,cost_basis,current_price,market_value,weight_pct,sector';
  const lines = holdings.map((h) =>
    [
      h.ticker,
      h.name.includes(',') ? `"${h.name}"` : h.name,
      formatCsvNum(h.shares, 5),
      h.costBasis > 0 ? formatCsvNum(h.costBasis, 2) : '',
      h.currentPrice > 0 ? formatCsvNum(h.currentPrice, 2) : '',
      h.marketValue > 0 ? formatCsvNum(h.marketValue, 2) : '',
      h.weightPct > 0 ? formatCsvNum(h.weightPct, 2) : '',
      h.sector,
    ].join(',')
  );
  return [header, ...lines].join('\n') + '\n';
}

export function serializeTransactionsCsv(transactions: TransactionRow[]): string {
  const header = 'date,type,ticker,shares,price,amount';
  const lines = transactions.map((tx) => {
    const shares = tx.shares != null ? formatCsvNum(tx.shares, 8) : '';
    const price = tx.price != null ? formatCsvNum(tx.price, 2) : '';
    const amount = formatCsvNum(tx.amount, 2);
    return `${tx.date},${tx.type},${tx.ticker},${shares},${price},${amount}`;
  });
  return [header, ...lines].join('\n') + '\n';
}

/** Rebuild open holdings from FIFO lots; preserve names/sectors from prior file. */
export async function rebuildHoldingsFromTransactions(
  transactions: TransactionRow[],
  previousHoldings: HoldingRow[]
): Promise<HoldingRow[]> {
  const meta = new Map(
    previousHoldings.map((h) => [h.ticker, { name: h.name, sector: h.sector, fallbackPrice: h.currentPrice }])
  );

  const openLots = buildAvgCostMap(transactions);
  const tickers = [...openLots.entries()]
    .filter(([, lot]) => lot.shares > 1e-6)
    .map(([ticker]) => ticker)
    .sort();

  const yahooSymbols = quotableTickers(tickers);
  let quotes: Record<string, number> = {};
  if (yahooSymbols.length) {
    try {
      const res = await fetchYahooQuotes(yahooSymbols);
      quotes = res.quotes;
    } catch {
      /* fall back to CSV prices */
    }
  }

  const rows: HoldingRow[] = tickers.map((ticker) => {
    const lot = openLots.get(ticker)!;
    const prior = meta.get(ticker);
    const costBasis = lot.shares > 0 ? lot.totalCost / lot.shares : 0;
    const live = quotePriceForTicker(ticker, quotes);
    const currentPrice = live ?? prior?.fallbackPrice ?? 0;
    const marketValue = currentPrice > 0 ? lot.shares * currentPrice : 0;

    return {
      ticker,
      name: prior?.name ?? DEFAULT_NAMES[ticker] ?? ticker,
      shares: lot.shares,
      costBasis,
      currentPrice,
      marketValue,
      weightPct: 0,
      sector: prior?.sector ?? DEFAULT_SECTORS[ticker] ?? 'Other',
    };
  });

  const marketSum = rows.reduce((sum, h) => sum + h.marketValue, 0);
  if (marketSum <= 0) return rows;

  return rows.map((h) => ({
    ...h,
    weightPct: (h.marketValue / marketSum) * 100,
  }));
}
