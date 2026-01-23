import * as tus from 'tus-js-client';
import { supabase } from '@/integrations/supabase/client';

type ResumableUploadParams = {
  bucket: string;
  objectPath: string;
  file: File;
  upsert?: boolean;
  cacheControl?: number;
  onProgress?: (percent: number) => void;
};

// Hardcoded Supabase project ref (extracted from client URL)
const SUPABASE_PROJECT_REF = 'hpcnipcbymruvsnqrmjx';

function getTusEndpoint(): string {
  // Supabase docs recommend using the direct storage hostname for TUS
  return `https://${SUPABASE_PROJECT_REF}.supabase.co/storage/v1/upload/resumable`;
}

export async function uploadResumableToSupabaseStorage({
  bucket,
  objectPath,
  file,
  upsert = false,
  cacheControl = 3600,
  onProgress,
}: ResumableUploadParams): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const endpoint = getTusEndpoint();
  console.log(`📤 Starting resumable upload to ${endpoint}, bucket=${bucket}, path=${objectPath}, size=${(file.size / 1024 / 1024).toFixed(1)}MB`);

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${token}`,
        'x-upsert': upsert ? 'true' : 'false',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName: objectPath,
        contentType: file.type || 'application/octet-stream',
        cacheControl: String(cacheControl),
      },
      // Supabase currently requires 6MB chunkSize for resumable uploads
      chunkSize: 6 * 1024 * 1024,
      onError: (error) => {
        console.error('❌ Resumable upload error:', error);
        reject(new Error(`Resumable upload failed: ${error.message || error}`));
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const pct = bytesTotal ? (bytesUploaded / bytesTotal) * 100 : 0;
        console.log(`📤 Upload progress: ${pct.toFixed(1)}%`);
        onProgress?.(pct);
      },
      onSuccess: () => {
        console.log('✅ Resumable upload completed successfully');
        resolve();
      },
    });

    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length) {
        console.log('🔄 Resuming previous upload...');
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      upload.start();
    }).catch((err) => {
      console.error('❌ Error finding previous uploads:', err);
      upload.start();
    });
  });
}