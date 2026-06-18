/**
 * Parsers for personal portfolio CSV exports in public/data/personal-portfolio/.
 * Expected headers are documented in public/data/personal-portfolio/README.md.
 */

export interface HoldingRow {
  ticker: string;
  name: string;
  shares: number;
  costBasis: number;
  currentPrice: number;
  marketValue: number;
  weightPct: number;
  sector: string;
}

export interface NavHistoryRow {
  date: string;
  portfolioValue: number;
  cumulativeReturnPct: number;
  benchmarkReturnPct: number;
  /** Intraday / live quote extension (not from historical backtest). */
  isLive?: boolean;
}

export interface TransactionRow {
  date: string;
  type: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdrawal';
  ticker: string;
  shares: number | null;
  price: number | null;
  amount: number;
  notes: string;
}

export interface PortfolioSummary {
  totalValue: number;
  listedHoldingsValue: number;
  holdingsCoveragePct: number;
  totalCostBasis: number;
  costBasisAvailable: boolean;
  unrealizedGain: number;
  unrealizedGainPct: number;
  ytdReturnPct: number | null;
  inceptionReturnPct: number | null;
  benchmarkYtdReturnPct: number | null;
  benchmarkInceptionReturnPct: number | null;
  alphaSinceInceptionPct: number | null;
  maxDrawdownPct: number | null;
}

/** Infer full account value from Robinhood-style position weights (value ÷ weight%). */
export function inferAccountTotalValue(holdings: HoldingRow[]): number {
  const positioned = holdings.filter(
    (h) => h.ticker !== 'CASH' && h.weightPct > 0 && h.marketValue > 0
  );
  if (!positioned.length) {
    return holdings.reduce((sum, h) => sum + h.marketValue, 0);
  }
  const implied = positioned.map((h) => h.marketValue / (h.weightPct / 100));
  return implied.reduce((sum, v) => sum + v, 0) / implied.length;
}

/** Keep Robinhood portfolio % when the list is partial (weights sum below 100%). */
export function normalizeHoldingsWeights(holdings: HoldingRow[]): HoldingRow[] {
  const listed = holdings.filter((h) => h.ticker !== 'CASH');
  const weightSum = listed.reduce((sum, h) => sum + h.weightPct, 0);
  const marketSum = listed.reduce((sum, h) => sum + h.marketValue, 0);

  if (weightSum > 0 && weightSum < 99.5) {
    return listed;
  }

  if (marketSum <= 0) return listed;

  return listed.map((h) => ({
    ...h,
    weightPct: (h.marketValue / marketSum) * 100,
  }));
}

export function enrichHoldingsForAllocation(
  holdings: HoldingRow[],
  summary: PortfolioSummary
): HoldingRow[] {
  const listed = holdings.filter((h) => h.ticker !== 'CASH' && h.ticker !== 'OTHER');
  if (summary.holdingsCoveragePct >= 99.5) return listed;

  const missingWeight = 100 - summary.holdingsCoveragePct;
  const missingValue = Math.max(0, summary.totalValue - summary.listedHoldingsValue);
  if (missingWeight < 0.5) return listed;

  return [
    ...listed,
    {
      ticker: 'OTHER',
      name: 'Other holdings (not yet imported)',
      shares: 0,
      costBasis: 0,
      currentPrice: 0,
      marketValue: missingValue,
      weightPct: missingWeight,
      sector: 'Other',
    },
  ];
}

function parseNum(s: string): number {
  const cleaned = String(s).replace(/[$,%]/g, '').replace(/,/g, '').trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

function parseCsvLine(line: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  parts.push(current.trim());
  return parts;
}

function parseDateFlexible(s: string): string | null {
  const trimmed = String(s).trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parts = trimmed.split('/');
  if (parts.length !== 3) return null;
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);
  if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(year)) return null;
  if (year < 100) year += 2000;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
}

function findHeaderIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate);
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseWithHeader<T>(
  csvText: string,
  mapRow: (headers: string[], parts: string[]) => T | null
): T[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let headerIdx = -1;
  let headers: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const parts = parseCsvLine(lines[i]);
    if (parts.some((p) => p.startsWith('#'))) continue;
    const lower = parts.join(',').toLowerCase();
    if (lower.includes('ticker') || lower.includes('date') || lower.includes('portfolio')) {
      headerIdx = i;
      headers = parts;
      break;
    }
  }

  if (headerIdx < 0) return [];

  const rows: T[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const parts = parseCsvLine(lines[i]);
    if (parts.every((p) => !p) || parts[0]?.startsWith('#')) continue;
    const row = mapRow(headers, parts);
    if (row) rows.push(row);
  }
  return rows;
}

