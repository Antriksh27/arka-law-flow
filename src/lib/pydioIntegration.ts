import { supabase } from '@/integrations/supabase/client';

export interface PydioUploadParams {
  filename: string;
  content: string;
}

export interface PydioDownloadParams {
  filePath: string;
}

export interface PydioResponse {
  success: boolean;
  message: string;
  data?: any;
  content?: string;
  path?: string;
  error?: string;
  details?: string;
}

/**
 * Upload a file to Pydio
 */
export async function uploadFileToPydio(params: PydioUploadParams): Promise<PydioResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('uploadToPydio', {
      body: {
        operation: 'upload',
        filename: params.filename,
        content: params.content,
      },
    });

    if (error) {
      console.error('Error uploading to Pydio:', error);
      return {
        success: false,
        message: 'Failed to upload file',
        error: error.message,
      };
    }

    return data;
  } catch (error) {
    console.error('Unexpected error uploading to Pydio:', error);
    return {
      success: false,
      message: 'Unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Download a file from Pydio
 */
export async function downloadFileFromPydio(params: PydioDownloadParams): Promise<PydioResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('uploadToPydio', {
      body: {
        operation: 'download',
        filePath: params.filePath,
      },
    });

    if (error) {
      console.error('Error downloading from Pydio:', error);
      return {
        success: false,
        message: 'Failed to download file',
        error: error.message,
      };
    }

    return data;
  } catch (error) {
    console.error('Unexpected error downloading from Pydio:', error);
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
  const result = await uploadFileToPydio({
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
  const result = await downloadFileFromPydio({
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
 * Upload document content from the existing document system to Pydio
 */
export async function syncDocumentToPydio(document: {
  file_name: string;
  file_url: string;
}): Promise<PydioResponse> {
  try {
    // First, fetch the content from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_url);

    if (downloadError) {
      throw new Error(`Failed to download from Supabase: ${downloadError.message}`);
    }

    // Convert blob to text
    const content = await fileData.text();

    // Upload to Pydio
    return await uploadFileToPydio({
      filename: document.file_name,
      content,
    });
  } catch (error) {
    console.error('Error syncing document to Pydio:', error);
    return {
      success: false,
      message: 'Failed to sync document to Pydio',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}