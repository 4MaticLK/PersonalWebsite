/**
 * Parse Sheet 3.csv: SPY Return (market), NOC Return, MCD Return.
 * Header row: "SPY Return,NOC Return,MCD Return"; values as percentages e.g. "-5.86%".
 */

export interface RegressionRow {
  spyReturn: number; // market return %
  nocReturn: number;
  mcdReturn: number;
}

function parsePct(s: string): number {
  const cleaned = String(s).replace(/,/g, '').replace(/%/g, '').trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

export function parseRegressionCsv(csvText: string): RegressionRow[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim());
  const rows: RegressionRow[] = [];
  let headerSkipped = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const parts = line.split(',').map((p) => p.trim());

    if (!headerSkipped) {
      if (line.toLowerCase().includes('return')) {
        headerSkipped = true;
      }
      continue;
    }

    if (parts.length < 3) continue;
    const spyReturn = parsePct(parts[0]);
    const nocReturn = parsePct(parts[1]);
    const mcdReturn = parsePct(parts[2]);
    if (Number.isNaN(spyReturn) || Number.isNaN(nocReturn) || Number.isNaN(mcdReturn)) continue;
    rows.push({ spyReturn, nocReturn, mcdReturn });
  }

  return rows;
}
