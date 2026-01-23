import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = 'https://hpcnipcbymruvsnqrmjx.supabase.co';

export interface StreamingUploadOptions {
  file: File;
  clientName: string;
  caseName: string;
  category: string;
  docType: string;
  onProgress?: (percent: number) => void;
  abortSignal?: AbortSignal;
}

export interface StreamingUploadResult {
  success: boolean;
  path?: string;
  error?: string;
}

/**
 * Upload a large file to WebDAV using XMLHttpRequest for progress tracking
 */
export function uploadWebDAVStreaming({
  file,
  clientName,
  caseName,
  category,
  docType,
  onProgress,
  abortSignal,
}: StreamingUploadOptions): Promise<StreamingUploadResult> {
  return new Promise(async (resolve, reject) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return resolve({ success: false, error: 'Not authenticated' });
      }

      const functionUrl = `${SUPABASE_URL}/functions/v1/pydio-webdav`;
      
      const xhr = new XMLHttpRequest();
      
      // Handle abort signal
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          xhr.abort();
        });
      }
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = (event.loaded / event.total) * 100;
          onProgress(percent);
        }
      });
      
      // Handle completion
      xhr.addEventListener('load', () => {
        try {
          const result = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && result.success) {
            resolve({ success: true, path: result.path });
          } else {
            resolve({ 
              success: false, 
              error: result.error || result.details || `HTTP ${xhr.status}: ${xhr.statusText}` 
            });
          }
        } catch (e) {
          resolve({ 
            success: false, 
            error: `Failed to parse response: ${xhr.responseText?.slice(0, 200)}` 
          });
        }
      });
      
      // Handle errors
      xhr.addEventListener('error', () => {
        resolve({ success: false, error: 'Network error during upload' });
      });
      
      xhr.addEventListener('abort', () => {
        resolve({ success: false, error: 'Upload cancelled' });
      });
      
      xhr.addEventListener('timeout', () => {
        resolve({ success: false, error: 'Upload timed out' });
      });
      
      // Open connection
      xhr.open('POST', functionUrl, true);
      
      // Set headers
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
      xhr.setRequestHeader('x-client-name', encodeURIComponent(clientName));
      xhr.setRequestHeader('x-case-name', encodeURIComponent(caseName));
      xhr.setRequestHeader('x-category', encodeURIComponent(category));
      xhr.setRequestHeader('x-doc-type', encodeURIComponent(docType));
      xhr.setRequestHeader('x-file-name', encodeURIComponent(file.name));
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      
      // Set a generous timeout (10 minutes for large files)
      xhr.timeout = 10 * 60 * 1000;
      
      console.log(`📤 Starting WebDAV streaming upload for ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      
      // Send the file
      xhr.send(file);
      
    } catch (err: any) {
      resolve({ success: false, error: err?.message || String(err) });
    }
  });
}
