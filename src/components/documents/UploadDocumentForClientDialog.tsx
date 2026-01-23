import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, FileText, FolderOpen, FileType, MessageSquare, Shield } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { StoragePathPreview } from './StoragePathPreview';
import { 
  PRIMARY_DOCUMENT_TYPES, 
  getSubTypes,
  generateStoragePath,
  sanitizeFolderName,
  DOCUMENT_TYPE_ICONS 
} from '@/lib/documentTypes';

interface UploadDocumentForClientDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  caseId?: string;
  onUploadSuccess?: () => void;
}

interface UploadFormData {
  files: FileList;
  case_id?: string;
  primary_document_type?: string;
  sub_document_type?: string;
  notes?: string;
  is_evidence: boolean;
  confidential: boolean;
  original_copy_retained: boolean;
  certified_copy: boolean;
}

export const UploadDocumentForClientDialog: React.FC<UploadDocumentForClientDialogProps> = ({
  open,
  onClose,
  clientId,
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
      case_id: caseId || 'no-case',
      primary_document_type: '',
      sub_document_type: '',
      notes: '',
      is_evidence: false,
      confidential: false,
      original_copy_retained: false,
      certified_copy: false
    }
  });
  
  const selectedCaseId = watch('case_id');
  const selectedPrimaryType = watch('primary_document_type');
  const selectedSubType = watch('sub_document_type');

  const { data: client } = useQuery({
    queryKey: ['client-basic', clientId],
    enabled: open && !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, full_name')
        .eq('id', clientId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases-for-client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title, case_number')
        .eq('client_id', clientId)
        .eq('status', 'pending')
        .order('case_title');
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId
  });

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data: teamMember, error: firmError } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (firmError) throw firmError;
      if (!teamMember?.firm_id) throw new Error('Could not determine your firm.');

      // Max size for JSON(base64) WebDAV upload. Larger files use streaming upload to avoid edge memory limits.
      const MAX_WEBDAV_JSON_SIZE = 10 * 1024 * 1024;
      
      const uploadPromises = selectedFiles.map(async file => {
        const clientName = client?.full_name || 'Unknown Client';
        const caseTitle = (selectedCaseId && selectedCaseId !== 'no-case' && selectedCase) 
          ? selectedCase.case_title 
          : 'General Documents';
        const caseNumber = selectedCase?.case_number || null;
        
        const primaryType = data.primary_document_type || 'Miscellaneous';
        const subType = data.sub_document_type || 'Other Documents';
        
        const storagePath = generateStoragePath({
          clientName,
          clientId,
          caseTitle,
          caseNumber,
          primaryType,
          subType,
          fileName: file.name
        });
        
        // Sanitize names for WebDAV compatibility
        const sanitizedClientName = sanitizeFolderName(clientName);
        const sanitizedCaseName = caseNumber 
          ? `${sanitizeFolderName(caseTitle)}_${sanitizeFolderName(caseNumber)}`
          : sanitizeFolderName(caseTitle);
        const sanitizedCategory = sanitizeFolderName(primaryType);
        const sanitizedDocType = sanitizeFolderName(subType);
        
        let webdavOk = false;
        let webdavPath: string | undefined = undefined;
        let webdavErrorMessage: string | undefined = undefined;
        
        // For smaller files, use JSON + base64
        if (file.size <= MAX_WEBDAV_JSON_SIZE) {
          let fileContent: string;
          if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
            fileContent = await file.text();
          } else {
            fileContent = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1] || result;
                resolve(base64);
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          }
          
          const { data: pydioResult, error: pydioError } = await supabase.functions.invoke('pydio-webdav', {
            body: {
              clientName: sanitizedClientName,
              caseName: sanitizedCaseName,
              category: sanitizedCategory,
              docType: sanitizedDocType,
              fileName: file.name,
              fileContent: fileContent
            }
          });
          
          webdavOk = !!pydioResult?.success && !pydioError;
          webdavPath = pydioResult?.path;
          if (!webdavOk) {
            webdavErrorMessage = pydioError?.message || pydioResult?.error || 'Unknown WebDAV error';
          }
        } else {
          // For large files, stream raw bytes to the edge function (no base64)
          const { data: pydioResult, error: pydioError } = await supabase.functions.invoke('pydio-webdav', {
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
              'x-client-name': sanitizedClientName,
              'x-case-name': sanitizedCaseName,
              'x-category': sanitizedCategory,
              'x-doc-type': sanitizedDocType,
              'x-file-name': encodeURIComponent(file.name),
            },
            body: file,
          });

          webdavOk = !!pydioResult?.success && !pydioError;
          webdavPath = pydioResult?.path;
          if (!webdavOk) {
            webdavErrorMessage = pydioError?.message || pydioResult?.error || 'Unknown WebDAV error';
          }
        }
        
        // If WebDAV failed or wasn't attempted, use Supabase Storage
        if (!webdavOk) {
          console.warn('⚠️ WebDAV upload failed or skipped, falling back to Supabase Storage:', webdavErrorMessage);

          const storagePathFallback = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
          const { error: storageError } = await supabase.storage
            .from('documents')
            .upload(storagePathFallback, file);

          if (storageError) {
            console.error('❌ Supabase storage upload failed as fallback:', storageError);
            throw new Error(`Upload failed: ${webdavErrorMessage || storageError.message}`);
          }

          const fallbackDocumentData = {
            file_name: file.name,
            file_url: storagePathFallback,
            file_type: file.name.split('.').pop()?.toLowerCase() || null,
            file_size: file.size,
            client_id: clientId,
            case_id: (data.case_id && data.case_id !== 'no-case') ? data.case_id : null,
            uploaded_by: user.id,
            is_evidence: data.is_evidence,
            uploaded_at: new Date().toISOString(),
            firm_id: teamMember.firm_id,
            folder_name: primaryType,
            notes: data.notes || null,
            confidential: data.confidential || false,
            original_copy_retained: data.original_copy_retained || false,
            certified_copy: data.certified_copy || false,
            webdav_synced: false,
            webdav_path: storagePath,
            webdav_error: webdavErrorMessage,
            sync_attempted_at: new Date().toISOString(),
          };

          const { data: insertData, error: insertError } = await supabase
            .from('documents')
            .insert(fallbackDocumentData)
            .select('id, file_name, file_url')
            .single();
          
          if (insertError) throw insertError;
          return insertData;
        }

        // WebDAV succeeded
        const documentData = {
          file_name: file.name,
          file_url: webdavPath || storagePath,
          file_type: file.name.split('.').pop()?.toLowerCase() || null,
          file_size: file.size,
          client_id: clientId,
          case_id: (data.case_id && data.case_id !== 'no-case') ? data.case_id : null,
          uploaded_by: user.id,
          is_evidence: data.is_evidence,
          uploaded_at: new Date().toISOString(),
          firm_id: teamMember.firm_id,
          folder_name: primaryType,
          notes: data.notes || null,
          confidential: data.confidential || false,
          original_copy_retained: data.original_copy_retained || false,
          certified_copy: data.certified_copy || false,
          webdav_synced: true,
          webdav_path: storagePath,
          synced_at: new Date().toISOString()
        };

        const { data: insertData, error: insertError } = await supabase
          .from('documents')
          .insert(documentData)
          .select('id, file_name, file_url')
          .single();
        
        if (insertError) throw insertError;
        return insertData;
      });
      
      return await Promise.all(uploadPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-folder-structure'] });
      
      toast({
        title: "Documents uploaded successfully",
        description: `${selectedFiles.length} document(s) uploaded for ${client?.full_name}`
      });
      
      reset();
      setSelectedFiles([]);
      onClose();
      onUploadSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || 'An error occurred during upload',
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

    if (!data.primary_document_type) {
      toast({
        title: "Document type required",
        description: "Please select a primary document type",
        variant: "destructive"
      });
      return;
    }

    if (!data.sub_document_type) {
      toast({
        title: "Sub-type required",
        description: "Please select a document sub-type",
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

  const availableSubTypes = selectedPrimaryType ? getSubTypes(selectedPrimaryType) : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full bg-slate-50">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Upload Document</h2>
                <p className="text-sm text-muted-foreground mt-1">Add document for {client?.full_name}</p>
              </div>
              <button 
                onClick={onClose}
                className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* File Upload Card */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                    <Upload className="w-5 h-5 text-sky-500" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <Label className="text-sm font-medium text-foreground">Select Files</Label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-slate-50/50">
                      <input 
                        type="file" 
                        multiple 
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt" 
                        onChange={handleFileSelect} 
                        className="hidden" 
                        id="file-upload-client" 
                      />
                      <label htmlFor="file-upload-client" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Click to select files or drag and drop</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, Word, Images, Text files up to 200MB</p>
                      </label>
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Selected Files ({selectedFiles.length})</Label>
                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-amber-500" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeFile(index)} 
                                className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-rose-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Case Assignment Card */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-5 h-5 text-violet-500" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <Label className="text-sm font-medium text-foreground">Assign to Case (Optional)</Label>
                    <Select onValueChange={value => setValue('case_id', value)} value={selectedCaseId}>
                      <SelectTrigger className="rounded-xl border-slate-200">
                        <SelectValue placeholder="Select a case..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl z-50">
                        <SelectItem value="no-case">No Case (General Documents)</SelectItem>
                        {cases.map(case_item => (
                          <SelectItem key={case_item.id} value={case_item.id}>
                            {case_item.case_title} {case_item.case_number && `(${case_item.case_number})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Document Type Card */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <FileType className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-foreground">
                        Document Type <span className="text-destructive">*</span>
                      </Label>
                      <Select 
                        onValueChange={value => {
                          setValue('primary_document_type', value);
                          setValue('sub_document_type', '');
                        }} 
                        value={selectedPrimaryType}
                      >
                        <SelectTrigger className="rounded-xl border-slate-200">
                          <SelectValue placeholder="Select document type..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl z-50 max-h-[300px]">
                          {PRIMARY_DOCUMENT_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              <span className="flex items-center gap-2">
                                <span>{DOCUMENT_TYPE_ICONS[type] || '📄'}</span>
                                <span>{type}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedPrimaryType && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-foreground">
                          Sub Type <span className="text-destructive">*</span>
                        </Label>
                        <Select 
                          onValueChange={value => setValue('sub_document_type', value)} 
                          value={selectedSubType}
                        >
                          <SelectTrigger className="rounded-xl border-slate-200">
                            <SelectValue placeholder="Select sub-type..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl z-50">
                            {availableSubTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Storage Path Preview */}
              <StoragePathPreview
                clientName={client?.full_name}
                caseTitle={selectedCase?.case_title}
                caseNumber={selectedCase?.case_number}
                primaryType={selectedPrimaryType}
                subType={selectedSubType}
                fileName={selectedFiles.length === 1 ? selectedFiles[0].name : selectedFiles.length > 1 ? `${selectedFiles.length} files` : undefined}
              />

              {/* Notes Card */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <Label className="text-sm font-medium text-foreground">Notes (Optional)</Label>
                    <Textarea
                      {...register('notes')}
                      placeholder="Add any additional notes about this document..."
                      rows={3}
                      className="rounded-xl border-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Document Properties Card */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <Label className="text-sm font-medium text-foreground">Document Properties</Label>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <Checkbox
                          id="is_evidence_client"
                          {...register('is_evidence')}
                          onCheckedChange={(checked) => setValue('is_evidence', !!checked)}
                        />
                        <Label htmlFor="is_evidence_client" className="text-sm text-muted-foreground cursor-pointer flex-1">
                          Mark as important/evidence
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <Checkbox
                          id="confidential_client"
                          {...register('confidential')}
                          onCheckedChange={(checked) => setValue('confidential', !!checked)}
                        />
                        <Label htmlFor="confidential_client" className="text-sm text-muted-foreground cursor-pointer flex-1">
                          Confidential document
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center cursor-help">
                                <span className="text-xs text-slate-500">?</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs bg-slate-900 text-white rounded-xl">
                              <p className="text-sm">Only you, admins, and office staff can view confidential documents.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <Checkbox
                          id="certified_copy_client"
                          {...register('certified_copy')}
                          onCheckedChange={(checked) => setValue('certified_copy', !!checked)}
                        />
                        <Label htmlFor="certified_copy_client" className="text-sm text-muted-foreground cursor-pointer flex-1">
                          Certified copy
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <Checkbox
                          id="original_copy_retained_client"
                          {...register('original_copy_retained')}
                          onCheckedChange={(checked) => setValue('original_copy_retained', !!checked)}
                        />
                        <Label htmlFor="original_copy_retained_client" className="text-sm text-muted-foreground cursor-pointer flex-1">
                          Original copy retained
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4">
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={uploadMutation.isPending}
                  className="rounded-full px-6 border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={selectedFiles.length === 0 || uploadMutation.isPending}
                  className="rounded-full px-6 bg-primary hover:bg-primary/90 min-w-[120px]"
                >
                  {uploadMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </div>
                  ) : (
                    `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
