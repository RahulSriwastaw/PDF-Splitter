import * as pdfjs from 'pdfjs-dist';

/**
 * Helper to extract text from a page with smart spacing to avoid breaking words/numbers
 */
export async function getSmartText(page: any): Promise<string> {
  const textContent = await page.getTextContent();
  let lastY: number | null = null;
  let lastX: number | null = null;
  let pageText = '';

  for (const item of textContent.items as any[]) {
    const { str, transform } = item;
    const x = transform[4];
    const y = transform[5];

    // New line detection
    if (lastY !== null && Math.abs(y - lastY) > 5) {
      pageText += '\n';
      lastX = null;
    }

    // Space detection: only add space if the gap is significant (> 3 units)
    // and we are on the same line
    if (lastX !== null && (x - lastX) > 3) {
      pageText += ' ';
    }

    // Clean up string: remove null characters and normalize
    const cleanStr = str.replace(/\0/g, '').normalize('NFKC');
    pageText += cleanStr;

    lastX = x + (item.width || 0);
    lastY = y;
  }
  return pageText;
}
