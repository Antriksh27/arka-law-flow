import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, FileText, Plus, Info, Loader2, FolderOpen, User, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ClientSelector } from '@/components/appointments/ClientSelector';
import { StoragePathPreview } from './StoragePathPreview';
import { 
  DOCUMENT_TYPE_HIERARCHY, 
  PRIMARY_DOCUMENT_TYPES, 
  getSubTypes,
  generateStoragePath,
  sanitizeFolderName,
  DOCUMENT_TYPE_ICONS 
} from '@/lib/documentTypes';
import { useIsMobile } from '@/hooks/use-mobile';

interface UploadDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  caseId?: string;
  onUploadSuccess?: () => void;
}

interface UploadFormData {
  files: FileList;
  client_id?: string;
  case_id?: string;
  primary_document_type?: string;
  sub_document_type?: string;
  notes?: string;
  is_evidence: boolean;
  confidential: boolean;
  original_copy_retained: boolean;
  certified_copy: boolean;
}

export const UploadDocumentDialog: React.FC<UploadDocumentDialogProps> = ({
  open,
  onClose,
  caseId,
  onUploadSuccess
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showSuccessOptions, setShowSuccessOptions] = useState(false);
  
  const { data: caseDetails } = useQuery({
    queryKey: ['case-details', caseId],
    queryFn: async () => {
      if (!caseId) return null;
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title, case_number, client_id, clients!inner(id, full_name)')
        .eq('id', caseId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!caseId
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting }
  } = useForm<UploadFormData>({
    defaultValues: {
      client_id: caseDetails?.client_id || '',
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

  React.useEffect(() => {
    if (caseDetails) {
      setValue('case_id', caseDetails.id);
      if (caseDetails.client_id) {
        setValue('client_id', caseDetails.client_id);
      }
    }
  }, [caseDetails, setValue]);
  
  const selectedClientId = watch('client_id');
  const selectedCaseId = watch('case_id');
  const selectedPrimaryType = watch('primary_document_type');
  const selectedSubType = watch('sub_document_type');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-upload'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, full_name')
        .order('full_name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases-for-upload'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title, case_number, client_id')
        .eq('status', 'pending')
        .order('case_title');
      if (error) throw error;
      return data || [];
    }
  });

  const selectedClient = clients.find(c => c.id === selectedClientId);
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
      if (!teamMember || !teamMember.firm_id) {
        throw new Error('Could not determine your firm.');
      }
      const firmId = teamMember.firm_id;
      
      // Max size for JSON(base64) WebDAV upload. Larger files use streaming upload to avoid edge memory limits.
      const MAX_WEBDAV_JSON_SIZE = 10 * 1024 * 1024;
      
      const uploadPromises = selectedFiles.map(async file => {
        const clientName = selectedClient?.full_name || 'General';
        const caseTitle = selectedCase?.case_title || 'General Documents';
        const caseNumber = selectedCase?.case_number || null;
        const primaryType = data.primary_document_type || 'Miscellaneous';
        const subType = data.sub_document_type || 'Other Documents';
        
        const storagePath = generateStoragePath({
          clientName,
          clientId: selectedClientId || 'general',
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
          // Large files: don't call the edge function (it can be unreliable for big payloads).
          // Instead upload directly to Supabase Storage.
          webdavOk = false;
          webdavErrorMessage = `Skipped WebDAV for large file (${(file.size / 1024 / 1024).toFixed(1)}MB > 10MB)`;
        }
        
        // If WebDAV failed or wasn't attempted, use Supabase Storage
        if (!webdavOk) {
          const storagePathFallback = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
          const { error: storageError } = await supabase.storage
            .from('documents')
            .upload(storagePathFallback, file);

          if (storageError) {
            const msg = storageError.message || 'Storage upload failed';
            const looksLikeTooLarge = /payload too large|maximum allowed size|exceeded the maximum/i.test(msg);
            if (looksLikeTooLarge) {
              throw new Error(
                `Upload failed: Supabase Storage rejected the file as too large. Increase the 'documents' bucket file size limit to 200MB (see SQL below).`
              );
            }
            throw new Error(`Upload failed: ${webdavErrorMessage || msg}`);
          }

          const fallbackDocumentData = {
            file_name: file.name,
            file_url: storagePathFallback,
            file_type: file.name.split('.').pop()?.toLowerCase() || null,
            file_size: file.size,
            case_id: (data.case_id && data.case_id !== 'no-case') ? data.case_id : null,
            client_id: data.client_id || null,
            uploaded_by: user.id,
            is_evidence: data.is_evidence,
            uploaded_at: new Date().toISOString(),
            firm_id: firmId,
            folder_name: primaryType,
            primary_document_type: primaryType,
            sub_document_type: subType,
            document_type_id: null,
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
          case_id: (data.case_id && data.case_id !== 'no-case') ? data.case_id : null,
          client_id: data.client_id || null,
          uploaded_by: user.id,
          is_evidence: data.is_evidence,
          uploaded_at: new Date().toISOString(),
          firm_id: firmId,
          folder_name: primaryType,
          primary_document_type: primaryType,
          sub_document_type: subType,
          document_type_id: null,
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
      queryClient.invalidateQueries({ queryKey: ['document-folders'] });
      queryClient.invalidateQueries({ queryKey: ['document-folder-structure'] });
      queryClient.invalidateQueries({ queryKey: ['case-documents'] });
      
      toast({
        title: "Documents uploaded successfully",
        description: `${selectedFiles.length} document(s) uploaded`
      });
      
      if (onUploadSuccess) onUploadSuccess();
      setSelectedFiles([]);
      setShowSuccessOptions(true);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to upload documents",
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

  const handleAddMoreFiles = () => {
    setShowSuccessOptions(false);
    const currentClientId = watch('client_id');
    const currentCaseId = watch('case_id');
    const currentPrimaryType = watch('primary_document_type');
    
    reset({
      client_id: currentClientId,
      case_id: currentCaseId,
      primary_document_type: currentPrimaryType,
      sub_document_type: '',
      notes: '',
      is_evidence: false,
      confidential: false,
      original_copy_retained: false,
      certified_copy: false
    });
  };

  const handleFinishUploading = () => {
    reset();
    setShowSuccessOptions(false);
    onClose();
  };

  const onSubmit = (data: UploadFormData) => {
    if (selectedFiles.length === 0) {
      toast({ title: "No files selected", description: "Please select at least one file", variant: "destructive" });
      return;
    }

    if (!caseId && !data.client_id) {
      toast({ title: "Client required", description: "Please select a client", variant: "destructive" });
      return;
    }

    if (!data.primary_document_type) {
      toast({ title: "Document type required", description: "Please select a document type", variant: "destructive" });
      return;
    }

    if (!data.sub_document_type) {
      toast({ title: "Sub-type required", description: "Please select a sub-type", variant: "destructive" });
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
      <DialogContent 
        className={`${isMobile ? 'h-[100dvh] max-h-[100dvh] w-full max-w-full rounded-none m-0' : 'sm:max-w-2xl max-h-[90vh]'} p-0 gap-0 flex flex-col overflow-hidden`}
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>Upload Documents</DialogTitle>
        </VisuallyHidden>
        <div className="flex flex-col h-full min-h-0 bg-slate-50">
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Upload Documents</h2>
                <p className="text-sm text-muted-foreground mt-1">Add files to your document library</p>
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
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
            <form id="upload-document-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* File Upload Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-sky-500" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">Select Files</span>
                      <span className="text-destructive"> *</span>
                      <p className="text-xs text-muted-foreground">Choose documents to upload</p>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-sky-300 transition-colors bg-slate-50">
                    <input 
                      type="file" 
                      multiple 
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt" 
                      onChange={handleFileSelect} 
                      className="hidden" 
                      id="file-upload" 
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">Click to select files or drag and drop</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, Word, Images, Text files up to 50MB</p>
                    </label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
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
                            onClick={() => removeFile(index)} 
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 rounded-full flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Client & Case Card */}
              {!caseId && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-foreground">Client & Case</span>
                        <span className="text-destructive"> *</span>
                        <p className="text-xs text-muted-foreground">Associate with client and case</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-4 bg-slate-50/50">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Select Client *</Label>
                      <div className="mt-2">
                        <ClientSelector
                          value={selectedClientId || ''}
                          onValueChange={(value) => {
                            setValue('client_id', value);
                            setValue('case_id', 'no-case');
                          }}
                          placeholder="Search and select client..."
                          onClientAdded={(clientId) => {
                            if (clientId) setValue('client_id', clientId);
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assign to Case *</Label>
                      <Select 
                        onValueChange={value => setValue('case_id', value)} 
                        value={selectedCaseId}
                        disabled={!selectedClientId}
                      >
                        <SelectTrigger className="bg-white border-slate-200 rounded-xl h-11 mt-2">
                          <SelectValue placeholder={selectedClientId ? "Select a case..." : "Select client first"} />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 rounded-xl">
                          <SelectItem value="no-case">No Case (General Documents)</SelectItem>
                          {cases
                            .filter(case_item => !selectedClientId || case_item.client_id === selectedClientId)
                            .map(case_item => (
                              <SelectItem key={case_item.id} value={case_item.id}>
                                {case_item.case_title} {case_item.case_number && `(${case_item.case_number})`}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Document Type Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">Document Type</span>
                      <span className="text-destructive"> *</span>
                      <p className="text-xs text-muted-foreground">Categorize your document</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-4 bg-slate-50/50">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Primary Type *</Label>
                    <Select 
                      onValueChange={value => {
                        setValue('primary_document_type', value);
                        setValue('sub_document_type', '');
                      }} 
                      value={selectedPrimaryType}
                    >
                      <SelectTrigger className="bg-white border-slate-200 rounded-xl h-11 mt-2">
                        <SelectValue placeholder="Select document type..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 rounded-xl max-h-[300px]">
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
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sub Type *</Label>
                      <Select 
                        onValueChange={value => setValue('sub_document_type', value)} 
                        value={selectedSubType}
                      >
                        <SelectTrigger className="bg-white border-slate-200 rounded-xl h-11 mt-2">
                          <SelectValue placeholder="Select sub-type..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 rounded-xl">
                          {availableSubTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <StoragePathPreview
                    clientName={selectedClient?.full_name}
                    caseTitle={selectedCase?.case_title}
                    caseNumber={selectedCase?.case_number}
                    primaryType={selectedPrimaryType}
                    subType={selectedSubType}
                    fileName={selectedFiles.length === 1 ? selectedFiles[0].name : selectedFiles.length > 1 ? `${selectedFiles.length} files` : undefined}
                  />
                </div>
              </div>

              {/* Notes Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-sky-500" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">Notes</span>
                      <p className="text-xs text-muted-foreground">Additional information (optional)</p>
                    </div>
                  </div>
                  <Textarea
                    {...register('notes')}
                    placeholder="Add any additional notes about this document..."
                    rows={3}
                    className="bg-slate-50 border-slate-200 rounded-xl resize-none"
                  />
                </div>
              </div>

              {/* Document Properties Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                      <Info className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">Document Properties</span>
                      <p className="text-xs text-muted-foreground">Additional attributes</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <Checkbox
                        id="is_evidence"
                        {...register('is_evidence')}
                        onCheckedChange={(checked) => setValue('is_evidence', !!checked)}
                      />
                      <Label htmlFor="is_evidence" className="text-sm text-foreground cursor-pointer flex-1">
                        Mark as important/evidence
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <Checkbox
                        id="confidential"
                        {...register('confidential')}
                        onCheckedChange={(checked) => setValue('confidential', !!checked)}
                      />
                      <Label htmlFor="confidential" className="text-sm text-foreground cursor-pointer flex-1">
                        Confidential document
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-slate-800 text-white rounded-xl">
                            <p className="text-sm">Only you, admins, and office staff can view confidential documents.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <Checkbox
                        id="certified_copy"
                        {...register('certified_copy')}
                        onCheckedChange={(checked) => setValue('certified_copy', !!checked)}
                      />
                      <Label htmlFor="certified_copy" className="text-sm text-foreground cursor-pointer flex-1">
                        Certified copy
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <Checkbox
                        id="original_copy_retained"
                        {...register('original_copy_retained')}
                        onCheckedChange={(checked) => setValue('original_copy_retained', !!checked)}
                      />
                      <Label htmlFor="original_copy_retained" className="text-sm text-foreground cursor-pointer flex-1">
                        Original copy retained
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-white">
            {showSuccessOptions ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-emerald-600 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Files uploaded successfully!</span>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddMoreFiles}
                    className="min-w-[120px] rounded-full border-slate-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add More
                  </Button>
                  <Button
                    type="button"
                    onClick={handleFinishUploading}
                    className="min-w-[100px] bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={uploadMutation.isPending}
                  className="min-w-[100px] rounded-full border-slate-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  form="upload-document-form"
                  disabled={selectedFiles.length === 0 || uploadMutation.isPending}
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
                      Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
