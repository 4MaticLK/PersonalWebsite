import { PERSONAL_PORTFOLIO } from '../../data/personalPortfolio';

export function PortfolioFraming() {
  return (
    <aside className="personal-portfolio__framing" aria-label="About this dashboard">
      <p className="personal-portfolio__framing-lead">{PERSONAL_PORTFOLIO.framingLead}</p>
      <p className="personal-portfolio__framing-body">{PERSONAL_PORTFOLIO.framingBody}</p>
    </aside>
  );
}
