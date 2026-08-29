import { useState } from 'react';
import { ArgentinaInflationChart } from './ArgentinaInflationChart';
import { ArgentinaFxChart } from './ArgentinaFxChart';
import { ArgentinaTimeline } from './ArgentinaTimeline';
import { ArgentinaFullPaper } from './ArgentinaFullPaper';

export function ArgentinaResearchPaperContent() {
  const [hoveredEpisodeId, setHoveredEpisodeId] = useState<string | null>(null);

  return (
    <>
      <section
        className="project-page__section project-page__section--charts"
        aria-labelledby="argentina-charts-heading"
      >
        <h2 id="argentina-charts-heading" className="project-page__charts-heading">
          The record, charted
        </h2>
        <p className="project-page__charts-note">
          Hover a chart or an episode below — they highlight each other.
        </p>
        <div className="portfolio-charts__grid">
          <ArgentinaInflationChart
            hoveredEpisodeId={hoveredEpisodeId}
            onHoverYear={setHoveredEpisodeId}
          />
          <ArgentinaFxChart
            hoveredEpisodeId={hoveredEpisodeId}
            onHoverYear={setHoveredEpisodeId}
          />
        </div>
      </section>

      <section
        className="project-page__section"
        aria-labelledby="argentina-timeline-heading"
      >
        <h2 id="argentina-timeline-heading" className="project-page__charts-heading">
          Seven episodes, one pattern
        </h2>
        <p className="argentina-timeline__intro">
          Each stabilization borrowed a different anchor. Click an episode to expand it, or hover to
          see it charted above.
        </p>
        <ArgentinaTimeline
          hoveredEpisodeId={hoveredEpisodeId}
          onHoverEpisode={setHoveredEpisodeId}
        />
      </section>

      <ArgentinaFullPaper />
    </>
  );
}
