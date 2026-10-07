/**
 * Export utilities for SVG, PNG, and PDF.
 */
import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Export the map element as SVG string.
 */
export async function exportAsSvg(element: HTMLElement, filename = 'land-map.svg'): Promise<void> {
  try {
    const dataUrl = await toSvg(element, {
      quality: 1,
      backgroundColor: '#ffffff',
      style: {
        transform: 'none',
      },
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('SVG export failed:', err);
    throw err;
  }
}

/**
 * Export the map element as PNG.
 * Uses 3x scale for high-resolution output (~300 DPI equivalent).
 */
export async function exportAsPng(element: HTMLElement, filename = 'land-map.png'): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      quality: 1,
      pixelRatio: 3,
      backgroundColor: '#ffffff',
      style: {
        transform: 'none',
      },
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('PNG export failed:', err);
    throw err;
  }
}

/**
 * Export the map element as PDF (A4 landscape).
 */
export async function exportAsPdf(
  element: HTMLElement,
  filename = 'land-map.pdf',
  orientation: 'landscape' | 'portrait' = 'landscape'
): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      quality: 1,
      pixelRatio: 3,
      backgroundColor: '#ffffff',
      style: {
        transform: 'none',
      },
    });

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Load the image to get dimensions
    const img = new Image();
    img.src = dataUrl;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        const imgRatio = img.width / img.height;
        const pageRatio = pageWidth / pageHeight;

        let finalWidth: number;
        let finalHeight: number;

        const margin = 10; // mm margin

        if (imgRatio > pageRatio) {
          finalWidth = pageWidth - margin * 2;
          finalHeight = finalWidth / imgRatio;
        } else {
          finalHeight = pageHeight - margin * 2;
          finalWidth = finalHeight * imgRatio;
        }

        const x = (pageWidth - finalWidth) / 2;
        const y = (pageHeight - finalHeight) / 2;

        pdf.addImage(dataUrl, 'PNG', x, y, finalWidth, finalHeight);
        pdf.save(filename);
        resolve();
      };
      img.onerror = reject;
    });
  } catch (err) {
    console.error('PDF export failed:', err);
    throw err;
  }
}

/**
 * Save project as JSON file.
 */
export function saveProjectAsJson(project: unknown, filename = 'land-project.json'): void {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Load project from JSON file.
 */
export function loadProjectFromJson(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    };
    input.click();
  });
}
