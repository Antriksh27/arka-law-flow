import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type FileAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export const useFileUpload = (threadId: string | null) => {
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" is too large. Maximum size is 10MB.`;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `File type "${file.type}" is not allowed.`;
    }
    return null;
  };

  const uploadFiles = async (files: File[]): Promise<FileAttachment[]> => {
    if (!threadId || !user) {
      throw new Error('Thread ID and user required for upload');
    }

    // Validate all files first
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        toast({
          title: 'Upload Error',
          description: error,
          variant: 'destructive',
        });
        throw new Error(error);
      }
    }

    setIsUploading(true);
    const uploadedAttachments: FileAttachment[] = [];

    try {
      for (const file of files) {
        const fileId = crypto.randomUUID();
        const filePath = `${threadId}/${user.id}/${fileId}-${file.name}`;

        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        const { data, error } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));

        const {
          data: { publicUrl },
        } = supabase.storage.from('chat-attachments').getPublicUrl(data.path);

        uploadedAttachments.push({
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
        });
      }

      return uploadedAttachments;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload files. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  return {
    uploadFiles,
    uploadProgress,
    isUploading,
    validateFile,
  };
};
