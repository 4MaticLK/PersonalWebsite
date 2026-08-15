import { useEffect, useRef, useState } from 'react';
import { PERSONAL_PORTFOLIO } from '../data/personalPortfolio';
import {
  parseHoldingsCsv,
  parseTransactionsCsv,
  normalizeHoldingsWeights,
  type HoldingRow,
  type NavHistoryRow,
  type TransactionRow,
  type PortfolioSummary,
} from '../utils/parsePersonalPortfolioCsv';
import {
  mergeLiveQuotesIntoHoldings,
  type LiveQuotesMeta,
} from '../utils/applyLiveQuotes';
import { fetchLiveQuotes, fetchChartHistory } from '../utils/fetchLiveQuotes';
import {
  analyticsToSummary,
  backtestSymbols,
  buildAvgCostMap,
  computePortfolioAnalytics,
  enrichHoldingsWithCostBasis,
  type PortfolioAnalytics,
} from '../utils/computePortfolioAnalytics';
import {
  computePortfolioModelAnalytics,
  type PortfolioModelAnalytics,
} from '../utils/computePortfolioModelAnalytics';
import { chartRangeForInception } from '../utils/chartRange';
import { quotableTickers, type QuoteMap } from '../utils/yahooSymbols';
import {
  defaultPortfolioMeta,
  parsePortfolioMeta,
  PORTFOLIO_META_PATH,
  type PortfolioMeta,
} from '../utils/portfolioMeta';

export type PersonalPortfolioStatus = 'loading' | 'ok' | 'error';

export interface PersonalPortfolioData {
  holdings: HoldingRow[];
  /** Computed time-weighted series (not read from CSV). */
  navHistory: NavHistoryRow[];
  transactions: TransactionRow[];
  summary: PortfolioSummary;
  analytics: PortfolioAnalytics;
  /** Single-index model estimates from long-run asset assumptions. */
  modelAnalytics: PortfolioModelAnalytics | null;
  liveQuotes: LiveQuotesMeta;
  /** Latest Yahoo prices keyed by symbol (includes sold tickers when live). */
  quotes: QuoteMap;
  meta: PortfolioMeta;
}

interface CsvSnapshot {
  holdings: HoldingRow[];
  transactions: TransactionRow[];
  statementValue: number;
  benchmarkHistory: { date: string; close: number }[];
  holdingsHistory: Map<string, { date: string; close: number }[]>;
}

async function fetchCsv(path: string): Promise<string> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.text();
}

function statementTotal(holdings: HoldingRow[]): number {
  return holdings
    .filter((h) => h.ticker !== 'CASH' && h.ticker !== 'OTHER')
    .reduce((s, h) => s + h.marketValue, 0);
}

function quoteTickersFromSnapshot(snapshot: CsvSnapshot): string[] {
  const tickers = new Set(snapshot.holdings.map((h) => h.ticker));
  for (const tx of snapshot.transactions) {
    if (tx.type === 'sell' && tx.ticker !== '—') tickers.add(tx.ticker);
  }
  return [...tickers];
}

function buildPortfolioData(
  snapshot: CsvSnapshot,
  holdings: HoldingRow[],
  liveQuotes: LiveQuotesMeta,
  meta: PortfolioMeta,
  quotes: QuoteMap = {},
  previousCloses?: QuoteMap,
  liveBenchmarkPrice?: number | null
): PersonalPortfolioData {
  const avgCost = buildAvgCostMap(snapshot.transactions);
  const holdingsWithCost = enrichHoldingsWithCostBasis(holdings, avgCost);

  const analytics = computePortfolioAnalytics(holdingsWithCost, snapshot.transactions, {
    benchmarkHistory: snapshot.benchmarkHistory,
    holdingsHistory: snapshot.holdingsHistory,
    previousCloses,
    liveBenchmarkPrice,
    statementValue: snapshot.statementValue,
  });

  return {
    holdings: holdingsWithCost,
    navHistory: analytics.navHistory,
    transactions: snapshot.transactions,
    summary: analyticsToSummary(analytics),
    analytics,
    modelAnalytics: computePortfolioModelAnalytics(holdingsWithCost),
    liveQuotes,
    quotes,
    meta,
  };
}

