import {
  goodyearCompsSummary,
  GOODYEAR_COMPS_AS_OF,
  GOODYEAR_COMPS_FINANCIALS_AS_OF,
  type GoodyearCompMultiples,
} from '../data/goodyearComps';

const CURRENCY_SYMBOL: Record<string, string> = { USD: '$', EUR: '€', JPY: '¥' };

function price(row: GoodyearCompMultiples): string {
  const symbol = CURRENCY_SYMBOL[row.currency] ?? '';
  return `${symbol}${row.price.toLocaleString(undefined, {
    minimumFractionDigits: row.currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: row.currency === 'JPY' ? 0 : 2,
  })}`;
}

export function GoodyearTradingComps() {
  const { goodyear, peers, peerMedian, impliedPriceAtPeerEvEbitda } = goodyearCompsSummary();
  const rows = [goodyear, ...peers];

  const evEbitdaPremium = goodyear.evEbitda / peerMedian.evEbitda - 1;
  const marginGap = peerMedian.ebitdaMargin - goodyear.ebitdaMargin;

  return (
    <div className="project-page__table-block goodyear-comps">
      <h3 className="project-page__table-title">Trading comparables</h3>

      <p className="goodyear-sparkline-note">
        Struck at the {GOODYEAR_COMPS_AS_OF} valuation date on {GOODYEAR_COMPS_FINANCIALS_AS_OF}{' '}
        financials, so the market cross-check describes the same moment as the DCF. Multiples are
        ratios and compare across reporting currencies without translation.
      </p>

      <div className="goodyear-sensitivity__scroll">
        <table className="project-page__table goodyear-comps__table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Price</th>
              <th>EV/Sales</th>
              <th>EV/EBITDA</th>
              <th>P/E</th>
              <th>EBITDA margin</th>
              <th>Net debt/EBITDA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.ticker}
                className={r.ticker === 'GT' ? 'goodyear-comps__row--subject' : undefined}
              >
                <td>
                  <span className="goodyear-comps__name">{r.name}</span>
                  <span className="goodyear-comps__ticker">{r.ticker}</span>
                </td>
                <td>{price(r)}</td>
                <td>{r.evSales.toFixed(2)}×</td>
                <td>{r.evEbitda.toFixed(2)}×</td>
                <td>{r.pe.toFixed(1)}×</td>
                <td>{(r.ebitdaMargin * 100).toFixed(1)}%</td>
                <td>{r.netDebtEbitda.toFixed(2)}×</td>
              </tr>
            ))}
            <tr className="goodyear-comps__row--median">
              <td>Peer median</td>
              <td>—</td>
              <td>{peerMedian.evSales.toFixed(2)}×</td>
              <td>{peerMedian.evEbitda.toFixed(2)}×</td>
              <td>{peerMedian.pe.toFixed(1)}×</td>
              <td>{(peerMedian.ebitdaMargin * 100).toFixed(1)}%</td>
              <td>{peerMedian.netDebtEbitda.toFixed(2)}×</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="project-page__body-p goodyear-comps__read">
        The two headline multiples point in opposite directions, and that is the whole finding.
        Goodyear looks <strong>cheap on sales</strong> ({goodyear.evSales.toFixed(2)}× against a{' '}
        {peerMedian.evSales.toFixed(2)}× peer median) but <strong>expensive on EBITDA</strong> (
        {goodyear.evEbitda.toFixed(2)}× against {peerMedian.evEbitda.toFixed(2)}×, a{' '}
        {(evEbitdaPremium * 100).toFixed(0)}% premium). The gap between those two readings is
        margin: Goodyear converts {(goodyear.ebitdaMargin * 100).toFixed(1)}% of revenue into EBITDA
        where the median peer converts {(peerMedian.ebitdaMargin * 100).toFixed(1)}%, a{' '}
        {(marginGap * 100).toFixed(1)}pp shortfall. Buying Goodyear on an EV/Sales screen is
        therefore a bet on that gap closing, not on the asset being mispriced today.
      </p>

      <div className="goodyear-comps__crosscheck">
        <div className="goodyear-comps__crosscheck-head">
          Cross-check: what the peer multiple implies
        </div>
        <div className="goodyear-comps__crosscheck-row">
          <div className="goodyear-comps__crosscheck-stat">
            <span className="goodyear-comps__crosscheck-value">
              ${impliedPriceAtPeerEvEbitda.toFixed(2)}
            </span>
            <span className="goodyear-comps__crosscheck-label">
              implied at peer median {peerMedian.evEbitda.toFixed(2)}× EV/EBITDA
            </span>
          </div>
          <div className="goodyear-comps__crosscheck-stat">
            <span className="goodyear-comps__crosscheck-value">${goodyear.price.toFixed(2)}</span>
            <span className="goodyear-comps__crosscheck-label">
              actual close, {GOODYEAR_COMPS_AS_OF}
            </span>
          </div>
          <div className="goodyear-comps__crosscheck-stat">
            <span className="goodyear-comps__crosscheck-value">$11.48</span>
            <span className="goodyear-comps__crosscheck-label">base-case DCF target</span>
          </div>
        </div>
        <p className="goodyear-comps__crosscheck-note">
          The multiple-based value sits far below both the market price and the DCF, and the reason
          is leverage rather than disagreement about the business. Goodyear carries{' '}
          {goodyear.netDebtEbitda.toFixed(2)}× net debt to EBITDA against a{' '}
          {peerMedian.netDebtEbitda.toFixed(2)}× peer median, so once the peer enterprise multiple
          is applied, almost all of the resulting enterprise value is absorbed by debt before equity
          holders are paid. The DCF reaches a higher number because it credits the margin recovery
          forecast through 2029; the comps price the margins Goodyear earns today. Holding both is
          the honest position — the spread between them <em>is</em> the investment case.
        </p>
      </div>

      <div className="goodyear-comps__sources">
        <span className="goodyear-comps__sources-head">Sources & definitions</span>
        <ul className="goodyear-comps__sources-list">
          {rows.map((r) => (
            <li key={r.ticker}>
              <strong>{r.name}</strong> — {r.ebitdaBasis}. {r.source}.
              {r.caveat ? <span className="goodyear-comps__caveat"> {r.caveat}.</span> : null}
            </li>
          ))}
          <li>
            Prices are the close on {GOODYEAR_COMPS_AS_OF} as traded that day (Yahoo Finance),
            before any later corporate actions. EBITDA definitions follow each company's own
            headline measure, which is why the basis is stated per row.
          </li>
        </ul>
      </div>
    </div>
  );
}
