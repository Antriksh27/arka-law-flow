
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UploadDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  caseId?: string;
  onUploadSuccess?: () => void;
}

interface UploadFormData {
  files: FileList;
  case_id?: string;
  is_evidence: boolean;
}

export const UploadDocumentDialog: React.FC<UploadDocumentDialogProps> = ({
  open,
  onClose,
  caseId,
  onUploadSuccess
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting }
  } = useForm<UploadFormData>({
    defaultValues: {
      case_id: caseId || 'all',
      is_evidence: false
    }
  });
  
  const selectedCaseId = watch('case_id');
  const isImportant = watch('is_evidence');

  // Fetch cases for dropdown
  const {
    data: cases = []
  } = useQuery({
    queryKey: ['cases-for-upload'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('cases').select('id, title').eq('status', 'open').order('title');
      if (error) throw error;
      return data || [];
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');
      const uploadPromises = selectedFiles.map(async file => {
        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const filename = `${timestamp}-${file.name}`;

        // Upload file to storage
        const {
          data: uploadData,
          error: uploadError
        } = await supabase.storage.from('documents').upload(filename, file);
        if (uploadError) throw uploadError;

        // Create document record
        const {
          error: insertError
        } = await supabase.from('documents').insert({
          file_name: file.name,
          file_url: uploadData.path,
          file_type: fileExtension,
          file_size: file.size,
          case_id: data.case_id === 'all' ? null : data.case_id,
          uploaded_by: user.data.user.id,
          is_evidence: data.is_evidence
        });
        if (insertError) throw insertError;
      });
      await Promise.all(uploadPromises);
    },
    onSuccess: () => {
      // Invalidate all document-related queries
      queryClient.invalidateQueries({
        queryKey: ['documents']
      });
      queryClient.invalidateQueries({
        queryKey: ['document-folders']
      });
      queryClient.invalidateQueries({
        queryKey: ['case-documents']
      });
      
      toast({
        title: "Documents uploaded successfully"
      });
      
      // Call the callback to refresh parent component
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      
      reset();
      setSelectedFiles([]);
      onClose();
    },
    onError: error => {
      toast({
        title: "Failed to upload documents",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: UploadFormData) => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload",
        variant: "destructive"
      });
      return;
    }

    uploadMutation.mutate(data);
  };

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border border-gray-200 shadow-lg">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Documents
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          {/* File Upload Area */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Select Files
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt" onChange={handleFileSelect} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Click to select files or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, Word, Images, Text files up to 50MB
                </p>
              </label>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Selected Files ({selectedFiles.length})
                </Label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                  {selectedFiles.map((file, index) => <div key={index} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>)}
                </div>
              </div>}
          </div>

          {/* Case Assignment */}
          <div className="space-y-2">
            <Label htmlFor="case_id" className="text-sm font-medium text-gray-700">
              Assign to Case (Optional)
            </Label>
            <Select onValueChange={value => setValue('case_id', value)} defaultValue={caseId || 'all'}>
              <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select a case..." />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                <SelectItem value="all" className="hover:bg-gray-50">No Case (General Documents)</SelectItem>
                {cases.map(case_item => (
                  <SelectItem key={case_item.id} value={case_item.id} className="hover:bg-gray-50">
                    {case_item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Important Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="is_evidence" 
              checked={isImportant} 
              onCheckedChange={checked => setValue('is_evidence', !!checked)} 
            />
            <Label htmlFor="is_evidence" className="text-sm font-medium text-gray-700">
              Mark as Important
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} className="px-6 py-2 border-gray-300 text-slate-50 bg-red-700 hover:bg-red-600">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || selectedFiles.length === 0} className="px-6 py-2 bg-primary hover:bg-primary/90 text-white">
              {isSubmitting ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
