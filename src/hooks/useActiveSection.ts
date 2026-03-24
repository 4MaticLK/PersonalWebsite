import { useEffect, useState } from 'react';

const SECTION_IDS = [
  'card',
  'summary',
  'work-experience',
  'academic-projects',
  'skills-and-activities',
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

/**
 * Returns the id of the section currently in view (top of viewport).
 * Used to highlight the active nav link.
 */
export function useActiveSection(): SectionId | null {
  const [activeId, setActiveId] = useState<SectionId | null>(null);

  useEffect(() => {
    const check = () => {
      const viewportMid = typeof window !== 'undefined' ? window.innerHeight * 0.4 : 400;
      let current: SectionId | null = null;
      let bestTop = -Infinity;

      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        // Active = section whose top is in the upper viewport; prefer the one closest to top
        if (top <= viewportMid && top > bestTop) {
          bestTop = top;
          current = id;
        }
      }
      // Fallback: top of page use card; bottom use last section
      if (!current && SECTION_IDS.length) {
        const firstTop = document.getElementById(SECTION_IDS[0])?.getBoundingClientRect().top ?? 0;
        current = firstTop > 0 ? SECTION_IDS[0] : SECTION_IDS[SECTION_IDS.length - 1];
      }
      setActiveId((prev) => (prev !== current ? current : prev));
    };

    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  return activeId;
}
