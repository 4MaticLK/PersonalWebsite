import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useActiveSection } from '../hooks/useActiveSection';
import { SITE_DEFAULT_TITLE } from '../constants/site';
import { BusinessCard } from './BusinessCard';
import { ExperienceSection } from './ExperienceSection';

const NAV_LINKS: { href: string; label: string }[] = [
  { href: '#card', label: 'Contact' },
  { href: '#summary', label: 'Summary' },
  { href: '#work-experience', label: 'Work Experience' },
  { href: '#academic-projects', label: 'Academic Projects' },
  { href: '#skills-and-activities', label: 'Skills & Activities' },
];

export function Layout() {
  const location = useLocation();
  const { revealRef: cardRevealRef, isVisible: cardVisible } = useScrollReveal();
  const activeSection = useActiveSection();

  useEffect(() => {
    document.title = SITE_DEFAULT_TITLE;
  }, []);

  // When navigating to a section via hash (nav link or Back to Academic Projects), scroll so section top (and header) is in view
  useEffect(() => {
    const hash = location.hash?.slice(1);
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    const scrollEl = el.querySelector<HTMLElement>('.page-section__scroll');
    if (scrollEl) scrollEl.scrollTop = 0;
    const navHeight = 52; // match --nav-height (3.25rem)

    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY - navHeight;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  }, [location.pathname, location.hash]);

  return (
    <>
      <nav className="site-nav" aria-label="Main navigation">
        {NAV_LINKS.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className={
              activeSection === href.slice(1)
                ? 'site-nav__link site-nav__link--active'
                : 'site-nav__link'
            }
            aria-current={activeSection === href.slice(1) ? 'true' : undefined}
            onClick={() => {
              const id = href.startsWith('#') ? href.slice(1) : '';
              if (id) {
                document
                  .getElementById(id)
                  ?.querySelector<HTMLElement>('.page-section__scroll')
                  ?.scrollTo(0, 0);
              }
            }}
          >
            {label}
          </a>
        ))}
      </nav>
      <main>
        <section
          id="card"
          ref={cardRevealRef}
          className={`page-section page-section--fullscreen page-section--card scroll-reveal ${cardVisible ? 'scroll-reveal--visible' : ''}`}
        >
          <div className="page-section__scroll">
            <BusinessCard />
          </div>
        </section>
        <ExperienceSection />
      </main>
    </>
  );
}
