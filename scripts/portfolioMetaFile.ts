import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  defaultPortfolioMeta,
  mergePortfolioMeta,
  parsePortfolioMeta,
  type PortfolioMeta,
} from '../src/utils/portfolioMeta.ts';

export const PORTFOLIO_META_FILE = resolve(
  process.cwd(),
  'public/data/personal-portfolio/meta.json'
);

export function readPortfolioMetaFile(): PortfolioMeta | null {
  if (!existsSync(PORTFOLIO_META_FILE)) return null;
  try {
    const raw = JSON.parse(readFileSync(PORTFOLIO_META_FILE, 'utf8')) as unknown;
    return parsePortfolioMeta(raw);
  } catch {
    return null;
  }
}

export function writePortfolioMetaFile(patch: Partial<PortfolioMeta>): PortfolioMeta {
  const merged = mergePortfolioMeta(readPortfolioMetaFile(), patch);
  writeFileSync(PORTFOLIO_META_FILE, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  return merged;
}

export function portfolioAsOfFromTransactions(dates: string[]): string {
  if (!dates.length) return new Date().toISOString().slice(0, 10);
  return [...dates].sort((a, b) => b.localeCompare(a))[0]!;
}

export function ensurePortfolioMetaFile(): PortfolioMeta {
  const existing = readPortfolioMetaFile();
  if (existing) return existing;
  const meta = defaultPortfolioMeta();
  writeFileSync(PORTFOLIO_META_FILE, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
  return meta;
}
