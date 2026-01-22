import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, FileText, Plus, Info } from 'lucide-react';
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
  DOCUMENT_TYPE_ICONS 
} from '@/lib/documentTypes';

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showSuccessOptions, setShowSuccessOptions] = useState(false);
  
  // Fetch case details if caseId is provided
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

  // Update form values when case details are loaded
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

  // Fetch clients
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

  // Fetch cases for dropdown
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

  // Get the selected client and case details for path preview
  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedCase = cases.find(c => c.id === selectedCaseId);

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('Not authenticated');
        }

        // Get current user's firm
        const { data: teamMember, error: firmError } = await supabase
          .from('team_members')
          .select('firm_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (firmError) throw firmError;
        if (!teamMember || !teamMember.firm_id) {
          throw new Error('Could not determine your firm. Please ensure you are part of a team.');
        }
        const firmId = teamMember.firm_id;
        
        console.log('Starting upload for files:', selectedFiles.length);
        
        const uploadPromises = selectedFiles.map(async file => {
          try {
            console.log(`Uploading file: ${file.name} directly to WebDAV`);

            // Handle different file types for WebDAV upload
            let fileContent: string;
            if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
              fileContent = await file.text();
              console.log('Text file content length:', fileContent.length);
            } else {
              // For binary files, convert to base64 using FileReader
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
              console.log('Binary file converted to base64, length:', fileContent.length);
            }

            // Get client and case names for folder structure  
            const clientName = selectedClient?.full_name || 'General';
            const caseTitle = selectedCase?.case_title || 'General Documents';
            const caseNumber = selectedCase?.case_number || null;
            
            const primaryType = data.primary_document_type || 'Miscellaneous';
            const subType = data.sub_document_type || 'Other Documents';
            
            // Generate structured storage path
            const storagePath = generateStoragePath({
              clientName,
              clientId: selectedClientId || 'general',
              caseTitle,
              caseNumber,
              primaryType,
              subType,
              fileName: file.name
            });
            
            console.log('Calling pydio-webdav function with structured path...');
            const { data: pydioResult, error: pydioError } = await supabase.functions.invoke('pydio-webdav', {
              body: {
                clientName,
                caseName: caseNumber ? `${caseTitle}_${caseNumber}` : caseTitle,
                category: primaryType,
                docType: subType,
                fileName: file.name,
                fileContent: fileContent
              }
            });
            
            console.log('WebDAV result:', pydioResult);
            console.log('WebDAV error:', pydioError);
            
            let webdavOk = !!pydioResult?.success && !pydioError;
            let webdavPath: string | undefined = pydioResult?.path;
            let webdavErrorMessage: string | undefined = undefined;

            // If WebDAV failed, gracefully fall back to Supabase Storage
            if (!webdavOk) {
              webdavErrorMessage = pydioError?.message || pydioResult?.error || 'Unknown WebDAV error';
              console.warn('⚠️ WebDAV upload failed, falling back to Supabase Storage:', webdavErrorMessage);

              const storagePathFallback = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
              const { error: storageError } = await supabase.storage
                .from('documents')
                .upload(storagePathFallback, file);

              if (storageError) {
                console.error('❌ Supabase storage upload failed as fallback:', storageError);
                throw new Error(`Upload failed (WebDAV + fallback): ${webdavErrorMessage}`);
              }

              // Insert document record pointing to Supabase Storage
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

              if (insertError) {
                console.error('Database insert error (fallback):', insertError);
                throw insertError;
              }

              console.log('✅ Fallback upload (Supabase Storage) successful:', insertData);
              return insertData;
            }

            console.log('✅ WebDAV upload successful:', pydioResult.message);

            // Insert document record in database (WebDAV path)
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

            console.log('Creating document record:', documentData);

            const { data: insertData, error: insertError } = await supabase
              .from('documents')
              .insert(documentData)
              .select('id, file_name, file_url')
              .single();
            
            if (insertError) {
              console.error('Database insert error:', insertError);
              throw insertError;
            }

            console.log('Document record created successfully:', insertData);
            return insertData;
          } catch (error) {
            console.error('Error uploading file:', file.name, error);
            throw error;
          }
        });
        
        const results = await Promise.all(uploadPromises);
        console.log('All uploads completed successfully:', results);
        return results;
      } catch (error) {
        console.error('Upload mutation error:', error);
        throw error;
      }
    },
    onSuccess: (results) => {
      console.log('Upload mutation successful, invalidating queries');
      
      // Invalidate all document-related queries
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-folders'] });
      queryClient.invalidateQueries({ queryKey: ['document-folder-structure'] });
      queryClient.invalidateQueries({ queryKey: ['case-documents'] });
      
      toast({
        title: "Documents uploaded successfully",
        description: `${selectedFiles.length} document(s) uploaded`
      });
      
      if (onUploadSuccess) {
        console.log('Calling onUploadSuccess callback');
        onUploadSuccess();
      }
      
      // Show success options instead of closing immediately
      setSelectedFiles([]);
      setShowSuccessOptions(true);
    },
    onError: (error: any) => {
      console.error('Upload mutation failed:', error);
      toast({
        title: "Failed to upload documents",
        description: error.message || 'An error occurred during upload',
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    console.log('Files selected:', files.length);
    setSelectedFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddMoreFiles = () => {
    setShowSuccessOptions(false);
    // Reset form but keep client/case selections
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
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload",
        variant: "destructive"
      });
      return;
    }

    // Validate required fields (only if not uploading from a case)
    if (!caseId && !data.client_id) {
      toast({
        title: "Client selection required",
        description: "Please select a client",
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

    console.log('Form submitted with data:', data);
    console.log('Selected files:', selectedFiles);
    uploadMutation.mutate(data);
  };

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  // Get available sub-types based on selected primary type
  const availableSubTypes = selectedPrimaryType ? getSubTypes(selectedPrimaryType) : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Documents
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          {/* File Upload Area */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Select Files
            </Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input 
                type="file" 
                multiple 
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt" 
                onChange={handleFileSelect} 
                className="hidden" 
                id="file-upload" 
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to select files or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, Word, Images, Text files up to 50MB
                </p>
              </label>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Selected Files ({selectedFiles.length})
                </Label>
                <div className="max-h-40 overflow-y-auto border border-border rounded-lg">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border-b border-border last:border-b-0">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeFile(index)} 
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Client Selection - Only show if not uploading from a case */}
          {!caseId && (
            <div className="space-y-2">
              <Label htmlFor="client_id" className="text-sm font-medium">
                Select Client <span className="text-destructive">*</span>
              </Label>
              <ClientSelector
                value={selectedClientId || ''}
                onValueChange={(value) => {
                  setValue('client_id', value);
                  setValue('case_id', 'no-case'); // Reset case when client changes
                }}
                placeholder="Search and select client..."
                onClientAdded={(clientId) => {
                  if (clientId) {
                    setValue('client_id', clientId);
                  }
                }}
              />
            </div>
          )}

          {/* Case Assignment - Only show if not uploading from a case */}
          {!caseId && (
            <div className="space-y-2">
              <Label htmlFor="case_id" className="text-sm font-medium">
                Assign to Case <span className="text-destructive">*</span>
              </Label>
              <Select 
                onValueChange={value => setValue('case_id', value)} 
                value={selectedCaseId}
                disabled={!selectedClientId}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={selectedClientId ? "Select a case..." : "Select client first"} />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
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
          )}

          {/* Primary Document Type */}
          <div className="space-y-2">
            <Label htmlFor="primary_document_type" className="text-sm font-medium">
              Document Type <span className="text-destructive">*</span>
            </Label>
            <Select 
              onValueChange={value => {
                setValue('primary_document_type', value);
                setValue('sub_document_type', ''); // Reset sub-type when primary changes
              }} 
              value={selectedPrimaryType}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select document type..." />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50 max-h-[300px]">
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

          {/* Sub Document Type */}
          {selectedPrimaryType && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Sub Type <span className="text-destructive">*</span>
              </Label>
              <Select 
                onValueChange={value => setValue('sub_document_type', value)} 
                value={selectedSubType}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select sub-type..." />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {availableSubTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Storage Path Preview */}
          <StoragePathPreview
            clientName={selectedClient?.full_name}
            caseTitle={selectedCase?.case_title}
            caseNumber={selectedCase?.case_number}
            primaryType={selectedPrimaryType}
            subType={selectedSubType}
            fileName={selectedFiles.length === 1 ? selectedFiles[0].name : selectedFiles.length > 1 ? `${selectedFiles.length} files` : undefined}
          />

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Notes (Optional)
            </Label>
            <Textarea
              {...register('notes')}
              placeholder="Add any additional notes about this document..."
              rows={3}
              className="bg-background"
            />
          </div>

          {/* Document Properties */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Document Properties
            </Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_evidence"
                  {...register('is_evidence')}
                  onCheckedChange={(checked) => setValue('is_evidence', !!checked)}
                />
                <Label htmlFor="is_evidence" className="text-sm text-muted-foreground">
                  Mark as important/evidence
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confidential"
                  {...register('confidential')}
                  onCheckedChange={(checked) => setValue('confidential', !!checked)}
                />
                <Label htmlFor="confidential" className="text-sm text-muted-foreground">
                  Confidential document
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">Only you, admins, and office staff can view confidential documents. Lawyers can see all documents unless marked confidential.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="certified_copy"
                  {...register('certified_copy')}
                  onCheckedChange={(checked) => setValue('certified_copy', !!checked)}
                />
                <Label htmlFor="certified_copy" className="text-sm text-muted-foreground">
                  Certified copy
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="original_copy_retained"
                  {...register('original_copy_retained')}
                  onCheckedChange={(checked) => setValue('original_copy_retained', !!checked)}
                />
                <Label htmlFor="original_copy_retained" className="text-sm text-muted-foreground">
                  Original copy retained
                </Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          {showSuccessOptions ? (
            <div className="flex flex-col gap-4 pt-6 border-t border-border">
              <div className="text-center">
                <h4 className="text-lg font-medium text-green-600 mb-2">Files uploaded successfully!</h4>
                <p className="text-sm text-muted-foreground">What would you like to do next?</p>
              </div>
              <div className="flex justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddMoreFiles}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add More Files
                </Button>
                <Button
                  type="button"
                  onClick={handleFinishUploading}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={uploadMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={selectedFiles.length === 0 || uploadMutation.isPending}
                className="min-w-[120px]"
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
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
