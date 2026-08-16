import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useActiveSection } from '../hooks/useActiveSection';
import { SITE_DEFAULT_TITLE } from '../constants/site';
import { BusinessCard } from './BusinessCard';
import { ExperienceSection } from './ExperienceSection';
import { SuggestionsSection } from './SuggestionsSection';

const NAV_LINKS: { href: string; label: string }[] = [
  { href: '#card', label: 'Contact' },
  { href: '#summary', label: 'Summary' },
  { href: '#work-experience', label: 'Work Experience' },
  { href: '#investment-portfolio', label: 'Live Tracker' },
  { href: '#academic-projects', label: 'Academic Projects' },
  { href: '#certificates', label: 'Certificates' },
  { href: '#skills-and-activities', label: 'Skills & Activities' },
];

export function Layout() {
  const location = useLocation();
  const { revealRef: cardRevealRef, isVisible: cardVisible } = useScrollReveal();
  const activeSection = useActiveSection();
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Close the mobile menu on Escape, and if the viewport grows past the mobile breakpoint
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const mql = window.matchMedia('(min-width: 768px)');
    const onMqlChange = () => setMenuOpen(false);
    window.addEventListener('keydown', onKeyDown);
    mql.addEventListener('change', onMqlChange);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      mql.removeEventListener('change', onMqlChange);
    };
  }, [menuOpen]);

  return (
    <>
      <nav className="site-nav" aria-label="Main navigation">
        <button
          type="button"
          className="site-nav__toggle"
          aria-expanded={menuOpen}
          aria-controls="site-nav-links"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="site-nav__toggle-bar" aria-hidden="true" />
          <span className="site-nav__toggle-bar" aria-hidden="true" />
          <span className="site-nav__toggle-bar" aria-hidden="true" />
        </button>
        <div
          id="site-nav-links"
          className={`site-nav__links ${menuOpen ? 'site-nav__links--open' : ''}`}
        >
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
                setMenuOpen(false);
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
        </div>
      </nav>
      <main id="main-content" tabIndex={-1}>
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
        <SuggestionsSection boxSlug="home" className="site-suggestions--home" />
      </main>
    </>
  );
}
