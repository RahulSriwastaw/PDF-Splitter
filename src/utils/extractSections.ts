import * as pdfjs from 'pdfjs-dist';
import { Section } from '../types';
import { getSmartText } from './pdfHelpers';

// Set worker source using unpkg CDN with the exact version from the library
const PDFJS_VERSION = pdfjs.version;
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

export async function extractSections(
  file: File,
  onProgress: (current: number, total: number) => void
): Promise<Section[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`,
  });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  
  const sectionStarts: number[] = [];
  // Stricter regex: Q.1 at start of line, not followed by another digit
  const regex = /(?:^|\n)\s*Q\.?\s*1\s*(?![0-9])/i;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await getSmartText(page);

    if (regex.test(text)) {
      sectionStarts.push(i);
    }
    
    onProgress(i, numPages);
  }

  if (sectionStarts.length === 0) {
    throw new Error('No "Q.1" markers found in the PDF.');
  }

  const sections: Section[] = [];
  for (let i = 0; i < sectionStarts.length; i++) {
    const startPage = sectionStarts[i];
    const endPage = i < sectionStarts.length - 1 ? sectionStarts[i + 1] - 1 : numPages;
    sections.push({
      id: i + 1,
      startPage,
      endPage,
      pageCount: endPage - startPage + 1,
    });
  }

  return sections;
}
