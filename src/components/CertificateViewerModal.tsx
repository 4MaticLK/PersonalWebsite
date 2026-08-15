import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Certificate } from '../data/certificates';

interface CertificateViewerModalProps {
  certificate: Certificate | null;
  onClose: () => void;
}

type ViewerStatus = 'loading' | 'ready' | 'error';

/** Render every page of the PDF into the container as canvases sized to its width. */
async function renderPdfPages(
  fileUrl: string,
  container: HTMLDivElement,
  isCancelled: () => boolean
): Promise<void> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const doc = await pdfjs.getDocument({ url: fileUrl }).promise;
  if (isCancelled()) return;

  container.replaceChildren();
  const containerWidth = container.clientWidth || 800;
  const dpr = window.devicePixelRatio || 1;

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    if (isCancelled()) return;

    const baseViewport = page.getViewport({ scale: 1 });
    const scale = containerWidth / baseViewport.width;
    const viewport = page.getViewport({ scale: scale * dpr });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.className = 'certificate-viewer__page';
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    if (isCancelled()) return;
    container.appendChild(canvas);
  }
}

export function CertificateViewerModal({ certificate, onClose }: CertificateViewerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ViewerStatus>('loading');
  const [lastCertificate, setLastCertificate] = useState(certificate);

  if (certificate !== lastCertificate) {
    setLastCertificate(certificate);
    setStatus('loading');
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (certificate && !dialog.open) dialog.showModal();
    if (!certificate && dialog.open) dialog.close();
  }, [certificate]);

  useEffect(() => {
    const container = pagesRef.current;
    if (!certificate?.fileUrl || !container) return;

    let cancelled = false;
    renderPdfPages(certificate.fileUrl, container, () => cancelled)
      .then(() => {
        if (!cancelled) setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      container.replaceChildren();
    };
  }, [certificate]);

  return createPortal(
    <dialog
      ref={dialogRef}
      className="certificate-viewer"
      aria-labelledby="certificate-viewer-title"
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      {certificate && (
        <div className="certificate-viewer__panel">
          <header className="certificate-viewer__header">
            <div>
              <h2 id="certificate-viewer-title" className="certificate-viewer__title">
                {certificate.name}
              </h2>
              <p className="certificate-viewer__meta">
                {certificate.issuer} · {certificate.date}
              </p>
            </div>
            <div className="certificate-viewer__actions">
              <a
                href={certificate.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="certificate-viewer__open-link"
              >
                Open in new tab ↗
              </a>
              <button
                type="button"
                className="certificate-viewer__close"
                onClick={onClose}
                aria-label="Close certificate viewer"
              >
                ×
              </button>
            </div>
          </header>
          <div className="certificate-viewer__body">
            {status === 'loading' && (
              <p className="certificate-viewer__status">Loading certificate…</p>
            )}
            {status === 'error' && (
              <p className="certificate-viewer__status">
                Could not display the certificate here.{' '}
                <a href={certificate.fileUrl} target="_blank" rel="noopener noreferrer">
                  Open it in a new tab
                </a>{' '}
                instead.
              </p>
            )}
            <div ref={pagesRef} className="certificate-viewer__pages" />
          </div>
        </div>
      )}
    </dialog>,
    document.body
  );
}
