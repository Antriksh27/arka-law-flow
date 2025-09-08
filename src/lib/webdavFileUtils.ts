/**
 * Utility functions for handling WebDAV file previews and downloads
 */

export interface WebDAVFileParams {
  clientName: string;
  caseName: string;
  docType: string;
  fileName: string;
}

/**
 * Generate a direct URL for WebDAV file preview/download
 * Uses the Supabase Edge Function with proper authorization
 */
export function getWebDAVFileUrl(params: WebDAVFileParams): string {
  const { clientName, caseName, docType, fileName } = params;
  
  const baseUrl = 'https://hpcnipcbymruvsnqrmjx.functions.supabase.co/pydio-webdav';
  const searchParams = new URLSearchParams({
    clientName,
    caseName,
    docType,
    fileName
  });
  
  return `${baseUrl}?${searchParams.toString()}`;
}

/**
 * Parse WebDAV path to extract file parameters
 * Handles paths like: "/crmdata/Test Client/Test Case/Court Filings/Orders/file.pdf"
 */
export function parseWebDAVPath(webdavPath: string): WebDAVFileParams | null {
  try {
    // Clean the path - remove leading /crmdata/ if present
    let cleanPath = webdavPath.replace(/^\/crmdata\//, '');
    
    // Remove leading slash if present
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    // Split the path into parts
    const parts = cleanPath.split('/');
    
    if (parts.length < 4) {
      console.warn('WebDAV path does not have enough parts:', webdavPath);
      return null;
    }
    
    // Extract components: clientName/caseName/docType/fileName
    const fileName = parts[parts.length - 1];
    const docType = parts[parts.length - 2];
    const caseName = parts[parts.length - 3];
    const clientName = parts[parts.length - 4];
    
    return {
      clientName,
      caseName,
      docType,
      fileName
    };
  } catch (error) {
    console.error('Error parsing WebDAV path:', error);
    return null;
  }
}

/**
 * Get file type from file name extension
 */
export function getFileTypeFromExtension(fileName: string): string {
  if (!fileName) return 'unknown';
  
  const extension = fileName.toLowerCase().split('.').pop() || '';
  
  if (extension === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) return 'image';
  if (['doc', 'docx'].includes(extension)) return 'word';
  if (['xls', 'xlsx'].includes(extension)) return 'excel';
  if (['ppt', 'pptx'].includes(extension)) return 'powerpoint';
  if (['txt', 'text'].includes(extension)) return 'text';
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) return 'video';
  if (['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(extension)) return 'audio';
  
  return 'unknown';
}

/**
 * Check if a document is stored in WebDAV
 */
export function isWebDAVDocument(document: any): boolean {
  return document?.webdav_synced === true && !!document?.webdav_path;
}