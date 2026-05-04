import { PDFDocument } from 'pdf-lib';
import { Section } from '../types';

export async function createNup(
  sourceFile: File,
  section: Section,
  pagesPerSheet: number
): Promise<Uint8Array> {
  const arrayBuffer = await sourceFile.arrayBuffer();
  const sourceDoc = await PDFDocument.load(arrayBuffer);
  const outputDoc = await PDFDocument.create();

  // Get pages for this section (0-indexed in pdf-lib)
  const sectionPagesIndices = [];
  for (let i = section.startPage - 1; i < section.endPage; i++) {
    sectionPagesIndices.push(i);
  }

  // Copy pages to output doc to embed them
  const copiedPages = await outputDoc.copyPages(sourceDoc, sectionPagesIndices);

  // Determine grid dimensions dynamically based on requested pages per sheet
  const rows = Math.ceil(Math.sqrt(pagesPerSheet));
  const cols = Math.ceil(pagesPerSheet / rows);

  for (let i = 0; i < copiedPages.length; i += pagesPerSheet) {
    // Use the first page of the group to determine dimensions
    const firstPage = copiedPages[i];
    const { width, height } = firstPage.getSize();
    
    const newPage = outputDoc.addPage([width, height]);
    
    // Calculate scaling and cell dimensions
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    // Scale proportionally to fit within the cell
    const scale = Math.min(cellWidth / width, cellHeight / height);
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    
    // Process up to `pagesPerSheet` pages for this sheet
    for (let j = 0; j < pagesPerSheet; j++) {
      const pageIdx = i + j;
      if (pageIdx >= copiedPages.length) break;
      
      const sourcePage = copiedPages[pageIdx];
      const embeddedPage = await outputDoc.embedPage(sourcePage);
      
      // Grid positions
      const col = j % cols;
      const row = Math.floor(j / cols);
      
      // Center the scaled page within its grid cell
      const tx = col * cellWidth + (cellWidth - scaledWidth) / 2;
      const ty = height - (row + 1) * cellHeight + (cellHeight - scaledHeight) / 2;
      
      newPage.drawPage(embeddedPage, {
        x: tx,
        y: ty,
        width: scaledWidth,
        height: scaledHeight,
      });
    }
  }

  return await outputDoc.save();
}
