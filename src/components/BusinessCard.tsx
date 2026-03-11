import { useState, useRef, useEffect } from 'react';

const CARD_INFO = {
  name: 'Levan Kvinikadze',
  email: 'levank30@brandeis.edu',
  linkedInUrl: 'https://www.linkedin.com/in/levan-kvinikadze',
  /** Photo: place LK.jpg in public/ */
  photoUrl: '/LK.jpg',
  /** Add your resume to public/pdfs/ and set filename here */
  resumeUrl: '/pdfs/resume.pdf',
  resumeFilename: 'Levan_Kvinikadze_Resume.pdf',
} as const;

const FOCUS_CHIPS = [
  'Private Equity',
  'Portfolio Management',
  'Investment Research',
  'Valuation',
  'Transaction Support',
  'Financial Reporting',
] as const;

const EDUCATION = [
  {
    logoUrl: '/logos/Brandeis_seal_white.png',
    name: 'Brandeis University',
    degree: 'Candidate for Master of Science in Finance (STEM-Designated)',
    dates: '01/2026 – 12/2026',
  },
  {
    logoUrl: '/logos/Bentley.png',
    name: 'Bentley University',
    degree: 'Bachelor of Science in Corporate Finance and Accounting, Minor in Computer Information Systems',
    dates: '09/2021 – 05/2025',
  },
] as const;

const TILT_MAX = 3;
const TOAST_DURATION_MS = 2000;

export function BusinessCard() {
  const [copied, setCopied] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const scrollToNext = () => {
    document.getElementById('summary')?.scrollIntoView({ behavior: 'smooth' });
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CARD_INFO.email);
      setCopied(true);
      setTimeout(() => setCopied(false), TOAST_DURATION_MS);
    } catch {
      // ignore if clipboard fails (e.g. insecure context)
    }
  };

  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;

  useEffect(() => {
    if (isTouch) return;
    const el = cardRef.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      if (!innerRef.current) return;
      const rect = el.getBoundingClientRect();
      let x = (e.clientX - rect.left) / rect.width - 0.5;
      let y = (e.clientY - rect.top) / rect.height - 0.5;
      // Softer response near edges so hover on sides doesn't over-tilt
      const dampen = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), 1.6);
      x = dampen(x);
      y = dampen(y);
      setTilt({
        x: y * TILT_MAX,
        y: -x * TILT_MAX,
      });
    };

    const handleLeave = () => setTilt({ x: 0, y: 0 });

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [isTouch]);

  return (
    <div className="business-card" ref={cardRef}>
      <div
        className="business-card__inner"
        ref={innerRef}
        style={
          !isTouch
            ? {
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: 'transform 0.1s ease-out',
              }
            : undefined
        }
      >
        <div className="business-card__photo-wrap">
          {!photoError ? (
            <img
              src={CARD_INFO.photoUrl}
              alt="Levan Kvinikadze"
              className="business-card__photo"
              width={180}
              height={252}
              onError={() => setPhotoError(true)}
            />
          ) : (
            <div className="business-card__photo business-card__photo--fallback" aria-hidden>
              LK
            </div>
          )}
        </div>
        <div className="business-card__main">
          <h1 className="business-card__name">{CARD_INFO.name}</h1>
          <p className="business-card__title">Investments · Private Markets · Portfolio</p>
          <p className="business-card__focus">Valuation-driven finance across public and private investing, with clear, decision-ready analysis.</p>
          <div className="business-card__chips">
            {FOCUS_CHIPS.map((label) => (
              <span key={label} className="business-card__chip">{label}</span>
            ))}
          </div>
          <p className="business-card__get-in-touch">Get in touch</p>
          <div className="business-card__icons">
            {copied && (
              <div className="business-card__toast" role="status" aria-live="polite">
                Copied
              </div>
            )}
            <a
              href={`mailto:${CARD_INFO.email}`}
              className="business-card__icon business-card__icon--link"
              aria-label="Email me"
              title="Email me"
            >
              <EmailIcon />
            </a>
            <button
              type="button"
              className="business-card__icon"
              onClick={copyEmail}
              aria-label="Copy email address"
              title="Copy email"
            >
              <CopyIcon />
            </button>
            <a
              href={CARD_INFO.linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="business-card__icon business-card__icon--link"
              aria-label="LinkedIn profile"
              title="LinkedIn"
            >
              <LinkedInIcon />
            </a>
            <a
              href={CARD_INFO.resumeUrl}
              download={CARD_INFO.resumeFilename}
              className="business-card__icon business-card__icon--link"
              aria-label="Download resume"
              title="Download resume"
              target="_blank"
              rel="noopener noreferrer"
            >
              <DownloadIcon />
            </a>
          </div>
          <a
            href="#summary"
            className="business-card__cta"
            aria-label="Scroll to Summary section"
            onClick={(e) => {
              e.preventDefault();
              scrollToNext();
            }}
          >
            <span className="business-card__cta-label">Scroll to explore</span>
            <span className="business-card__cta-arrow" aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="business-card__education">
          {EDUCATION.map((school) => (
            <div key={school.name} className="business-card__school">
              <img
                src={school.logoUrl}
                alt=""
                className="business-card__school-logo"
                width={48}
                height={48}
              />
              <div className="business-card__school-text">
                <div className="business-card__school-header">
                  <p className="business-card__school-name">{school.name}</p>
                  <p className="business-card__school-dates">{school.dates}</p>
                </div>
                <p className="business-card__school-degree">{school.degree}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16V4a2 2 0 0 1 2-2h12" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <polyline points="10 9 9 9 8 9" />
      <path d="M12 21v-6" />
      <path d="m15 18-3 3-3-3" />
    </svg>
  );
}
