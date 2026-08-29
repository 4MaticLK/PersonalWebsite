export interface RenderPdfPagesResult {
  numPages: number;
  /** Lowercased extracted text per page, 0-indexed (index 0 = page 1). */
  pageTexts: string[];
}

/** Render every page of a PDF into the container as canvases sized to its width. */
export async function renderPdfPages(
  fileUrl: string,
  container: HTMLDivElement,
  isCancelled: () => boolean,
  pageClassName = 'pdf-viewer__page'
): Promise<RenderPdfPagesResult> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const doc = await pdfjs.getDocument({ url: fileUrl }).promise;
  if (isCancelled()) return { numPages: 0, pageTexts: [] };

  container.replaceChildren();
  const containerWidth = container.clientWidth || 800;
  const dpr = window.devicePixelRatio || 1;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    if (isCancelled()) return { numPages: doc.numPages, pageTexts };

    const baseViewport = page.getViewport({ scale: 1 });
    const scale = containerWidth / baseViewport.width;
    const viewport = page.getViewport({ scale: scale * dpr });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.className = pageClassName;
    canvas.dataset.pageNumber = String(pageNum);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    if (isCancelled()) return { numPages: doc.numPages, pageTexts };
    container.appendChild(canvas);

    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .toLowerCase();
    pageTexts.push(text);
  }

  return { numPages: doc.numPages, pageTexts };
}
