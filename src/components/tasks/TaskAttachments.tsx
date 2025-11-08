import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Paperclip, Download, Trash2, Upload, FileText, Image as ImageIcon, File } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TaskAttachmentsProps {
  taskId: string;
  attachments: string[];
}

export const TaskAttachments: React.FC<TaskAttachmentsProps> = ({ taskId, attachments = [] }) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}/${Date.now()}.${fileExt}`;
      const filePath = `task-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Get current attachments
      const { data: task } = await (supabase as any)
        .from('tasks')
        .select('attachments')
        .eq('id', taskId)
        .single();

      const currentAttachments = (task?.attachments as string[]) || [];
      const updatedAttachments = [...currentAttachments, publicUrl];

      // Update task
      const { error: updateError } = await (supabase as any)
        .from('tasks')
        .update({ attachments: updatedAttachments } as any)
        .eq('id', taskId);

      if (updateError) throw updateError;

      // Log to history
      await (supabase as any).from('task_history').insert({
        task_id: taskId,
        action: 'attachment_added',
        changes: { file_name: file.name, file_url: publicUrl }
      } as any);

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      toast({ title: 'File uploaded successfully' });
      setUploading(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to upload file',
        description: error.message,
        variant: 'destructive',
      });
      setUploading(false);
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileUrl: string) => {
      // Get current attachments
      const { data: task } = await (supabase as any)
        .from('tasks')
        .select('attachments')
        .eq('id', taskId)
        .single();

      const currentAttachments = (task?.attachments as string[]) || [];
      const updatedAttachments = currentAttachments.filter((url: string) => url !== fileUrl);

      // Update task
      const { error } = await (supabase as any)
        .from('tasks')
        .update({ attachments: updatedAttachments } as any)
        .eq('id', taskId);

      if (error) throw error;

      // Delete from storage
      const filePath = fileUrl.split('/documents/')[1];
      if (filePath) {
        await supabase.storage.from('documents').remove([filePath]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      toast({ title: 'File deleted successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete file',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'File size must be less than 10MB',
          variant: 'destructive',
        });
        return;
      }
      uploadFileMutation.mutate(file);
    }
  };

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <ImageIcon className="w-5 h-5 text-blue-600" />;
    }
    if (['pdf'].includes(ext || '')) {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    return <File className="w-5 h-5 text-gray-600" />;
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    return decodeURIComponent(parts[parts.length - 1]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-gray-500" />
          <h3 className="font-medium text-gray-900">Attachments</h3>
          <span className="text-sm text-gray-500">({attachments.length})</span>
        </div>
        <label>
          <input
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
            onClick={(e) => {
              e.preventDefault();
              e.currentTarget.previousElementSibling?.dispatchEvent(new MouseEvent('click'));
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </label>
      </div>

      {/* Attachments List */}
      <div className="space-y-2">
        {attachments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Paperclip className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No attachments yet</p>
          </div>
        ) : (
          attachments.map((url, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(url)}
                <span className="text-sm text-gray-700 truncate">{getFileName(url)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(url, '_blank')}
                  className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteFileMutation.mutate(url)}
                  disabled={deleteFileMutation.isPending}
                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
