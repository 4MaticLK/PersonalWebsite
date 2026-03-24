import { useEffect, useRef, useState } from 'react';

const DEFAULT_OPTIONS: IntersectionObserverInit = {
  root: null,
  rootMargin: '0px 0px -40px 0px', // trigger when a bit above bottom of viewport
  threshold: 0.1,
};

/**
 * Returns a ref and whether the element is currently in the viewport.
 * Visibility tracks intersection so the fade-in runs every time you scroll to the section (up or down).
 */
export function useScrollReveal(options?: Partial<IntersectionObserverInit>) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { ...DEFAULT_OPTIONS, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []); // options intentionally omitted to keep observer stable

  return { ref, isVisible };
}
