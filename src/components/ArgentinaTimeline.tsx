import { useState } from 'react';
import { ARGENTINA_EPISODES } from '../data/argentinaHistoricalData';

export interface ArgentinaTimelineProps {
  hoveredEpisodeId: string | null;
  onHoverEpisode: (id: string | null) => void;
}

export function ArgentinaTimeline({ hoveredEpisodeId, onHoverEpisode }: ArgentinaTimelineProps) {
  const [openId, setOpenId] = useState<string | null>(ARGENTINA_EPISODES[0]?.id ?? null);

  return (
    <div className="argentina-timeline" role="list">
      {ARGENTINA_EPISODES.map((ep) => {
        const isOpen = openId === ep.id;
        const isHighlighted = hoveredEpisodeId === ep.id;
        return (
          <div
            key={ep.id}
            className={`argentina-timeline__item${isHighlighted ? ' argentina-timeline__item--highlighted' : ''}`}
            role="listitem"
            onMouseEnter={() => onHoverEpisode(ep.id)}
            onMouseLeave={() => onHoverEpisode(null)}
          >
            <div className="argentina-timeline__rail" aria-hidden="true">
              <span className="argentina-timeline__dot" />
              <span className="argentina-timeline__line" />
            </div>
            <div className="argentina-timeline__content">
              <button
                type="button"
                className="argentina-timeline__head"
                onClick={() => setOpenId(isOpen ? null : ep.id)}
                onFocus={() => onHoverEpisode(ep.id)}
                onBlur={() => onHoverEpisode(null)}
                aria-expanded={isOpen}
              >
                <span className="argentina-timeline__years">{ep.years}</span>
                <span className="argentina-timeline__title">{ep.title}</span>
                <span className="argentina-timeline__chevron" aria-hidden="true">
                  {isOpen ? '▼' : '▶'}
                </span>
              </button>
              <p className="argentina-timeline__summary">{ep.summary}</p>
              {isOpen && (
                <div className="argentina-timeline__body">
                  {ep.body.split(/\n\n+/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
