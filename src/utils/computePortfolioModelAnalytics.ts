import {
  BOND_TICKERS,
  PORTFOLIO_MODEL_ASSUMPTIONS,
  PORTFOLIO_MODEL_INPUTS,
} from '../data/portfolioModelInputs';
import type { HoldingRow } from './parsePersonalPortfolioCsv';

export interface ModelRiskContribution {
  ticker: string;
  riskSharePct: number;
  weightPct: number;
  riskPerDollarRatio: number;
}

export interface ModelStressScenario {
  label: string;
  movePct: number;
}

export interface PortfolioModelAnalytics {
  expectedReturnPct: number;
  volatilityPct: number;
  beta: number;
  sharpeRatio: number;
  equityWeightPct: number;
  bondWeightPct: number;
  typicalYearLowPct: number;
  typicalYearHighPct: number;
  badYearPct: number;
  riskContributions: ModelRiskContribution[];
  stressScenarios: ModelStressScenario[];
  coveragePct: number;
}

interface WeightedInput {
  ticker: string;
  weight: number;
  expReturn: number;
  vol: number;
  beta: number;
  idioVar: number;
}

export function computePortfolioModelAnalytics(
  holdings: HoldingRow[]
): PortfolioModelAnalytics | null {
  const listed = holdings.filter((h) => h.ticker !== 'CASH' && h.ticker !== 'OTHER');
  const total = listed.reduce((sum, h) => sum + h.marketValue, 0);
  if (total <= 0) return null;

  const sigmaM = PORTFOLIO_MODEL_ASSUMPTIONS.marketVolPct / 100;
  const rf = PORTFOLIO_MODEL_ASSUMPTIONS.riskFreePct / 100;
  const marketVar = sigmaM * sigmaM;

  const weighted: WeightedInput[] = [];
  let modeledWeight = 0;

  for (const h of listed) {
    const input = PORTFOLIO_MODEL_INPUTS[h.ticker];
    if (!input) continue;
    const weight = h.marketValue / total;
    modeledWeight += weight;
    const vol = input.volPct / 100;
    const beta = input.beta;
    const idioVar = Math.max(0, vol * vol - beta * beta * marketVar);
    weighted.push({
      ticker: h.ticker,
      weight,
      expReturn: input.expReturnPct / 100,
      vol,
      beta,
      idioVar,
    });
  }

  if (!weighted.length) return null;

  const beta = weighted.reduce((sum, x) => sum + x.weight * x.beta, 0);
  const expectedReturn = weighted.reduce((sum, x) => sum + x.weight * x.expReturn, 0);

  let equityWeight = 0;
  let bondWeight = 0;
  for (const x of weighted) {
    if (BOND_TICKERS.has(x.ticker)) bondWeight += x.weight;
    else equityWeight += x.weight;
  }

  const systematicVar = beta * beta * marketVar;
  const idioPortVar = weighted.reduce((sum, x) => sum + x.weight * x.weight * x.idioVar, 0);
  const portVar = systematicVar + idioPortVar;
  const portVol = Math.sqrt(portVar);
  const sharpeRatio = portVol > 0 ? (expectedReturn - rf) / portVol : 0;

  const varianceTerms = weighted.map((x) => {
    const marginalVar = x.beta * beta * marketVar + x.weight * x.idioVar;
    return { ticker: x.ticker, weight: x.weight, contribution: x.weight * marginalVar };
  });
  const totalVarContribution = varianceTerms.reduce((sum, x) => sum + x.contribution, 0);

  const riskContributions: ModelRiskContribution[] = varianceTerms
    .map(({ ticker, weight, contribution }) => ({
      ticker,
      weightPct: weight * 100,
      riskSharePct: totalVarContribution > 0 ? (contribution / totalVarContribution) * 100 : 0,
      riskPerDollarRatio: weight > 0 ? contribution / totalVarContribution / weight : 0,
    }))
    .sort((a, b) => b.riskSharePct - a.riskSharePct);

  const expectedReturnPct = expectedReturn * 100;
  const volatilityPct = portVol * 100;

  return {
    expectedReturnPct,
    volatilityPct,
    beta,
    sharpeRatio,
    equityWeightPct: equityWeight * 100,
    bondWeightPct: bondWeight * 100,
    typicalYearLowPct: expectedReturnPct - volatilityPct,
    typicalYearHighPct: expectedReturnPct + volatilityPct,
    badYearPct: expectedReturnPct - 2 * volatilityPct,
    riskContributions,
    stressScenarios: [
      { label: 'Equity bear (−30% market)', movePct: beta * -30 },
      { label: '2022-style (stocks & bonds fall)', movePct: -18 },
      { label: '2008-style crash (−37% market)', movePct: beta * -37 },
      { label: 'Strong bull (+20% market)', movePct: beta * 20 },
    ],
    coveragePct: modeledWeight * 100,
  };
}
