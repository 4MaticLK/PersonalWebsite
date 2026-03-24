import { useEffect, useRef } from 'react';

const SECTION_IDS = [
  'card',
  'summary',
  'work-experience',
  'academic-projects',
  'skills-and-activities',
] as const;
const SCROLL_PADDING_TOP = 52; // match --nav-height (3.25rem)
const DEBOUNCE_MS = 120;

/**
 * After the user stops scrolling, smooth-scrolls to the nearest section so the section
 * header is visible and the whole section is in view from the top.
 */
export function useSmoothSectionSnap() {
  const isProgrammaticScroll = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const getSections = (): { id: string; top: number }[] => {
      return SECTION_IDS.map((id) => {
        const el = document.getElementById(id);
        const top = el ? el.getBoundingClientRect().top + window.scrollY : 0;
        return { id, top };
      });
    };

    const getTargetScroll = (s: { id: string; top: number }): number =>
      Math.max(0, s.top - SCROLL_PADDING_TOP);

    const snapToNearest = () => {
      const scrollY = window.scrollY;
      const sections = getSections();

      let nearest = sections[0];
      let nearestTarget = getTargetScroll(nearest);
      let nearestDist = Math.abs(nearestTarget - scrollY);

      for (let i = 1; i < sections.length; i++) {
        const target = getTargetScroll(sections[i]);
        const dist = Math.abs(target - scrollY);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = sections[i];
          nearestTarget = target;
        }
      }

      if (Math.abs(nearestTarget - scrollY) > 2) {
        isProgrammaticScroll.current = true;
        const sectionEl = document.getElementById(nearest.id);
        const scrollEl = sectionEl?.querySelector<HTMLElement>('.page-section__scroll');
        if (scrollEl) scrollEl.scrollTop = 0;
        window.scrollTo({ top: nearestTarget, behavior: 'smooth' });
        setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 800);
      }
    };

    const onScroll = () => {
      if (isProgrammaticScroll.current) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(snapToNearest, DEBOUNCE_MS);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);
}
