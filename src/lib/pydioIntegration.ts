import { parseWebDAVPath } from './webdavFileUtils';
import { callSupabaseFunction } from './supabaseEdgeFunction';

export interface WebDAVUploadParams {
  clientName: string;
  caseName: string;
  docType: string;
  filename: string;
  content: string; // base64 encoded file content
}

export interface WebDAVDownloadParams {
  clientName: string;
  caseName: string;
  docType: string;
  filename: string;
}

export interface WebDAVResponse {
  success: boolean;
  message?: string;
  details?: string;
}

// Legacy function - now just returns a placeholder
export function getFileUrl(clientName: string, caseName: string, docType: string, fileName: string): string {
  console.warn('getFileUrl is deprecated - use downloadWebDAVFileDirectly instead');
  return 'webdav-placeholder';
}

// Legacy function - now just returns null
export function getFileUrlFromDocument(document: any): string | null {
  console.warn('getFileUrlFromDocument is deprecated - use downloadWebDAVFileDirectly instead');
  return null;
}

/**
 * Upload a file to WebDAV
 */
export async function uploadFileToWebDAV(params: WebDAVUploadParams): Promise<WebDAVResponse> {
  try {
    console.log('🔧 Starting WebDAV integration - calling pydio-webdav edge function');
    console.log('📁 File params:', { filename: params.filename, contentLength: params.content.length });
    
    const result = await callSupabaseFunction('pydio-webdav', 'POST', {
      operation: 'upload',
      clientName: params.clientName,
      caseName: params.caseName,
      docType: params.docType,
      fileName: params.filename,
      fileContent: params.content
    });

    console.log('✅ WebDAV upload result:', result);
    
    if (result && result.success) {
      return {
        success: true,
        message: result.message || 'File uploaded successfully to WebDAV'
      };
    } else {
      return {
        success: false,
        message: result?.message || 'Upload failed',
        details: result?.details
      };
    }
  } catch (error) {
    console.error('❌ WebDAV upload error:', error);
    return {
      success: false,
      message: 'WebDAV upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function downloadFileFromWebDAV(params: WebDAVDownloadParams): Promise<WebDAVResponse> {
  try {
    const result = await callSupabaseFunction('pydio-webdav', 'POST', {
      operation: 'download',
      clientName: params.clientName,
      caseName: params.caseName,
      docType: params.docType,
      fileName: params.filename
    });

    if (result && result.success) {
      return {
        success: true,
        message: 'File downloaded successfully from WebDAV',
        details: result.content
      };
    } else {
      return {
        success: false,
        message: result?.message || 'Download failed'
      };
    }
  } catch (error) {
    console.error('WebDAV download error:', error);
    return {
      success: false,
      message: 'WebDAV download failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Legacy aliases
export const uploadFileToPydio = uploadFileToWebDAV;
export const downloadFileFromPydio = downloadFileFromWebDAV;
