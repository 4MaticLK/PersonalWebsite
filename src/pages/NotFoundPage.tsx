import { Link } from 'react-router-dom';
import { SITE_DEFAULT_TITLE, SITE_NAME } from '../constants/site';
import { useEffect } from 'react';

export function NotFoundPage() {
  useEffect(() => {
    document.title = `Page not found | ${SITE_NAME}`;
    return () => {
      document.title = SITE_DEFAULT_TITLE;
    };
  }, []);

  return (
    <div className="project-page">
      <nav className="project-page__nav" aria-label="Site navigation">
        <Link to="/" className="project-page__nav-back">
          <span className="project-page__nav-back-arrow" aria-hidden="true">
            ←
          </span>
          Home
        </Link>
      </nav>
      <main className="project-page__main">
        <h1 className="project-page__title">Page not found</h1>
        <p>That URL does not exist on this site.</p>
        <Link to="/" className="project-page__download">
          Back to home
        </Link>
      </main>
    </div>
  );
}