export function usePersonalPortfolioData(): {
  status: PersonalPortfolioStatus;
  data: PersonalPortfolioData | null;
} {
  const [status, setStatus] = useState<PersonalPortfolioStatus>('loading');
  const [data, setData] = useState<PersonalPortfolioData | null>(null);
  const csvSnapshotRef = useRef<CsvSnapshot | null>(null);
  const metaRef = useRef<PortfolioMeta>(defaultPortfolioMeta());

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    async function refreshQuotes() {
      const snapshot = csvSnapshotRef.current;
      if (!snapshot || cancelled) return;

      try {
        const tickers = quoteTickersFromSnapshot(snapshot);
        const symbols = [
          ...new Set([...quotableTickers(tickers), PERSONAL_PORTFOLIO.benchmarkName]),
        ];
        const { quotes, previousCloses, fetchedAt, source } = await fetchLiveQuotes(symbols);
        if (cancelled) return;

        const { holdings, meta } = mergeLiveQuotesIntoHoldings(snapshot.holdings, quotes);
        const liveQuotes: LiveQuotesMeta = {
          ...meta,
          fetchedAt,
          source,
        };
        const liveBenchmarkPrice = quotes[PERSONAL_PORTFOLIO.benchmarkName] ?? null;

        setData(
          buildPortfolioData(
            snapshot,
            holdings,
            liveQuotes,
            metaRef.current,
            quotes,
            previousCloses,
            liveBenchmarkPrice
          )
        );
      } catch {
        // Transient failure (network blip, rate limit): keep showing the last known-good
        // live quotes instead of flickering back to stale CSV prices. Next poll retries.
      }
    }

    async function load() {
      setStatus('loading');
      try {
        const [holdingsText, txText, metaText] = await Promise.all([
          fetchCsv(PERSONAL_PORTFOLIO.dataPaths.holdings),
          fetchCsv(PERSONAL_PORTFOLIO.dataPaths.transactions),
          fetch(PORTFOLIO_META_PATH).then(async (res) => (res.ok ? res.text() : null)),
        ]);

        if (cancelled) return;

        const parsedMeta = metaText
          ? parsePortfolioMeta(JSON.parse(metaText) as unknown)
          : null;
        metaRef.current = parsedMeta ?? defaultPortfolioMeta();

        const holdings = normalizeHoldingsWeights(parseHoldingsCsv(holdingsText));
        const transactions = parseTransactionsCsv(txText);

        if (!holdings.length || !transactions.length) {
          throw new Error('Missing holdings or transactions');
        }

        const sortedTx = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
        const inceptionDate = sortedTx[0]?.date ?? new Date().toISOString().slice(0, 10);
        const range = chartRangeForInception(inceptionDate);

        const holdingsHistory = new Map<string, { date: string; close: number }[]>();
        const [benchmarkHistory] = await Promise.all([
          fetchChartHistory(PERSONAL_PORTFOLIO.benchmarkName, range)
            .then((b) => b.history)
            .catch(() => [] as { date: string; close: number }[]),
          ...backtestSymbols(transactions).map(({ ticker, symbol }) =>
            fetchChartHistory(symbol, range)
              .then((res) => {
                if (res.history.length) holdingsHistory.set(ticker, res.history);
              })
              .catch(() => {
                /* skip tickers Yahoo can't price */
              })
          ),
        ]);

        if (cancelled) return;

        const snapshot: CsvSnapshot = {
          holdings,
          transactions,
          statementValue: statementTotal(holdings),
          benchmarkHistory,
          holdingsHistory,
        };
        csvSnapshotRef.current = snapshot;

        setData(
          buildPortfolioData(snapshot, holdings, {
            mode: 'csv',
            fetchedAt: null,
            source: 'Yahoo Finance',
            staticTickers: [],
          }, metaRef.current)
        );
        setStatus('ok');

        await refreshQuotes();
        if (cancelled) return;

        pollTimer = setInterval(refreshQuotes, PERSONAL_PORTFOLIO.quoteRefreshMs);
      } catch {
        if (!cancelled) {
          csvSnapshotRef.current = null;
          setData(null);
          setStatus('error');
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, []);

  return { status, data };
}
