/**
 * Parse Sheet 2.csv: Price History — Date, SPY Price, NOC Price, MCD Price.
 * Rows 1–2 are title/blank; row 3 is header; data from row 4.
 */

export interface PriceRow {
  date: string; // ISO YYYY-MM-DD for sorting/display
  spy: number;
  noc: number;
  mcd: number;
}

function parseNum(s: string): number {
  const cleaned = String(s).replace(/,/g, '').trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

/** Parse M/D/YYYY or M/D/YY to YYYY-MM-DD */
function parseDate(s: string): string | null {
  const trimmed = String(s).trim();
  if (!trimmed) return null;
  const parts = trimmed.split('/');
  if (parts.length !== 3) return null;
  let month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);
  if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(year)) return null;
  if (year < 100) year += 2000; // 25 -> 2025
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const yyyy = String(year);
  return `${yyyy}-${mm}-${dd}`;
}

export function parsePriceCsv(csvText: string): PriceRow[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim());
  const rows: PriceRow[] = [];
  let foundHeader = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const parts = line.split(',').map((p) => p.trim());

    if (!foundHeader) {
      if (line.toLowerCase().includes('date') && line.toLowerCase().includes('price')) {
        foundHeader = true;
      }
      continue;
    }

    if (parts.length < 4) continue;
    const dateStr = parseDate(parts[0]);
    const spy = parseNum(parts[1]);
    const noc = parseNum(parts[2]);
    const mcd = parseNum(parts[3]);
    if (dateStr == null || Number.isNaN(spy) || Number.isNaN(noc) || Number.isNaN(mcd)) continue;
    rows.push({ date: dateStr, spy, noc, mcd });
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows;
}

/** One row per period: date and % return vs previous period. First period is omitted (no previous price). */
export interface ReturnsRow {
  date: string;
  spyReturn: number;
  nocReturn: number;
  mcdReturn: number;
}

export function computeReturnsFromPrices(priceRows: PriceRow[]): ReturnsRow[] {
  const out: ReturnsRow[] = [];
  for (let i = 1; i < priceRows.length; i++) {
    const prev = priceRows[i - 1];
    const curr = priceRows[i];
    const spyReturn = prev.spy === 0 ? 0 : ((curr.spy - prev.spy) / prev.spy) * 100;
    const nocReturn = prev.noc === 0 ? 0 : ((curr.noc - prev.noc) / prev.noc) * 100;
    const mcdReturn = prev.mcd === 0 ? 0 : ((curr.mcd - prev.mcd) / prev.mcd) * 100;
    out.push({ date: curr.date, spyReturn, nocReturn, mcdReturn });
  }
  return out;
}
