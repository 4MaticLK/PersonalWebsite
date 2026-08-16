import { useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { CERTIFICATES, type Certificate } from '../data/certificates';
import { CertificateViewerModal } from './CertificateViewerModal';

export function CertificatesSection() {
  const { revealRef, isVisible } = useScrollReveal();
  const [activeCert, setActiveCert] = useState<Certificate | null>(null);

  return (
    <section
      id="certificates"
      ref={revealRef}
      className={`page-section page-section--fullscreen page-section--auto-height work-section scroll-reveal ${isVisible ? 'scroll-reveal--visible' : ''}`}
    >
      <div className="page-section__scroll">
        <div className="page-section__scroll-inner">
          <h2 className="work-section__title">Certificates</h2>
          <p className="work-section__intro">
            Selected certifications and credentials. Click a card to view the certificate.
          </p>
          <div className="work-section__grid">
            {CERTIFICATES.map((cert) =>
              cert.fileUrl ? (
                <button
                  key={cert.name}
                  type="button"
                  className="work-section__card certificate-card work-section__card--button"
                  onClick={() => setActiveCert(cert)}
                >
                  <div className="work-section__card-tags" aria-label="Issuer">
                    <span className="work-section__card-tag">{cert.issuer}</span>
                  </div>
                  <h3 className="work-section__card-title">{cert.name}</h3>
                  <p className="work-section__card-desc">Completed {cert.date}</p>
                  <span className="work-section__card-link">
                    View certificate{' '}
                    <span className="work-section__card-arrow" aria-hidden>
                      →
                    </span>
                  </span>
                </button>
              ) : (
                <div
                  key={cert.name}
                  className="work-section__card certificate-card certificate-badge-card"
                >
                  {cert.badgeImage && (
                    <img
                      src={cert.badgeImage}
                      alt={`${cert.name} badge`}
                      className="certificate-badge-card__image"
                      width={72}
                      height={72}
                      loading="lazy"
                    />
                  )}
                  <div className="work-section__card-tags" aria-label="Issuer">
                    <span className="work-section__card-tag">{cert.issuer}</span>
                  </div>
                  <h3 className="work-section__card-title">{cert.name}</h3>
                  <p className="work-section__card-desc">Earned {cert.date}</p>
                </div>
              )
            )}
          </div>
          <a href="#skills-and-activities" className="experience-section__cta">
            See skills & activities
            <span className="experience-section__cta-arrow" aria-hidden>
              →
            </span>
          </a>
        </div>
      </div>
      <CertificateViewerModal certificate={activeCert} onClose={() => setActiveCert(null)} />
    </section>
  );
}
