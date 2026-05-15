// Frontend page-count estimation for the /documents register call.
// Used server-side only for preflight quota checks; the authoritative page
// count still comes from TextIn on extraction success.

import JSZip from 'jszip';

function hasExt(file: File, exts: readonly string[]): boolean {
  const lower = file.name.toLowerCase();
  return exts.some((ext) => lower.endsWith(ext));
}

async function estimatePdfPages(file: File): Promise<number | null> {
  try {
    const pdfjs = await import('pdfjs-dist');
    const workerModule = await import(
      'pdfjs-dist/build/pdf.worker.min.mjs?url'
    );
    (pdfjs.GlobalWorkerOptions as { workerSrc: string }).workerSrc =
      workerModule.default;
    const buffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: buffer });
    const doc = await loadingTask.promise;
    const pages = doc.numPages;
    try {
      await doc.destroy();
    } catch {
      /* ignore */
    }
    return pages > 0 ? pages : null;
  } catch {
    return null;
  }
}

async function estimatePptxSlides(file: File): Promise<number | null> {
  try {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    let count = 0;
    zip.forEach((path) => {
      if (/^ppt\/slides\/slide\d+\.xml$/i.test(path)) {
        count += 1;
      }
    });
    return count > 0 ? count : null;
  } catch {
    return null;
  }
}

async function estimateXlsxSheets(file: File): Promise<number | null> {
  try {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    let count = 0;
    zip.forEach((path) => {
      if (/^xl\/worksheets\/sheet\d+\.xml$/i.test(path)) {
        count += 1;
      }
    });
    return count > 0 ? count : null;
  } catch {
    return null;
  }
}

async function estimateDocxPages(file: File): Promise<number | null> {
  try {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const entry = zip.file('word/document.xml');
    if (!entry) return null;
    const xml = await entry.async('string');
    const breaks = xml.match(/<w:lastRenderedPageBreak\b/g);
    if (breaks && breaks.length > 0) {
      // lastRenderedPageBreak marks end-of-page, so pages = breaks + 1
      return breaks.length + 1;
    }
    // Fallback: rough estimate from character count (~1800 chars/page).
    const textChars = xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    if (!textChars) return null;
    const totalChars = textChars.reduce((sum, tag) => {
      const value = tag.replace(/<\/?w:t[^>]*>/g, '');
      return sum + value.length;
    }, 0);
    if (totalChars === 0) return null;
    return Math.max(1, Math.ceil(totalChars / 1800));
  } catch {
    return null;
  }
}

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp'] as const;

export async function estimatePageCount(file: File): Promise<number | null> {
  const lower = file.name.toLowerCase();
  const mime = file.type;

  if (mime === 'application/pdf' || lower.endsWith('.pdf')) {
    return estimatePdfPages(file);
  }
  if (
    mime ===
      'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    lower.endsWith('.pptx')
  ) {
    return estimatePptxSlides(file);
  }
  if (
    mime ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    lower.endsWith('.xlsx')
  ) {
    return estimateXlsxSheets(file);
  }
  if (
    mime ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx')
  ) {
    return estimateDocxPages(file);
  }
  if (mime.startsWith('image/') || hasExt(file, IMAGE_EXTS)) {
    return 1;
  }
  // .doc / .xls / .ppt / .csv / .txt / .rtf / .ofd / .html / .mhtml → omit
  return null;
}
