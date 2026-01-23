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

function getProjectRefFromSupabaseUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    const ref = hostname.split('.')[0];
    return ref || null;
  } catch {
    return null;
  }
}

function getSupabaseUrlFromClient(): string | null {
  // SupabaseClient isn't guaranteed to expose this publicly in types, but it does at runtime.
  const anyClient = supabase as any;
  return (anyClient?.supabaseUrl as string | undefined) ?? null;
}

function getTusEndpoint(): string {
  const supabaseUrl = getSupabaseUrlFromClient();
  const ref = supabaseUrl ? getProjectRefFromSupabaseUrl(supabaseUrl) : null;
  if (!ref) {
    // Fallback for unexpected client shapes
    throw new Error('Could not determine Supabase project ref for resumable upload');
  }
  // Supabase docs recommend using the direct storage hostname for TUS
  return `https://${ref}.storage.supabase.co/storage/v1/upload/resumable`;
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
      onError: (error) => reject(error),
      onProgress: (bytesUploaded, bytesTotal) => {
        const pct = bytesTotal ? (bytesUploaded / bytesTotal) * 100 : 0;
        onProgress?.(pct);
      },
      onSuccess: () => resolve(),
    });

    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      upload.start();
    });
  });
}
