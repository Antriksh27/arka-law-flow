import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Upload, Loader2 } from 'lucide-react';

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
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [documentTypeId, setDocumentTypeId] = useState('');
  const [confidential, setConfidential] = useState(false);
  const [certifiedCopy, setCertifiedCopy] = useState(false);
  const [originalCopyRetained, setOriginalCopyRetained] = useState(false);

  // Fetch document types
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

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `contacts/${contactId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Create document record
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
      console.error('Upload error:', error);
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select File *</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            {file && (
              <p className="text-sm text-gray-500">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type</Label>
            <Select value={documentTypeId} onValueChange={setDocumentTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {documentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this document"
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confidential"
                checked={confidential}
                onCheckedChange={(checked) => setConfidential(checked === true)}
              />
              <Label htmlFor="confidential" className="cursor-pointer">
                Mark as Confidential
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="certifiedCopy"
                checked={certifiedCopy}
                onCheckedChange={(checked) => setCertifiedCopy(checked === true)}
              />
              <Label htmlFor="certifiedCopy" className="cursor-pointer">
                Certified Copy
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="originalCopyRetained"
                checked={originalCopyRetained}
                onCheckedChange={(checked) => setOriginalCopyRetained(checked === true)}
              />
              <Label htmlFor="originalCopyRetained" className="cursor-pointer">
                Original Copy Retained
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploadMutation.isPending || !file}>
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
        </form>
      </DialogContent>
    </Dialog>
  );
};
