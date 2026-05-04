import * as pdfjs from 'pdfjs-dist';
import { Section } from '../types';
import { getSmartText } from './pdfHelpers';

// Set worker source using unpkg CDN
const PDFJS_VERSION = pdfjs.version;
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

export async function extractSectionsText(
  file: File,
  sections: Section[],
  onProgress: (current: number, total: number) => void
): Promise<{ name: string; text: string }[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`,
  });
  const pdf = await loadingTask.promise;
  
  const results: { name: string; text: string }[] = [];
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    let sectionText = '';
    
    for (let p = section.startPage; p <= section.endPage; p++) {
      const page = await pdf.getPage(p);
      const pageText = await getSmartText(page);
      
      sectionText += `--- Page ${p} ---\n${pageText}\n\n`;
    }
    
    results.push({
      name: `section_${section.id.toString().padStart(3, '0')}.txt`,
      text: sectionText,
    });
    
    onProgress(i + 1, sections.length);
  }

  return results;
}
