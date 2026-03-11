/**
 * Parse Sheet 1.csv: Efficient Frontier (Std dev P, Exp Ret P) and Capital Allocation Line (Return, St Dev).
 */

export interface DataPoint {
  stdDev: number;
  return: number;
}

export interface FrontierData {
  frontier: DataPoint[];
  cal: DataPoint[];
}

function parsePct(s: string): number {
  const cleaned = String(s).replace(/%/g, '').trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

function parseRow(row: string): DataPoint | null {
  const parts = row.split(',').map((p) => p.trim());
  if (parts.length < 2) return null;
  const stdDev = parsePct(parts[0]);
  const ret = parsePct(parts[1]);
  if (Number.isNaN(stdDev) || Number.isNaN(ret)) return null;
  return { stdDev, return: ret };
}

/** CAL rows: first column = Return, second = St Dev */
function parseRowCal(row: string): DataPoint | null {
  const parts = row.split(',').map((p) => p.trim());
  if (parts.length < 2) return null;
  const ret = parsePct(parts[0]);
  const stdDev = parsePct(parts[1]);
  if (Number.isNaN(stdDev) || Number.isNaN(ret)) return null;
  return { stdDev, return: ret };
}

export function parseFrontierCsv(csvText: string): FrontierData {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const frontier: DataPoint[] = [];
  const cal: DataPoint[] = [];
  let phase: 'frontier' | 'skip' | 'cal' = 'frontier';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    if (phase === 'frontier') {
      if (lower.includes('std dev') || lower.includes('exp ret')) continue; // header
      const pt = parseRow(line);
      if (pt) {
        frontier.push(pt);
      } else if (frontier.length > 0) {
        phase = 'skip';
      }
      continue;
    }

    if (phase === 'skip') {
      if (lower.includes('capital') && lower.includes('line')) {
        phase = 'cal';
      }
      continue;
    }

    if (phase === 'cal') {
      if (lower.includes('return') && lower.includes('st dev')) continue; // CAL header
      const pt = parseRowCal(line); // CAL: col0 = Return, col1 = St Dev
      if (pt) {
        cal.push(pt);
      }
    }
  }

  return { frontier, cal };
}

/** Portfolio statistics derived from frontier and CAL for display */
export interface PortfolioStats {
  riskFreeRate: number;
  minVolatility: DataPoint;
  maxReturn: DataPoint;
  calSlope: number;
  /** Tangency portfolio: frontier point where CAL is tangent (max Sharpe) */
  tangency: DataPoint | null;
}

/** Epsilon for treating stdDev as zero (risk-free point) */
const NEAR_ZERO = 0.001;

export interface ComputePortfolioStatsOptions {
  /** Override risk-free rate (e.g. 4.23 for 4.23%). When set, used for RFR display and for tangency/CAL slope. */
  riskFreeRateOverride?: number;
}

export function computePortfolioStats(
  data: FrontierData,
  options?: ComputePortfolioStatsOptions
): PortfolioStats | null {
  if (data.frontier.length === 0 || data.cal.length === 0) return null;

  // Risk-free rate: use override if provided; else CAL point with smallest stdDev (should be ≈ 0). CAL format: (Return, St Dev).
  const rfPoint =
    data.cal.find((p) => p.stdDev <= NEAR_ZERO) ??
    data.cal.reduce((best, p) => (p.stdDev < best.stdDev ? p : best), data.cal[0]);
  const riskFreeRate = options?.riskFreeRateOverride ?? rfPoint.return;

  // Min volatility: frontier point with lowest stdDev
  const minVol = data.frontier.reduce((best, p) => (p.stdDev < best.stdDev ? p : best), data.frontier[0]);

  // Max return: frontier point with highest return
  const maxRet = data.frontier.reduce((best, p) => (p.return > best.return ? p : best), data.frontier[0]);

  // CAL slope = (E[R] - R_f) / σ for any point on the CAL. Use the CAL point with largest stdDev to avoid division by zero.
  const calRiskyPoint = data.cal.reduce((best, p) => (p.stdDev > best.stdDev ? p : best), data.cal[0]);
  const calSlope =
    calRiskyPoint.stdDev > NEAR_ZERO
      ? (calRiskyPoint.return - riskFreeRate) / calRiskyPoint.stdDev
      : 0;

  // Tangency: use the CAL endpoint (risky end of the line). That is where the CAL touches the frontier in the source model, so the dot and card match the drawn line (e.g. return 14.61%).
  const tangency = calRiskyPoint.stdDev > NEAR_ZERO ? calRiskyPoint : null;

  return { riskFreeRate, minVolatility: minVol, maxReturn: maxRet, calSlope, tangency };
}
