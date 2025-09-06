import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { uploadFileToPydio } from '@/lib/pydioIntegration';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileText, X, Loader2 } from 'lucide-react';

interface UploadDocumentForClientDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onUploadSuccess?: () => void;
}

interface UploadFormData {
  files: FileList;
  case_id?: string;
  document_type_id?: string;
  notes?: string;
  confidential: boolean;
  original_copy_retained: boolean;
  certified_copy: boolean;
}

export const UploadDocumentForClientDialog: React.FC<UploadDocumentForClientDialogProps> = ({
  open,
  onClose,
  clientId,
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
    formState: { errors }
  } = useForm<UploadFormData>({
    defaultValues: {
      confidential: false,
      original_copy_retained: false,
      certified_copy: false
    }
  });

  const watchedValues = watch();

  // Fetch client cases for case selection dropdown
  const { data: cases = [] } = useQuery({
    queryKey: ['client-cases', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title, case_number')
        .eq('client_id', clientId)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open && !!clientId
  });

  // Fetch document types
  const { data: documentTypes = [] } = useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .order('category_code', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: open
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      const results = [];
      
      for (const file of selectedFiles) {
        // Upload file to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `client-documents/${clientId}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        // Create document record
        const { data: documentData, error: documentError } = await supabase
          .from('documents')
          .insert({
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: publicUrl,
            client_id: clientId,
            case_id: data.case_id || null,
            document_type_id: data.document_type_id || null,
            notes: data.notes || null,
            confidential: data.confidential,
            original_copy_retained: data.original_copy_retained,
            certified_copy: data.certified_copy,
            uploaded_by_user_id: (await supabase.auth.getUser()).data.user?.id,
            uploaded_by: (await supabase.auth.getUser()).data.user?.id,
            folder_name: 'Client Documents'
          })
          .select()
          .single();

        if (documentError) throw documentError;

        // Also upload to Pydio
        try {
          console.log('Uploading to Pydio:', file.name);
          
          // Handle different file types
          let fileContent: string;
          if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
            fileContent = await file.text();
          } else {
            // For binary files, convert to base64
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            fileContent = btoa(String.fromCharCode(...uint8Array));
          }
          
          const pydioResult = await uploadFileToPydio({
            filename: file.name,
            content: fileContent
          });
          
          if (pydioResult.success) {
            console.log('Pydio upload successful:', pydioResult.message);
          } else {
            console.error('Pydio upload failed:', pydioResult.error);
            // Don't fail the entire upload if Pydio fails, just log the error
          }
        } catch (pydioError) {
          console.error('Error uploading to Pydio:', pydioError);
          // Don't fail the entire upload if Pydio fails
        }

        results.push(documentData);
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', clientId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      
      toast({
        title: "Documents uploaded successfully",
        description: `${results.length} document(s) have been uploaded.`
      });

      onUploadSuccess?.();
      handleClose();
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading the documents. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    reset();
    setSelectedFiles([]);
    onClose();
  };

  const onSubmit = (data: UploadFormData) => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive"
      });
      return;
    }

    uploadMutation.mutate(data);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Group document types by category
  const groupedDocumentTypes = documentTypes.reduce((acc, type) => {
    if (!acc[type.category_code]) {
      acc[type.category_code] = [];
    }
    acc[type.category_code].push(type);
    return acc;
  }, {} as Record<string, typeof documentTypes>);

  const categoryLabels = {
    pleadings: 'Pleadings',
    evidence: 'Evidence',
    court_filings: 'Court Filings',
    client_documents: 'Client Documents',
    judicial_docs: 'Judicial Documents',
    internal_drafts: 'Internal/Drafts',
    miscellaneous: 'Miscellaneous'
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Documents
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* File Selection */}
          <div className="space-y-2">
            <Label htmlFor="files" className="text-sm font-medium">
              Select Files *
            </Label>
            <Input
              id="files"
              type="file"
              multiple
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              className="cursor-pointer"
            />
            <p className="text-xs text-gray-500">
              Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT
            </p>
          </div>

          {/* Selected Files Display */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Selected Files</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Case Selection */}
          <div className="space-y-2">
            <Label htmlFor="case_id" className="text-sm font-medium">
              Associate with Case (Optional)
            </Label>
            <Select onValueChange={(value) => setValue('case_id', value || undefined)} value={watchedValues.case_id || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Select a case (optional)" />
              </SelectTrigger>
              <SelectContent>
                {cases.map((case_) => (
                  <SelectItem key={case_.id} value={case_.id}>
                    {case_.case_title} {case_.case_number && `(${case_.case_number})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="document_type_id" className="text-sm font-medium">
              Document Type
            </Label>
            <Select onValueChange={(value) => setValue('document_type_id', value)} value={watchedValues.document_type_id}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupedDocumentTypes).map(([categoryCode, types]) => (
                  <div key={categoryCode}>
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {categoryLabels[categoryCode as keyof typeof categoryLabels] || categoryCode}
                    </div>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Add any notes about these documents..."
              rows={3}
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confidential"
                checked={watchedValues.confidential}
                onCheckedChange={(checked) => setValue('confidential', !!checked)}
              />
              <Label htmlFor="confidential" className="text-sm">
                Mark as Confidential
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="original_copy_retained"
                checked={watchedValues.original_copy_retained}
                onCheckedChange={(checked) => setValue('original_copy_retained', !!checked)}
              />
              <Label htmlFor="original_copy_retained" className="text-sm">
                Original Copy Retained
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="certified_copy"
                checked={watchedValues.certified_copy}
                onCheckedChange={(checked) => setValue('certified_copy', !!checked)}
              />
              <Label htmlFor="certified_copy" className="text-sm">
                Certified Copy
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploadMutation.isPending || selectedFiles.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Documents
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};