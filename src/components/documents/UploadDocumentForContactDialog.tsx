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
      <DialogContent hideCloseButton className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full bg-slate-50">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Upload Document</h2>
                <p className="text-sm text-muted-foreground mt-1">Add document for this contact</p>
              </div>
              <button 
                onClick={onClose}
                className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form id="upload-contact-doc-form" onSubmit={handleSubmit} className="space-y-4">
              {/* File Selection Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-sky-500" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">Select File</span>
                      <span className="text-destructive"> *</span>
                      <p className="text-xs text-muted-foreground">Choose a document to upload</p>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-sky-300 transition-colors bg-slate-50">
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="contact-file-upload"
                    />
                    <label htmlFor="contact-file-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">Click to select a file</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, Word, Images up to 50MB</p>
                    </label>
                  </div>

                  {file && (
                    <div className="mt-4 flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-emerald-700 truncate">{file.name}</p>
                          <p className="text-xs text-emerald-600">{formatFileSize(file.size)}</p>
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
              </div>

              {/* Document Details Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">Document Details</span>
                      <p className="text-xs text-muted-foreground">Title and classification</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Document Title</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter document title (optional)"
                        className="bg-slate-50 border-slate-200 rounded-xl h-11 mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Document Type</Label>
                      <Select value={documentTypeId} onValueChange={setDocumentTypeId}>
                        <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-11 mt-2">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 rounded-xl">
                          {documentTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about this document..."
                        rows={3}
                        className="bg-slate-50 border-slate-200 rounded-xl mt-2 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Properties Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">Properties</span>
                      <p className="text-xs text-muted-foreground">Document attributes</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <Checkbox
                        id="contact-confidential"
                        checked={confidential}
                        onCheckedChange={(checked) => setConfidential(checked === true)}
                      />
                      <Label htmlFor="contact-confidential" className="text-sm text-foreground cursor-pointer flex-1">
                        Mark as Confidential
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <Checkbox
                        id="contact-certifiedCopy"
                        checked={certifiedCopy}
                        onCheckedChange={(checked) => setCertifiedCopy(checked === true)}
                      />
                      <Label htmlFor="contact-certifiedCopy" className="text-sm text-foreground cursor-pointer flex-1">
                        Certified Copy
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <Checkbox
                        id="contact-originalCopyRetained"
                        checked={originalCopyRetained}
                        onCheckedChange={(checked) => setOriginalCopyRetained(checked === true)}
                      />
                      <Label htmlFor="contact-originalCopyRetained" className="text-sm text-foreground cursor-pointer flex-1">
                        Original Copy Retained
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white">
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="min-w-[100px] rounded-full border-slate-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                form="upload-contact-doc-form"
                disabled={uploadMutation.isPending || !file}
                className="min-w-[140px] bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
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
