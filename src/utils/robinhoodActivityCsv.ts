import type { TransactionRow } from './parsePersonalPortfolioCsv';

function parseNum(s: string): number {
  const cleaned = String(s)
    .replace(/[()$]/g, '')
    .replace(/,/g, '')
    .trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : NaN;
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

/** Parse CSV records with quoted fields that may span newlines (Robinhood export format). */
export function* parseCsvRecords(text: string): Generator<string[]> {
  const fields: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && ch === ',') {
      fields.push(field.trim());
      field = '';
      continue;
    }
    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      fields.push(field.trim());
      if (fields.some((f) => f.length)) yield [...fields];
      fields.length = 0;
      field = '';
      continue;
    }
    field += ch;
  }

  if (field.length || fields.length) {
    fields.push(field.trim());
    if (fields.some((f) => f.length)) yield fields;
  }
}

const SKIP_CODES = new Set([
  'INT',
  'GOLD',
  'GDBP',
  'GMPC',
  'SLIP',
  'DFEE',
  'FUTSWP',
  'MINT',
  'ITRF',
  'DTAX',
  'OASGN',
  'OEXCS',
  'OEXP',
  'BTO',
  'STC',
  'STO',
  'BTC',
]);

function mapTransCode(
  code: string,
  description: string,
  instrument: string,
  amount: number
): TransactionRow['type'] | null {
  const c = code.trim().toUpperCase();
  if (SKIP_CODES.has(c)) return null;

  if (c === 'BUY') return 'buy';
  if (c === 'SELL') return 'sell';
  if (c === 'CDIV' || c === 'SDIV' || c === 'DIV') return 'dividend';

  if (c === 'ACH' || c === 'RTP' || c === 'DEP' || c === 'MISC') {
    return amount >= 0 ? 'deposit' : 'withdrawal';
  }
  if (c === 'GACH' || c === 'WDL') return 'withdrawal';

  if (!instrument.trim()) {
    if (amount > 0) return 'deposit';
    if (amount < 0) return 'withdrawal';
  }

  if (/dividend reinvestment/i.test(description)) return 'buy';

  return null;
}

function normalizeAmount(type: TransactionRow['type'], raw: number): number {
  const abs = Math.abs(raw);
  switch (type) {
    case 'buy':
    case 'sell':
    case 'withdrawal':
      return -abs;
    case 'deposit':
    case 'dividend':
      return abs;
    default:
      return raw;
  }
}

function findHeaderIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate);
    if (idx >= 0) return idx;
  }
  return -1;
}

/** Parse a Robinhood Account activity report CSV into site transaction rows. */
export function parseRobinhoodActivityCsv(csvText: string): TransactionRow[] {
  const records = [...parseCsvRecords(csvText)];
  if (!records.length) return [];

  let headerIdx = -1;
  let headers: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i]!;
    const joined = row.join(',').toLowerCase();
    if (joined.includes('activity date') && joined.includes('trans code')) {
      headerIdx = i;
      headers = row;
      break;
    }
  }

  if (headerIdx < 0) {
    throw new Error(
      'Could not find Robinhood header row (expected Activity Date, Trans Code, …).'
    );
  }

  const idx = {
    date: findHeaderIndex(headers, ['activity_date']),
    code: findHeaderIndex(headers, ['trans_code']),
    ticker: findHeaderIndex(headers, ['instrument']),
    description: findHeaderIndex(headers, ['description']),
    shares: findHeaderIndex(headers, ['quantity']),
    price: findHeaderIndex(headers, ['price']),
    amount: findHeaderIndex(headers, ['amount']),
  };

  if (idx.date < 0 || idx.code < 0 || idx.amount < 0) {
    throw new Error('Robinhood CSV is missing required columns.');
  }

  const rows: TransactionRow[] = [];

  for (let i = headerIdx + 1; i < records.length; i++) {
    const parts = records[i]!;
    if (parts.every((p) => !p)) continue;

    const date = parseDateFlexible(parts[idx.date] ?? '');
    if (!date) continue;

    const rawAmount = parseNum(parts[idx.amount] ?? '');
    if (!Number.isFinite(rawAmount)) continue;

    const description = idx.description >= 0 ? parts[idx.description] ?? '' : '';
    const instrument = idx.ticker >= 0 ? parts[idx.ticker]?.trim().toUpperCase() ?? '' : '';
    const type = mapTransCode(parts[idx.code] ?? '', description, instrument, rawAmount);
    if (!type) continue;

    const sharesRaw = idx.shares >= 0 ? parts[idx.shares] : '';
    const priceRaw = idx.price >= 0 ? parts[idx.price] : '';
    const shares = sharesRaw?.trim() ? parseNum(sharesRaw) : null;
    const price = priceRaw?.trim() ? parseNum(priceRaw) : null;

    rows.push({
      date,
      type,
      ticker: instrument || '—',
      shares: shares != null && Number.isFinite(shares) ? shares : null,
      price: price != null && Number.isFinite(price) ? price : null,
      amount: normalizeAmount(type, rawAmount),
      notes: '',
    });
  }

  return rows.sort((a, b) => b.date.localeCompare(a.date));
}
