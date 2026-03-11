import { useEffect, useRef, useState } from 'react';

const DEFAULT_OPTIONS: IntersectionObserverInit = {
  root: null,
  rootMargin: '0px 0px -40px 0px', // trigger when a bit above bottom of viewport
  threshold: 0.1,
};

/**
 * Returns a ref and whether the element has been revealed (entered viewport).
 * Add ref to the element and class "scroll-reveal scroll-reveal--visible" when isVisible.
 */
export function useScrollReveal(options?: Partial<IntersectionObserverInit>) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { ...DEFAULT_OPTIONS, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []); // options intentionally omitted to keep observer stable

  return { ref, isVisible };
}