export function parseHoldingsCsv(csvText: string): HoldingRow[] {
  return parseWithHeader(csvText, (headers, parts) => {
    const idx = {
      ticker: findHeaderIndex(headers, ['ticker', 'symbol']),
      name: findHeaderIndex(headers, ['name', 'security']),
      shares: findHeaderIndex(headers, ['shares', 'quantity', 'qty']),
      costBasis: findHeaderIndex(headers, ['cost_basis', 'costbasis', 'avg_cost', 'average_cost']),
      currentPrice: findHeaderIndex(headers, ['current_price', 'price', 'last_price']),
      marketValue: findHeaderIndex(headers, ['market_value', 'value', 'marketvalue']),
      weightPct: findHeaderIndex(headers, ['weight_pct', 'weight', 'weight_percent', 'allocation_pct']),
      sector: findHeaderIndex(headers, ['sector', 'asset_class', 'category']),
    };
    if (idx.ticker < 0) return null;

    const ticker = parts[idx.ticker]?.trim();
    if (!ticker) return null;

    const shares = idx.shares >= 0 ? parseNum(parts[idx.shares]) : NaN;
    const costBasis = idx.costBasis >= 0 ? parseNum(parts[idx.costBasis]) : NaN;
    const currentPrice = idx.currentPrice >= 0 ? parseNum(parts[idx.currentPrice]) : NaN;
    let marketValue = idx.marketValue >= 0 ? parseNum(parts[idx.marketValue]) : NaN;
    if (!Number.isFinite(marketValue) && Number.isFinite(shares) && Number.isFinite(currentPrice)) {
      marketValue = shares * currentPrice;
    }

    const weightPct = idx.weightPct >= 0 ? parseNum(parts[idx.weightPct]) : NaN;

    return {
      ticker,
      name: idx.name >= 0 ? parts[idx.name]?.trim() ?? ticker : ticker,
      shares: Number.isFinite(shares) ? shares : 0,
      costBasis: Number.isFinite(costBasis) ? costBasis : 0,
      currentPrice: Number.isFinite(currentPrice) ? currentPrice : 0,
      marketValue: Number.isFinite(marketValue) ? marketValue : 0,
      weightPct: Number.isFinite(weightPct) ? weightPct : 0,
      sector: idx.sector >= 0 ? parts[idx.sector]?.trim() ?? 'Other' : 'Other',
    };
  });
}

function normalizeTransactionType(raw: string): TransactionRow['type'] {
  const t = raw.trim().toLowerCase();
  if (t === 'buy' || t === 'purchase') return 'buy';
  if (t === 'sell' || t === 'sale') return 'sell';
  if (t === 'dividend' || t === 'div') return 'dividend';
  if (t === 'deposit' || t === 'contribution') return 'deposit';
  if (t === 'withdrawal' || t === 'withdraw') return 'withdrawal';
  return 'buy';
}

export function parseTransactionsCsv(csvText: string): TransactionRow[] {
  const rows = parseWithHeader(csvText, (headers, parts) => {
    const idx = {
      date: findHeaderIndex(headers, ['date', 'trade_date']),
      type: findHeaderIndex(headers, ['type', 'action', 'side']),
      ticker: findHeaderIndex(headers, ['ticker', 'symbol']),
      shares: findHeaderIndex(headers, ['shares', 'quantity', 'qty']),
      price: findHeaderIndex(headers, ['price', 'fill_price']),
      amount: findHeaderIndex(headers, ['amount', 'total', 'proceeds']),
      notes: findHeaderIndex(headers, ['notes', 'memo', 'description']),
    };
    if (idx.date < 0 || idx.type < 0) return null;

    const date = parseDateFlexible(parts[idx.date] ?? '');
    if (!date) return null;

    const sharesRaw = idx.shares >= 0 ? parts[idx.shares] : '';
    const priceRaw = idx.price >= 0 ? parts[idx.price] : '';
    const shares = sharesRaw?.trim() ? parseNum(sharesRaw) : null;
    const price = priceRaw?.trim() ? parseNum(priceRaw) : null;
    const amount = idx.amount >= 0 ? parseNum(parts[idx.amount]) : NaN;
    if (!Number.isFinite(amount)) return null;

    return {
      date,
      type: normalizeTransactionType(parts[idx.type] ?? ''),
      ticker: idx.ticker >= 0 ? parts[idx.ticker]?.trim() ?? '—' : '—',
      shares: shares != null && Number.isFinite(shares) ? shares : null,
      price: price != null && Number.isFinite(price) ? price : null,
      amount,
      notes: idx.notes >= 0 ? parts[idx.notes]?.trim() ?? '' : '',
    };
  });

  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

export function formatCurrency(value: number, digits = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPct(value: number, digits = 2, signed = false): string {
  const prefix = signed && value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(digits)}%`;
}

export function formatSharePrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `$${value.toFixed(2)}`;
}

/** Share quantities: at least 2 decimals, up to 5 for fractional lots. */
export function formatShares(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5,
  }).format(value);
}

export function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatDateDisplay(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
