/**
 * Utility for automatic local PDF archiving to C:\hibtech
 * Supports File System Access API (direct folder write) with immediate browser download fallback.
 */

let cachedDirectoryHandle: any = null;

/**
 * Ask or get the directory handle for C:\hibtech
 */
export async function getHibtechDirectoryHandle(): Promise<any | null> {
  if (cachedDirectoryHandle) {
    return cachedDirectoryHandle;
  }

  // Check if showDirectoryPicker is supported in this browser
  if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
    try {
      const handle = await (window as any).showDirectoryPicker({
        id: 'hibtech-archive-folder',
        mode: 'readwrite',
        startIn: 'documents',
      });
      cachedDirectoryHandle = handle;
      return handle;
    } catch (e) {
      // User cancelled picker or permission denied
      return null;
    }
  }

  return null;
}

/**
 * Saves a PDF Blob directly to C:\hibtech or triggers an immediate download
 */
export async function savePDFToHibtech(pdfBlob: Blob, filename: string): Promise<boolean> {
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  // 1. Try direct write to File System handle if available
  if (cachedDirectoryHandle) {
    try {
      const fileHandle = await cachedDirectoryHandle.getFileHandle(cleanFilename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(pdfBlob);
      await writable.close();
      return true;
    } catch (err) {
      console.warn('Failed to write to directory handle, falling back to download:', err);
    }
  }

  // 2. Trigger instant automatic download
  try {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    // Suggest the file path prefix for clarity
    link.download = cleanFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch (err) {
    console.error('Failed to trigger download:', err);
    return false;
  }
}
