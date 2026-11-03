/**
 * Direct Print Utility for Default Computer Printer
 * Supports both standard office printers (A4) and POS Thermal Printers (80mm / 58mm)
 */

export interface DirectPrintOptions {
  format?: 'A4' | 'THERMAL';
  title?: string;
}

export const printDirectToDefaultPrinter = async (
  element: HTMLElement | null,
  options: DirectPrintOptions = {}
): Promise<void> => {
  const format = options.format || 'A4';
  const title = options.title || 'Document';

  // 1. Remove previous dynamic style tag if any
  const existingStyle = document.getElementById('dynamic-print-page-style');
  if (existingStyle) {
    existingStyle.remove();
  }

  // 2. Inject dynamic @page rule according to format
  const dynamicStyle = document.createElement('style');
  dynamicStyle.id = 'dynamic-print-page-style';
  if (format === 'THERMAL') {
    dynamicStyle.innerHTML = `
      @media print {
        @page {
          size: 80mm auto !important;
          margin: 0mm !important;
        }
        body {
          width: 80mm !important;
          margin: 0 auto !important;
          padding: 0 !important;
          background: #ffffff !important;
        }
        .print-page {
          width: 80mm !important;
          max-width: 80mm !important;
          margin: 0 auto !important;
          padding: 3mm !important;
          font-family: 'JetBrains Mono', monospace !important;
        }
      }
    `;
  } else {
    dynamicStyle.innerHTML = `
      @media print {
        @page {
          size: A4 portrait !important;
          margin: 6mm !important;
        }
        body {
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
        }
        .print-page {
          width: 100% !important;
          max-width: 210mm !important;
          margin: 0 auto !important;
        }
      }
    `;
  }
  document.head.appendChild(dynamicStyle);

  // 3. Try isolated iframe printing first (best for zero background pollution)
  try {
    let iframe = document.getElementById('direct-print-hidden-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.remove();
    }

    iframe = document.createElement('iframe');
    iframe.id = 'direct-print-hidden-iframe';
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc && element) {
      // Gather parent styles
      let headStyles = '';
      const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
      styles.forEach((st) => {
        headStyles += st.outerHTML;
      });

      const pageRules = format === 'THERMAL'
        ? `
          @page {
            size: 80mm auto;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 2mm !important;
            width: 80mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'JetBrains Mono', monospace, system-ui;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        `
        : `
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        `;

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${title}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
            ${headStyles}
            <style>
              ${pageRules}
            </style>
          </head>
          <body>
            ${element.outerHTML}
          </body>
        </html>
      `);
      iframeDoc.close();

      // Wait a short moment for DOM to paint inside iframe
      await new Promise((r) => setTimeout(r, 120));

      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // Clean up iframe after printing dialog closes
      setTimeout(() => {
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 5000);

      return;
    }
  } catch (err) {
    // Fallback directly to window.print()
    console.warn('Iframe printing fallback to window.print', err);
  }

  // 4. Fallback directly via window.print()
  window.print();
};
