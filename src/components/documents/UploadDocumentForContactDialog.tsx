import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, X, FileText, FolderOpen, Shield } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface UploadDocumentForContactDialogProps {
  open: boolean;
  onClose: () => void;
  contactId: string;
  onUploadSuccess?: () => void;
}

export const UploadDocumentForContactDialog: React.FC<UploadDocumentForContactDialogProps> = ({
  open,
  onClose,
  contactId,
  onUploadSuccess
}) => {
  const { toast } = useToast();
  const { user, firmId } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [documentTypeId, setDocumentTypeId] = useState('');
  const [confidential, setConfidential] = useState(false);
  const [certifiedCopy, setCertifiedCopy] = useState(false);
  const [originalCopyRetained, setOriginalCopyRetained] = useState(false);

  const { data: documentTypes = [] } = useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !user) throw new Error('No file or user');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `contacts/${contactId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          title: title || file.name,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          contact_id: contactId,
          document_type_id: documentTypeId || null,
          notes: notes || null,
          confidential,
          certified_copy: certifiedCopy,
          original_copy_retained: originalCopyRetained,
          uploaded_by: user.id,
          firm_id: firmId
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast({ title: 'Document uploaded successfully' });
      queryClient.invalidateQueries({ queryKey: ['contact-documents', contactId] });
      resetForm();
      onClose();
      onUploadSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setNotes('');
    setDocumentTypeId('');
    setConfidential(false);
    setCertifiedCopy(false);
    setOriginalCopyRetained(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive'
      });
      return;
    }
    uploadMutation.mutate();
  };

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'h-[100dvh] max-h-[100dvh] w-full max-w-full rounded-none m-0' : 'sm:max-w-lg max-h-[90vh]'} p-0 gap-0 overflow-hidden`}>
        <div className="flex flex-col h-full bg-slate-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <Upload className="w-5 h-5 text-sky-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Upload Document</h2>
                <p className="text-xs text-slate-500">Add document for this contact</p>
              </div>
            </div>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <form id="upload-contact-doc-form" onSubmit={handleSubmit} className="space-y-4">
              {/* File Selection Card */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-violet-500" />
                  </div>
                  <span className="font-medium text-slate-700">Select File</span>
                </div>

                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-sky-300 transition-colors">
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="contact-file-upload"
                  />
                  <label htmlFor="contact-file-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Click to select a file</p>
                  </label>
                </div>

                {file && (
                  <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                        <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setFile(null)} 
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 rounded-full flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Document Details Card */}
              <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <FolderOpen className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="font-medium text-slate-700">Document Details</span>
                </div>

                <div>
                  <Label className="text-sm text-slate-600">Document Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter document title (optional)"
                    className="rounded-xl h-11 mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm text-slate-600">Document Type</Label>
                  <Select value={documentTypeId} onValueChange={setDocumentTypeId}>
                    <SelectTrigger className="rounded-xl h-11 mt-2">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm text-slate-600">Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this document"
                    rows={3}
                    className="rounded-xl mt-2"
                  />
                </div>
              </div>

              {/* Document Properties Card */}
              <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="font-medium text-slate-700">Properties</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50">
                    <Checkbox
                      id="contact-confidential"
                      checked={confidential}
                      onCheckedChange={(checked) => setConfidential(checked === true)}
                    />
                    <Label htmlFor="contact-confidential" className="text-sm text-slate-600 cursor-pointer">
                      Mark as Confidential
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50">
                    <Checkbox
                      id="contact-certifiedCopy"
                      checked={certifiedCopy}
                      onCheckedChange={(checked) => setCertifiedCopy(checked === true)}
                    />
                    <Label htmlFor="contact-certifiedCopy" className="text-sm text-slate-600 cursor-pointer">
                      Certified Copy
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50">
                    <Checkbox
                      id="contact-originalCopyRetained"
                      checked={originalCopyRetained}
                      onCheckedChange={(checked) => setOriginalCopyRetained(checked === true)}
                    />
                    <Label htmlFor="contact-originalCopyRetained" className="text-sm text-slate-600 cursor-pointer">
                      Original Copy Retained
                    </Label>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-full h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="upload-contact-doc-form"
                disabled={uploadMutation.isPending || !file}
                className="flex-1 rounded-full h-11"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
