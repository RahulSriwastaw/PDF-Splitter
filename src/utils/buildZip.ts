import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function buildZip(
  files: { name: string; data: Uint8Array }[],
  zipName: string
): Promise<void> {
  const zip = new JSZip();
  
  files.forEach((file) => {
    zip.file(file.name, file.data);
  });
  
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, zipName);
}
