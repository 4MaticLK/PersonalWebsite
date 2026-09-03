import {
  goodyearDcfPricePerShare,
  GOODYEAR_SENSITIVITY_GROWTH,
  GOODYEAR_SENSITIVITY_WACC,
  GOODYEAR_WACC_BASE,
} from '../data/goodyearHistoricalData';

const CURRENT_PRICE = 11.01;

function cellClass(price: number): string {
  const diff = (price - CURRENT_PRICE) / CURRENT_PRICE;
  if (diff >= 0.3) return 'goodyear-sensitivity__cell--strong-buy';
  if (diff >= 0) return 'goodyear-sensitivity__cell--buy';
  if (diff >= -0.3) return 'goodyear-sensitivity__cell--caution';
  return 'goodyear-sensitivity__cell--sell';
}

export function GoodyearSensitivityGrid() {
  return (
    <div className="project-page__table-block goodyear-sensitivity">
      <h3 className="project-page__table-title">
        Sensitivity: implied price per share (WACC × terminal growth)
      </h3>
      <p className="goodyear-sparkline-note">
        Same 5-year unlevered FCF forecast, repriced at each WACC/terminal-growth pair — this is
        what actually produces the bull ($30.96) and bear ($0.85) cases above. Because terminal
        value dominates enterprise value, price is highly sensitive to both inputs near the point
        where WACC and terminal growth converge.
      </p>
      <div className="goodyear-sensitivity__scroll">
        <table className="project-page__table goodyear-sensitivity__table">
          <thead>
            <tr>
              <th>WACC \ g</th>
              {GOODYEAR_SENSITIVITY_GROWTH.map((g) => (
                <th key={g}>{(g * 100).toFixed(1)}%</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GOODYEAR_SENSITIVITY_WACC.map((wacc) => (
              <tr key={wacc}>
                <td>
                  {(wacc * 100).toFixed(2)}%
                  {Math.abs(wacc - GOODYEAR_WACC_BASE) < 0.0005 ? (
                    <span className="goodyear-sensitivity__base-tag">base</span>
                  ) : null}
                </td>
                {GOODYEAR_SENSITIVITY_GROWTH.map((g) => {
                  const price = goodyearDcfPricePerShare(wacc, g);
                  return (
                    <td key={g} className={cellClass(price)}>
                      ${price.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="goodyear-sparkline-note goodyear-sparkline-note--legend">
        Green = above the $11.01 close (buy case) · red = below (sell case). Base case: WACC 6.66%,
        terminal growth 2.0%.
      </p>
    </div>
  );
}
