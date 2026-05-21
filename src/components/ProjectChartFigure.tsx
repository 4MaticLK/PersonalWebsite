import type { ProjectChartImage } from '../data/projects';

export interface ProjectChartFigureProps {
  item: ProjectChartImage;
  className?: string;
}

export function ProjectChartFigure({ item, className }: ProjectChartFigureProps) {
  const alt = item.caption ?? item.description ?? 'Project chart';

  return (
    <figure className={className ?? 'project-page__chart-fig'}>
      <img
        src={`/images/${encodeURIComponent(item.file)}`}
        alt={alt}
        className="project-page__chart-img"
      />
      {(item.caption != null || item.description != null) && (
        <figcaption className="project-page__chart-figcaption">
          {item.caption != null && (
            <span className="project-page__chart-caption">{item.caption}</span>
          )}
          {item.description != null && (
            <p className="project-page__chart-description">{item.description}</p>
          )}
        </figcaption>
      )}
    </figure>
  );
}
