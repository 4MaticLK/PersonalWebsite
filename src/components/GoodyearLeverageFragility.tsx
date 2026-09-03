import {
  goodyearDcfBreakdown,
  GOODYEAR_DCF_NET_DEBT,
  GOODYEAR_WACC_BASE,
} from '../data/goodyearHistoricalData';

const SCENARIOS = [
  { key: 'bear', label: 'Bear', wacc: 0.08, terminalGrowth: 0.015 },
  { key: 'base', label: 'Base', wacc: GOODYEAR_WACC_BASE, terminalGrowth: 0.02 },
  { key: 'bull', label: 'Bull', wacc: 0.06, terminalGrowth: 0.03 },
] as const;

function usd(millions: number): string {
  return `$${(millions / 1000).toFixed(2)}B`;
}

function signedPct(fraction: number): string {
  const pct = fraction * 100;
  return `${pct >= 0 ? '+' : '−'}${Math.abs(pct).toFixed(1)}%`;
}

export function GoodyearLeverageFragility() {
  const rows = SCENARIOS.map((s) => ({ ...s, ...goodyearDcfBreakdown(s.wacc, s.terminalGrowth) }));
  const base = rows.find((r) => r.key === 'base')!;
  const bear = rows.find((r) => r.key === 'bear')!;

  const evSwing = bear.enterpriseValue / base.enterpriseValue - 1;
  const equitySwing = bear.equityValue / base.equityValue - 1;
  const amplification = equitySwing / evSwing;

  return (
    <div className="project-page__table-block goodyear-fragility">
      <h3 className="project-page__table-title">Why the scenario range is so wide</h3>

      <p className="goodyear-sparkline-note">
        The bear case is not a different forecast — it is the <em>same</em> five-year cash-flow
        stream discounted at 8% instead of 6.66%, with perpetuity growth 50bp lower. That moves
        enterprise value by {signedPct(evSwing)}. It moves the equity by {signedPct(equitySwing)}.
      </p>

      <div className="goodyear-fragility__headline">
        <div className="goodyear-fragility__stat">
          <span className="goodyear-fragility__stat-value">{signedPct(evSwing)}</span>
          <span className="goodyear-fragility__stat-label">enterprise value, base → bear</span>
        </div>
        <span className="goodyear-fragility__arrow" aria-hidden="true">
          →
        </span>
        <div className="goodyear-fragility__stat goodyear-fragility__stat--alarm">
          <span className="goodyear-fragility__stat-value">{signedPct(equitySwing)}</span>
          <span className="goodyear-fragility__stat-label">equity value, base → bear</span>
        </div>
        <div className="goodyear-fragility__stat goodyear-fragility__stat--factor">
          <span className="goodyear-fragility__stat-value">{amplification.toFixed(1)}×</span>
          <span className="goodyear-fragility__stat-label">amplification</span>
        </div>
      </div>

      <p className="project-page__body-p goodyear-fragility__prose">
        The cause is the {usd(GOODYEAR_DCF_NET_DEBT)} of net debt sitting ahead of shareholders.
        Debt is a fixed claim: it does not shrink when the discount rate rises, so the entire change
        in enterprise value lands on the equity stub underneath it. In the base case equity is only{' '}
        {(base.equityShare * 100).toFixed(0)}% of enterprise value; in the bear case that cushion
        compresses to {(bear.equityShare * 100).toFixed(0)}%, which is why a moderate repricing of
        the business reads as a near-wipeout of the stock.
      </p>

      <div className="goodyear-sensitivity__scroll">
        <table className="project-page__table goodyear-fragility__table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>WACC</th>
              <th>g</th>
              <th>Enterprise value</th>
              <th>− Net debt</th>
              <th>= Equity value</th>
              <th>Equity % of EV</th>
              <th>Per share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.key}
                className={r.key === 'base' ? 'goodyear-fragility__row--base' : undefined}
              >
                <td>{r.label}</td>
                <td>{(r.wacc * 100).toFixed(2)}%</td>
                <td>{(r.terminalGrowth * 100).toFixed(1)}%</td>
                <td>{usd(r.enterpriseValue)}</td>
                <td className="goodyear-fragility__debt">{usd(GOODYEAR_DCF_NET_DEBT)}</td>
                <td>{usd(r.equityValue)}</td>
                <td>{(r.equityShare * 100).toFixed(1)}%</td>
                <td>${r.pricePerShare.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="goodyear-sparkline-note goodyear-sparkline-note--legend">
        Net debt held constant at the Dec 2024 balance-sheet figure across scenarios. Terminal value
        is {(base.terminalShare * 100).toFixed(0)}% of base-case enterprise value, so the perpetuity
        assumptions carry most of the weight — the practical read is that this equity is a leveraged
        call on the cost of capital, not a stable value estimate.
      </p>
    </div>
  );
}
