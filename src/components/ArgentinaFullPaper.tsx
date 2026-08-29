import { useEffect, useRef, useState, type FormEvent } from 'react';
import { renderPdfPages } from '../utils/renderPdfPages';

const PAPER_PDF_URL = '/pdfs/Argentina_Rules_Without_Institutions.pdf';

type ViewerStatus = 'loading' | 'ready' | 'error';

export function ArgentinaFullPaper() {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<ViewerStatus>('loading');
  const [numPages, setNumPages] = useState(0);
  const [pageInput, setPageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<number[] | null>(null);
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const pagesRef = useRef<HTMLDivElement>(null);
  const pageTextsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!expanded) return;
    const container = pagesRef.current;
    if (!container) return;

    let cancelled = false;
    renderPdfPages(PAPER_PDF_URL, container, () => cancelled, 'argentina-paper__pdf-page')
      .then(({ numPages: n, pageTexts }) => {
        if (cancelled) return;
        setNumPages(n);
        pageTextsRef.current = pageTexts;
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [expanded]);

  const handleExpand = () => {
    setStatus('loading');
    setExpanded(true);
  };

  function scrollToPage(n: number) {
    const container = pagesRef.current;
    const el = container?.querySelector<HTMLElement>(`[data-page-number="${n}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleGoToPage(e: FormEvent) {
    e.preventDefault();
    const n = parseInt(pageInput, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= numPages) {
      scrollToPage(n);
    }
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchMatches(null);
      return;
    }
    const matches: number[] = [];
    pageTextsRef.current.forEach((text, i) => {
      if (text.includes(q)) matches.push(i + 1);
    });
    setSearchMatches(matches);
    setSearchMatchIndex(0);
    if (matches.length > 0) scrollToPage(matches[0]);
  }

  function goToMatch(delta: number) {
    if (!searchMatches || searchMatches.length === 0) return;
    const next = (searchMatchIndex + delta + searchMatches.length) % searchMatches.length;
    setSearchMatchIndex(next);
    scrollToPage(searchMatches[next]);
  }

  return (
    <section className="argentina-paper" aria-labelledby="argentina-paper-heading">
      <div className="argentina-paper__toggle-row">
        <div>
          <h2 id="argentina-paper-heading" className="project-page__charts-heading">
            Read the full paper
          </h2>
          <p className="argentina-paper__teaser">
            The actual PDF, rendered page by page — no download required.
          </p>
        </div>
        <button
          type="button"
          className="argentina-paper__toggle-btn"
          onClick={() => (expanded ? setExpanded(false) : handleExpand())}
          aria-expanded={expanded}
        >
          {expanded ? 'Collapse' : 'Read on this page'}
          <span aria-hidden="true">{expanded ? '−' : '+'}</span>
        </button>
      </div>

      {expanded && (
        <div className="argentina-paper__reader">
          {status === 'loading' && (
            <p className="argentina-paper__status">Loading paper…</p>
          )}
          {status === 'error' && (
            <p className="argentina-paper__status">
              Could not display the paper here.{' '}
              <a href={PAPER_PDF_URL} target="_blank" rel="noopener noreferrer">
                Open it in a new tab
              </a>{' '}
              instead.
            </p>
          )}
          {status === 'ready' && numPages > 0 && (
            <div className="argentina-paper__toolbar">
              <form className="argentina-paper__page-nav" onSubmit={handleGoToPage}>
                <label htmlFor="argentina-paper-page-input">Page</label>
                <input
                  id="argentina-paper-page-input"
                  type="number"
                  min={1}
                  max={numPages}
                  placeholder="1"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  className="argentina-paper__page-input"
                />
                <span className="argentina-paper__page-total">of {numPages}</span>
                <button type="submit" className="argentina-paper__toolbar-btn">
                  Go
                </button>
              </form>
              <form className="argentina-paper__search" onSubmit={handleSearch}>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find in paper…"
                  aria-label="Find in paper"
                  className="argentina-paper__search-input"
                />
                <button type="submit" className="argentina-paper__toolbar-btn">
                  Find
                </button>
                {searchMatches != null && (
                  <span className="argentina-paper__search-status">
                    {searchMatches.length > 0 ? (
                      <>
                        {searchMatchIndex + 1} / {searchMatches.length} pages
                        <button
                          type="button"
                          onClick={() => goToMatch(-1)}
                          aria-label="Previous match"
                          className="argentina-paper__search-nav-btn"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={() => goToMatch(1)}
                          aria-label="Next match"
                          className="argentina-paper__search-nav-btn"
                        >
                          ›
                        </button>
                      </>
                    ) : (
                      'No matches'
                    )}
                  </span>
                )}
              </form>
            </div>
          )}
          <div ref={pagesRef} className="argentina-paper__pdf-pages" />
          <button
            type="button"
            className="argentina-paper__collapse-bottom"
            onClick={() => setExpanded(false)}
          >
            Collapse full paper ↑
          </button>
        </div>
      )}
    </section>
  );
}
