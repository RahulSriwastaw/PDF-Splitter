import * as pdfjs from 'pdfjs-dist';
import { getSmartText } from './pdfHelpers';

// Set worker source using unpkg CDN
const PDFJS_VERSION = pdfjs.version;
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

export async function extractAllText(
  file: File,
  onProgress: (current: number, total: number) => void
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`,
  });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  
  const pageTexts: string[] = new Array(numPages);
  const concurrencyLimit = 5; // Reduced for better stability with complex fonts
  
  for (let i = 0; i < numPages; i += concurrencyLimit) {
    const chunk = [];
    for (let j = i; j < Math.min(i + concurrencyLimit, numPages); j++) {
      chunk.push((async (pageIndex: number) => {
        const page = await pdf.getPage(pageIndex + 1);
        const pageText = await getSmartText(page);

        pageTexts[pageIndex] = `--- Page ${pageIndex + 1} ---\n${pageText}\n\n`;
        onProgress(pageIndex + 1, numPages);
      })(j));
    }
    await Promise.all(chunk);
  }

  return pageTexts.join('');
}
