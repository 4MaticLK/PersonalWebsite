import { useState, useCallback } from 'react';

const DEFAULT_OPTIONS: IntersectionObserverInit = {
  root: null,
  rootMargin: '0px 0px -40px 0px', // trigger when a bit above bottom of viewport
  threshold: 0.1,
};

/**
 * Returns a ref callback and whether the element is currently in the viewport.
 * Visibility tracks intersection so the fade-in runs every time you scroll to the section (up or down).
 */
export function useScrollReveal(options?: Partial<IntersectionObserverInit>) {
  const [isVisible, setIsVisible] = useState(false);

  const ref = useCallback(
    (el: HTMLElement | null) => {
      if (!el) {
        setIsVisible(false);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsVisible(entry.isIntersecting);
        },
        { ...DEFAULT_OPTIONS, ...options }
      );

      observer.observe(el);

      return () => {
        observer.disconnect();
      };
    },
    [options]
  );

  return { revealRef: ref, isVisible };
}
