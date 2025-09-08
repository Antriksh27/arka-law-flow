import { callSupabaseFunction, callWebDAVFunction } from './supabaseEdgeFunction';
import { getWebDAVFileUrl, parseWebDAVPath, WebDAVFileParams } from './webdavFileUtils';

export interface WebDAVUploadParams {
  filename: string;
  content: string;
}

export interface WebDAVDownloadParams {
  filePath: string;
}

export interface WebDAVResponse {
  success: boolean;
  message: string;
  data?: any;
  content?: string;
  path?: string;
  error?: string;
  details?: string;
}

/**
 * Get a direct URL for a WebDAV file for preview/download
 * This uses the new GET endpoint that returns files directly with CORS headers
 */
export function getFileUrl(clientName: string, caseName: string, docType: string, fileName: string): string {
  return getWebDAVFileUrl({ clientName, caseName, docType, fileName });
}

/**
 * Get file URL from document object
 */
export function getFileUrlFromDocument(document: any): string | null {
  if (!document?.webdav_path) return null;
  
  const params = parseWebDAVPath(document.webdav_path);
  if (!params) return null;
  
  return getWebDAVFileUrl(params);
}

/**
 * Upload a file to WebDAV
 */
export async function uploadFileToWebDAV(params: WebDAVUploadParams): Promise<WebDAVResponse> {
  try {
    console.log('🔧 Starting WebDAV integration - calling pydio-webdav edge function');
    console.log('📁 File params:', { filename: params.filename, contentLength: params.content.length });
    
    const data = await callSupabaseFunction('pydio-webdav', 'POST', {
      operation: 'upload',
      filename: params.filename,
      content: params.content,
    });

    console.log('📡 Edge function response:', data);
    return data;
    
  } catch (error) {
    console.error('Unexpected error uploading to WebDAV:', error);
    return {
      success: false,
      message: 'Unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Download a file from WebDAV
 */
export async function downloadFileFromWebDAV(params: WebDAVDownloadParams): Promise<WebDAVResponse> {
  try {
    console.log('🔧 Downloading from WebDAV:', params.filePath);
    
    // Parse the file path to extract parameters
    const pathParams = parseWebDAVPath(params.filePath);
    if (!pathParams) {
      throw new Error('Invalid WebDAV file path format');
    }
    
    const blob = await callWebDAVFunction('download', pathParams);
    
    return {
      success: true,
      message: 'File downloaded successfully',
      data: blob
    };
    
  } catch (error) {
    console.error('Unexpected error downloading from WebDAV:', error);
    return {
      success: false,
      message: 'Unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Example usage for uploading a file
 */
export async function exampleUpload() {
  const result = await uploadFileToWebDAV({
    filename: 'test-document.txt',
    content: 'This is test content for the document.',
  });

  if (result.success) {
    console.log('Upload successful:', result.message);
    return result.data;
  } else {
    console.error('Upload failed:', result.error);
    throw new Error(result.error || 'Upload failed');
  }
}

/**
 * Example usage for downloading a file
 */
export async function exampleDownload() {
  const result = await downloadFileFromWebDAV({
    filePath: '/documents/test-document.txt',
  });

  if (result.success) {
    console.log('Download successful:', result.message);
    console.log('File content:', result.content);
    return result.content;
  } else {
    console.error('Download failed:', result.error);
    throw new Error(result.error || 'Download failed');
  }
}

/**
 * Upload document content from the existing document system to WebDAV
 */
export async function syncDocumentToWebDAV(document: {
  file_name: string;
  file_url: string;
}): Promise<WebDAVResponse> {
  try {
    // First, fetch the content from Supabase storage using fetch instead of supabase client
    const response = await fetch(document.file_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from Supabase: ${response.statusText}`);
    }
    
    const fileData = await response.blob();
    const content = await fileData.text();

    // Upload to WebDAV
    return await uploadFileToWebDAV({
      filename: document.file_name,
      content,
    });
  } catch (error) {
    console.error('Error syncing document to WebDAV:', error);
    return {
      success: false,
      message: 'Failed to sync document to WebDAV',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a client folder in WebDAV
 */
export async function createClientFolder(clientName: string): Promise<WebDAVResponse> {
  try {
    console.log('🔧 Creating client folder:', clientName);
    
    const data = await callSupabaseFunction('pydio-webdav', 'POST', {
      operation: 'createFolder',
      folderType: 'client',
      clientName,
    });

    return data;
  } catch (error) {
    console.error('Error creating client folder:', error);
    return {
      success: false,
      message: 'Failed to create client folder',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a case folder in WebDAV
 */
export async function createCaseFolder(clientName: string, caseName: string): Promise<WebDAVResponse> {
  try {
    console.log('🔧 Creating case folder:', { clientName, caseName });
    
    const data = await callSupabaseFunction('pydio-webdav', 'POST', {
      operation: 'createFolder',
      folderType: 'case',
      clientName,
      caseName,
    });

    return data;
  } catch (error) {
    console.error('Error creating case folder:', error);
    return {
      success: false,
      message: 'Failed to create case folder',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload a file to WebDAV with full path parameters
 */
export async function uploadFileToWebDAVWithPath(
  clientName: string,
  caseName: string,
  docType: string,
  fileName: string,
  fileContent: string
): Promise<WebDAVResponse> {
  try {
    console.log('🔧 Uploading file to WebDAV:', { clientName, caseName, docType, fileName });
    
    const data = await callSupabaseFunction('pydio-webdav', 'POST', {
      clientName,
      caseName, 
      docType,
      fileName,
      fileContent,
    });

    return data;
  } catch (error) {
    console.error('Error uploading file to WebDAV:', error);
    return {
      success: false,
      message: 'Failed to upload file',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Legacy function names for backward compatibility
export const uploadFileToPydio = uploadFileToWebDAV;
export const downloadFileFromPydio = downloadFileFromWebDAV;
export const syncDocumentToPydio = syncDocumentToWebDAV;