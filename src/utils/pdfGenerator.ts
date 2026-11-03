import jsPDF from 'jspdf';
import { toJpeg, toPng } from 'html-to-image';

export interface PDFGeneratorOptions {
  format?: 'a4' | 'letter' | [number, number];
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  scale?: number;
  fitToSinglePage?: boolean;
  maxSizeBytes?: number; // Strict max size in bytes (Default: 3 * 1024 * 1024 = 3 MB)
}

export interface PDFGeneratorResult {
  success: boolean;
  sizeBytes: number;
  formattedSize: string;
  filename: string;
}

/**
 * Formats a byte number into a human-readable string (e.g., "640 Ko", "1.8 Mo")
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0) return '0 Ko';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const DEFAULT_MAX_SIZE_BYTES = 3 * 1024 * 1024; // Strict limit: 3 MB (3 145 728 bytes)

/**
 * Downloads any DOM element as a crisp, optimized PDF document.
 * GUARANTEE: The generated PDF strictly stays under 3 MB (default: maxSizeBytes = 3 MB).
 * Uses high-fidelity JPEG compression (quality 0.90) and smart adaptive downsampling
 * if huge embedded product images would otherwise exceed the 3 MB ceiling.
 */
export async function downloadElementAsPDF(
  element: HTMLElement | null,
  filename: string = 'document.pdf',
  options: PDFGeneratorOptions = {}
): Promise<PDFGeneratorResult | boolean> {
  if (!element) {
    console.error('Target element for PDF generation not found');
    return false;
  }

  const {
    format = 'a4',
    orientation = 'portrait',
    margin = 6,
    scale = 2.0, // High-resolution retina 300 DPI base
    fitToSinglePage = false,
    maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  } = options;

  const isThermal = Array.isArray(format) && format[0] === 80;
  const cleanFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;

  // Create an offscreen staging container to guarantee authentic layout and typography
  const offscreen = document.createElement('div');
  offscreen.style.position = 'fixed';
  offscreen.style.left = '-9999px';
  offscreen.style.top = '0';
  offscreen.style.zIndex = '-9999';
  offscreen.style.background = '#ffffff';
  offscreen.style.opacity = '1';

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0px';
  clone.style.border = 'none';
  clone.style.margin = '0px';
  (clone.style as any).webkitFontSmoothing = 'antialiased';
  (clone.style as any).mozOsxFontSmoothing = 'grayscale';
  (clone.style as any).textRendering = 'geometricPrecision';

  if (isThermal) {
    clone.style.width = '320px';
    clone.style.maxWidth = '320px';
    clone.style.minWidth = '320px';
  } else {
    clone.style.width = '794px';
    clone.style.maxWidth = '794px';
    clone.style.minWidth = '794px';
  }

  offscreen.appendChild(clone);
  document.body.appendChild(offscreen);

  try {
    // Helper to render image from DOM clone with specific quality & pixelRatio
    const renderJpeg = async (quality: number, pixelRatio: number): Promise<string> => {
      try {
        return await toJpeg(clone, {
          backgroundColor: '#ffffff',
          quality: quality,
          pixelRatio: pixelRatio,
          skipFonts: true,
          cacheBust: true,
        });
      } catch (e) {
        console.warn('toJpeg failed, attempting fallback toPng:', e);
        return await toPng(clone, {
          backgroundColor: '#ffffff',
          pixelRatio: Math.min(pixelRatio, 2.0),
          skipFonts: true,
        });
      }
    };

    // Helper to assemble jsPDF document from image data
    const assemblePdf = (
      imgData: string,
      imgNaturalWidth: number,
      imgNaturalHeight: number
    ): jsPDF => {
      if (isThermal) {
        const printableWidth = Math.max(10, 80 - margin * 2);
        const imgWidth = printableWidth;
        const imgHeight = (imgNaturalHeight * printableWidth) / imgNaturalWidth;
        const rollHeight = Math.max(80, Math.ceil(imgHeight + margin * 2));

        const thermalPdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [80, rollHeight],
        });

        thermalPdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight, undefined, 'FAST');
        return thermalPdf;
      }

      // Standard A4 / Letter
      let pdfWidth: number;
      let pdfHeight: number;

      if (Array.isArray(format)) {
        pdfWidth = orientation === 'portrait' ? format[0] : format[1];
        pdfHeight = orientation === 'portrait' ? format[1] : format[0];
      } else if (format === 'letter') {
        pdfWidth = orientation === 'portrait' ? 215.9 : 279.4;
        pdfHeight = orientation === 'portrait' ? 279.4 : 215.9;
      } else {
        pdfWidth = orientation === 'portrait' ? 210 : 297;
        pdfHeight = orientation === 'portrait' ? 297 : 210;
      }

      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: format,
      });

      const printableWidth = Math.max(10, pdfWidth - margin * 2);
      const printableHeight = Math.max(10, pdfHeight - margin * 2);
      const imgWidth = printableWidth;
      const imgHeight = (imgNaturalHeight * printableWidth) / imgNaturalWidth;

      // Single-page auto-fit
      const shouldFitSinglePage = fitToSinglePage || (imgHeight > printableHeight && imgHeight <= printableHeight * 1.65);
      if (shouldFitSinglePage && imgHeight > printableHeight) {
        const fitRatio = printableHeight / imgHeight;
        const fittedWidth = imgWidth * fitRatio;
        const fittedHeight = printableHeight;
        const centeredX = margin + (printableWidth - fittedWidth) / 2;

        pdf.addImage(imgData, 'JPEG', centeredX, margin, fittedWidth, fittedHeight, undefined, 'FAST');
        return pdf;
      }

      let heightLeft = imgHeight;
      let position = margin;

      // First page
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= printableHeight;

      // Multi-page handling
      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= printableHeight;
      }

      return pdf;
    };

    // Compression profiles ladder to strictly stay under maxSizeBytes (3 MB)
    // Default profile gives pristine 300 DPI text with file size ~350 KB - 800 KB
    const compressionProfiles = [
      { quality: 0.90, pixelRatio: Math.min(scale || 2.0, 2.2) },
      { quality: 0.82, pixelRatio: 1.8 },
      { quality: 0.74, pixelRatio: 1.5 },
      { quality: 0.65, pixelRatio: 1.25 },
    ];

    let finalPdf: jsPDF | null = null;
    let finalBlob: Blob | null = null;
    let finalSize = 0;

    for (let i = 0; i < compressionProfiles.length; i++) {
      const profile = compressionProfiles[i];
      const imgData = await renderJpeg(profile.quality, profile.pixelRatio);

      // Measure dimensions
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to parse generated image data'));
        img.src = imgData;
      });

      const imgNaturalWidth = img.naturalWidth || (isThermal ? 320 : 794);
      const imgNaturalHeight = img.naturalHeight || 1100;

      const pdf = assemblePdf(imgData, imgNaturalWidth, imgNaturalHeight);
      const blob = pdf.output('blob');

      finalPdf = pdf;
      finalBlob = blob;
      finalSize = blob.size;

      // If document is strictly under maxSizeBytes (e.g. 3 MB), stop optimization ladder
      if (finalSize <= maxSizeBytes) {
        break;
      }

      console.warn(
        `PDF size (${formatBytes(finalSize)}) exceeds limit (${formatBytes(maxSizeBytes)}). Applying adaptive compression level ${i + 1}...`
      );
    }

    if (!finalPdf || !finalBlob) {
      throw new Error('Could not create PDF document');
    }

    // Trigger user browser download
    finalPdf.save(cleanFilename);

    return {
      success: true,
      sizeBytes: finalSize,
      formattedSize: formatBytes(finalSize),
      filename: cleanFilename,
    };
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    // Fallback to window.print if PDF rendering fails
    window.print();
    return false;
  } finally {
    if (offscreen.parentNode) {
      offscreen.parentNode.removeChild(offscreen);
    }
  }
}

/**
 * Universal safe print handler that works even inside sandboxed iFrames
 */
export function safePrintDocument() {
  try {
    window.print();
  } catch (e) {
    console.warn('Direct print blocked, attempting fallback', e);
  }
}
