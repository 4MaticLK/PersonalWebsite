import { PERSONAL_PORTFOLIO } from '../../data/personalPortfolio';
import type { PortfolioAnalytics } from '../../utils/computePortfolioAnalytics';
import { formatPct } from '../../utils/parsePersonalPortfolioCsv';

interface PortfolioRiskFactorsProps {
  analytics: PortfolioAnalytics;
}

function RiskCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: 'high' | 'low' | 'neutral';
}) {
  const valueClass =
    highlight === 'high'
      ? 'personal-portfolio__risk-value personal-portfolio__risk-value--high'
      : highlight === 'low'
        ? 'personal-portfolio__risk-value personal-portfolio__risk-value--low'
        : 'personal-portfolio__risk-value';

  return (
    <div className="personal-portfolio__insight-card personal-portfolio__risk-card">
      <span className="personal-portfolio__insight-label">{label}</span>
      <span className={valueClass}>{value}</span>
      {sub != null && <span className="personal-portfolio__insight-sub">{sub}</span>}
    </div>
  );
}

function fmtRatio(n: number | null, digits = 2): string {
  return n == null || !Number.isFinite(n) ? '—' : n.toFixed(digits);
}

function fmtBeta(n: number | null): string {
  return n == null || !Number.isFinite(n) ? '—' : n.toFixed(2);
}

export function PortfolioRiskFactors({ analytics }: PortfolioRiskFactorsProps) {
  const benchmark = PERSONAL_PORTFOLIO.benchmarkName;
  const { risk } = analytics;

  const betaHighlight =
    risk.beta != null ? (risk.beta > 1.15 ? 'high' : risk.beta < 0.85 ? 'low' : 'neutral') : undefined;
  const volHighlight =
    risk.annualizedVolatilityPct != null
      ? risk.annualizedVolatilityPct > (risk.benchmarkVolatilityPct ?? 16) * 1.2
        ? 'high'
        : 'neutral'
      : undefined;

  return (
    <section
      className="personal-portfolio__risk"
      aria-labelledby="portfolio-risk-heading"
    >
      <h3 id="portfolio-risk-heading" className="personal-portfolio__insights-heading">
        Risk profile
      </h3>
      <p className="personal-portfolio__insights-caption">
        Current book sensitivity vs {benchmark}.
      </p>

      <div className="personal-portfolio__insights-grid personal-portfolio__risk-grid">
        <RiskCard
          label="Portfolio beta"
          value={fmtBeta(risk.beta)}
          sub={`Sensitivity to ${benchmark} moves`}
          highlight={betaHighlight}
        />
        <RiskCard
          label="Annualized volatility"
          value={
            risk.annualizedVolatilityPct != null
              ? formatPct(risk.annualizedVolatilityPct, 2)
              : '—'
          }
          sub={
            risk.benchmarkVolatilityPct != null
              ? `${benchmark} ${formatPct(risk.benchmarkVolatilityPct, 2)}`
              : undefined
          }
          highlight={volHighlight}
        />
        <RiskCard
          label="Sharpe ratio"
          value={fmtRatio(risk.sharpeRatio)}
          sub="Excess return per unit of volatility"
          highlight={
            risk.sharpeRatio != null
              ? risk.sharpeRatio >= 0.5
                ? 'low'
                : risk.sharpeRatio < 0
                  ? 'high'
                  : 'neutral'
              : undefined
          }
        />
        <RiskCard
          label="Top 3 holdings"
          value={formatPct(risk.top3WeightPct, 2)}
          sub="Combined portfolio weight"
          highlight={risk.top3WeightPct > 55 ? 'high' : undefined}
        />
        <RiskCard
          label="Effective holdings"
          value={risk.effectiveHoldings.toFixed(1)}
          sub="Diversification score · 1 = single stock"
          highlight={risk.effectiveHoldings < 6 ? 'high' : undefined}
        />
      </div>
    </section>
  );
}
