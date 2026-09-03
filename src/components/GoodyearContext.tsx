const PEERS = ['Michelin', 'Bridgestone', 'Continental'];

const RISKS = [
  {
    title: 'Cyclicality',
    detail:
      'Results track global vehicle demand and consumer spending — an economic slowdown reduces tire replacement and OE volumes.',
  },
  {
    title: 'Raw material volatility',
    detail:
      'Rubber, steel, and oil-based inputs are a major cost base; price swings can pressure margins faster than pricing can adjust.',
  },
  {
    title: 'Leverage & rates',
    detail:
      'Net debt of ~$7.92B (Dec 2024) makes interest expense and refinancing sensitive to the rate environment and limits flexibility.',
  },
  {
    title: 'FX exposure',
    detail:
      'Sales across North America, Europe, and Asia expose reported earnings to currency movements.',
  },
  {
    title: 'Seasonality & weather',
    detail:
      "Winter-tire demand is weather-driven; a mild winter can shift or reduce a season's sales.",
  },
  {
    title: 'EV transition',
    detail:
      'Shifting mobility trends and EV-specific tire requirements require continued product investment.',
  },
];

export function GoodyearContext() {
  return (
    <div className="project-page__section goodyear-context">
      <h2 className="project-page__assumptions-heading">Company &amp; industry</h2>
      <div className="goodyear-context__grid">
        <div className="goodyear-context__prose">
          <p className="project-page__body-p">
            Goodyear was founded in 1898 and has traded on the NYSE/Nasdaq under ticker{' '}
            <strong>GT</strong> since its 1927 IPO — closing as high as ~$56.70 in March 1998 before
            a long decline tied to a cyclical auto market and macro headwinds. In June 2021,
            Goodyear closed its acquisition of Cooper Tire in a deal valued at roughly $2.5B, funded
            partly with incremental debt — the step-up visible in the debt chart below — in exchange
            for greater scale and a stronger North American position.
          </p>
          <p className="project-page__body-p">
            Leadership changed hands in January 2024: <strong>Mark Stewart</strong>, previously COO
            of North America at Stellantis, became CEO and President, succeeding{' '}
            <strong>Richard J. Kramer</strong>, who stayed on as senior advisor through mid-2024.
            Stewart's operating background lines up with Goodyear's current priorities — execution,
            margin recovery, and cash generation in a capital-intensive, cyclical industry.
          </p>
        </div>
        <div className="goodyear-context__side">
          <div className="goodyear-context__peers">
            <span className="goodyear-context__side-label">Named competitors</span>
            <div className="ma-project__hero-chips">
              {PEERS.map((p) => (
                <span key={p} className="ma-project__chip ma-project__chip--muted">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <h3 className="project-page__table-title goodyear-context__risks-heading">Key risks</h3>
      <ul className="goodyear-risks">
        {RISKS.map((r) => (
          <li key={r.title} className="goodyear-risks__item">
            <span className="goodyear-risks__title">{r.title}</span>
            <span className="goodyear-risks__detail">{r.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
