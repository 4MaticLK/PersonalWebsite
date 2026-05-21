export function Fin285aChartShell({
  title,
  description,
  children,
  id,
  actions,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <article className="portfolio-chart fin285a-chart-card" aria-labelledby={id}>
      <div className="fin285a-chart-card__header">
        <div className="fin285a-chart-card__titles">
          <h3 id={id} className="portfolio-chart__title">
            {title}
          </h3>
          {description && <p className="portfolio-chart__caption">{description}</p>}
        </div>
        {actions ? <div className="fin285a-chart-card__actions">{actions}</div> : null}
      </div>
      {children}
    </article>
  );
}

export function Fin285aChartLoading({ label }: { label: string }) {
  return (
    <div className="portfolio-chart portfolio-chart--loading fin285a-chart-card">
      <p>Loading {label}…</p>
    </div>
  );
}

export function Fin285aChartError({ label }: { label: string }) {
  return (
    <div className="portfolio-chart portfolio-chart--error fin285a-chart-card">
      <p>
        Could not load <strong>{label}</strong>. Run{' '}
        <code>python scripts/export_fin285a_chart_data.py</code> and refresh.
      </p>
    </div>
  );
}
