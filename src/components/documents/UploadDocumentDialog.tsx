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
import { Upload, X, FileText, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ClientSelector } from '@/components/appointments/ClientSelector';

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
  document_category?: string;
  document_type?: string;
  custom_document_type?: string;
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
        .select('id, case_title, client_id')
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
      document_category: '',
      document_type: '',
      custom_document_type: '',
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
  const selectedCategory = watch('document_category');
  const selectedDocType = watch('document_type');
  const isImportant = watch('is_evidence');
  const watchedValues = watch();

  // Document category to type mapping
  const documentTypeMapping = {
    'client_case_setup': [
      'Engagement Letters',
      'Power of Attorney', 
      'Retainer Agreement',
      'Identity Documents'
    ],
    'court_filings': [
      'Complaints / Petitions',
      'Responses / Answers',
      'Motions',
      'Orders',
      'Judgments',
      'Appeals'
    ],
    'evidence': [
      'Witness Statements',
      'Affidavits',
      'Expert Reports',
      'Photos',
      'Audio Recordings',
      'Video Evidence',
      'Digital Evidence'
    ],
    'correspondence': [
      'Client Correspondence',
      'Opposing Counsel Correspondence',
      'Court Correspondence',
      'Government Correspondence'
    ],
    'contracts_agreements': [
      'Contracts',
      'Amendments',
      'Settlement Agreements',
      'Non-Disclosure Agreements'
    ],
    'financials': [
      'Invoices',
      'Receipts',
      'Bank Statements',
      'Payroll Records',
      'Tax Documents',
      'Expert Financial Reports'
    ],
    'discovery': [
      'Interrogatories',
      'Depositions',
      'Production Requests',
      'Discovery Responses'
    ],
    'research_notes': [
      'Legal Research',
      'Internal Memos',
      'Case Notes',
      'Strategy Documents'
    ],
    'others': []
  };

  const categoryLabels = {
    'client_case_setup': 'Client & Case Setup',
    'court_filings': 'Court Filings',
    'evidence': 'Evidence',
    'correspondence': 'Correspondence',
    'contracts_agreements': 'Contracts & Agreements',
    'financials': 'Financials',
    'discovery': 'Discovery',
    'research_notes': 'Research & Notes',
    'others': 'Others'
  };

  // Fetch clients (still needed for case filtering)
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
        .select('id, case_title, client_id')
        .eq('status', 'pending')
        .order('case_title');
      if (error) throw error;
      return data || [];
    }
  });

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
              // For binary files, convert to base64 using FileReader to avoid stack overflow
              fileContent = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result as string;
                  // Remove data URL prefix to get just the base64 data
                  const base64 = result.split(',')[1] || result;
                  resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
              console.log('Binary file converted to base64, length:', fileContent.length);
            }

            // Get client and case names for folder structure  
            const selectedCase = cases.find(c => c.id === selectedCaseId);
            const selectedClient = clients.find(c => c.id === selectedClientId);
            
            let clientName = 'General';
            let caseName = 'General Documents';
            
            if (selectedClientId && selectedClient) {
              clientName = selectedClient.full_name;
            }
            
            if (selectedCaseId && selectedCaseId !== 'no-case' && selectedCase) {
              caseName = selectedCase.case_title;
            }
            
            const category = data.document_category ? categoryLabels[data.document_category as keyof typeof categoryLabels] : 'Others';
            const docType = data.document_type || data.custom_document_type || 'Unspecified';
            
            console.log('Calling pydio-webdav function...');
            const { data: pydioResult, error: pydioError } = await supabase.functions.invoke('pydio-webdav', {
              body: {
                clientName,
                caseName,
                category,
                docType,
                fileName: file.name,
                fileContent: fileContent
              }
            });
            
            console.log('WebDAV result:', pydioResult);
            console.log('WebDAV error:', pydioError);
            
            let webdavOk = !!pydioResult?.success && !pydioError;
            let webdavPath: string | undefined = pydioResult?.path;
            let webdavErrorMessage: string | undefined = undefined;

            // If WebDAV failed (e.g., Cloudflare 530), gracefully fall back to Supabase Storage
            if (!webdavOk) {
              webdavErrorMessage = pydioError?.message || pydioResult?.error || 'Unknown WebDAV error';
              console.warn('⚠️ WebDAV upload failed, falling back to Supabase Storage:', webdavErrorMessage);

              const storagePath = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
              const { error: storageError } = await supabase.storage
                .from('documents')
                .upload(storagePath, file);

              if (storageError) {
                console.error('❌ Supabase storage upload failed as fallback:', storageError);
                throw new Error(`Upload failed (WebDAV + fallback): ${webdavErrorMessage}`);
              }

              // Insert document record pointing to Supabase Storage (not WebDAV)
              const fallbackDocumentData = {
                file_name: file.name,
                file_url: storagePath, // path relative to bucket for consistent downloads
                file_type: file.name.split('.').pop()?.toLowerCase() || null,
                file_size: file.size,
                case_id: (data.case_id && data.case_id !== 'no-case') ? data.case_id : null,
                client_id: data.client_id || null,
                uploaded_by: user.id,
                is_evidence: data.is_evidence,
                uploaded_at: new Date().toISOString(),
                firm_id: firmId,
                folder_name: (data.case_id && data.case_id !== 'no-case') ? caseName : 'General Documents',
                document_type_id: null,
                notes: data.notes || null,
                confidential: data.confidential || false,
                original_copy_retained: data.original_copy_retained || false,
                certified_copy: data.certified_copy || false,
                webdav_synced: false,
                webdav_path: null,
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
              file_url: webdavPath || `${clientName}/${caseName}/${category}/${docType}/${file.name}`,
              file_type: file.name.split('.').pop()?.toLowerCase() || null,
              file_size: file.size,
              case_id: (data.case_id && data.case_id !== 'no-case') ? data.case_id : null,
              client_id: data.client_id || null,
              uploaded_by: user.id,
              is_evidence: data.is_evidence,
              uploaded_at: new Date().toISOString(),
              firm_id: firmId,
              folder_name: (data.case_id && data.case_id !== 'no-case') ? caseName : 'General Documents',
              document_type_id: null, // Using new category/type system
              notes: data.notes || null,
              confidential: data.confidential || false,
              original_copy_retained: data.original_copy_retained || false,
              certified_copy: data.certified_copy || false,
              webdav_synced: true, // Mark as synced to WebDAV
              webdav_path: webdavPath,
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
    const currentCategory = watch('document_category');
    
    reset({
      client_id: currentClientId,
      case_id: currentCaseId,
      document_category: currentCategory,
      document_type: '',
      custom_document_type: '',
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

    if (!data.document_category) {
      toast({
        title: "Document category required",
        description: "Please select a document category",
        variant: "destructive"
      });
      return;
    }

    if (data.document_category !== 'others' && !data.document_type) {
      toast({
        title: "Document type required", 
        description: "Please select a document type",
        variant: "destructive"
      });
      return;
    }

    if (data.document_category === 'others' && !data.custom_document_type?.trim()) {
      toast({
        title: "Custom document type required",
        description: "Please enter a custom document type",
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <input 
                type="file" 
                multiple 
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt" 
                onChange={handleFileSelect} 
                className="hidden" 
                id="file-upload" 
              />
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
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Selected Files ({selectedFiles.length})
                </Label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeFile(index)} 
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
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
              <Label htmlFor="client_id" className="text-sm font-medium text-gray-700">
                Select Client <span className="text-red-500">*</span>
              </Label>
              <ClientSelector
                value={selectedClientId || ''}
                onValueChange={(value) => {
                  setValue('client_id', value);
                  setValue('case_id', 'no-case'); // Reset case when client changes
                }}
                placeholder="Search and select client or contact..."
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
              <Label htmlFor="case_id" className="text-sm font-medium text-gray-700">
                Assign to Case (Optional)
              </Label>
              <Select 
                onValueChange={value => setValue('case_id', value)} 
                value={selectedCaseId}
                disabled={!selectedClientId}
              >
                <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder={selectedClientId ? "Select a case..." : "Select client first"} />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="no-case" className="hover:bg-gray-50">No Case (General Documents)</SelectItem>
                  {cases
                    .filter(case_item => {
                      // Only show cases for the selected client
                      return !selectedClientId || case_item.client_id === selectedClientId;
                    })
                    .map(case_item => (
                      <SelectItem key={case_item.id} value={case_item.id} className="hover:bg-gray-50">
                        {case_item.case_title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Document Category */}
          <div className="space-y-2">
            <Label htmlFor="document_category" className="text-sm font-medium text-gray-700">
              Document Category <span className="text-red-500">*</span>
            </Label>
            <Select onValueChange={value => {
              setValue('document_category', value);
              setValue('document_type', '');
            }} value={selectedCategory}>
              <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="hover:bg-gray-50">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Type */}
          {selectedCategory && selectedCategory !== 'others' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Document Type <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={value => setValue('document_type', value)} value={watch('document_type')}>
                <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select document type..." />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  {documentTypeMapping[selectedCategory as keyof typeof documentTypeMapping]?.map(type => (
                    <SelectItem key={type} value={type} className="hover:bg-gray-50">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Document Type for Others */}
          {selectedCategory === 'others' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Custom Document Type <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register('custom_document_type')}
                placeholder="Enter document type..."
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Notes (Optional)
            </Label>
            <Textarea
              {...register('notes')}
              placeholder="Add any additional notes about this document..."
              rows={3}
              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Document Properties */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Document Properties
            </Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_evidence"
                  {...register('is_evidence')}
                  onCheckedChange={(checked) => setValue('is_evidence', !!checked)}
                />
                <Label htmlFor="is_evidence" className="text-sm text-gray-600">
                  Mark as important/evidence
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confidential"
                  {...register('confidential')}
                  onCheckedChange={(checked) => setValue('confidential', !!checked)}
                />
                <Label htmlFor="confidential" className="text-sm text-gray-600">
                  Confidential document
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="certified_copy"
                  {...register('certified_copy')}
                  onCheckedChange={(checked) => setValue('certified_copy', !!checked)}
                />
                <Label htmlFor="certified_copy" className="text-sm text-gray-600">
                  Certified copy
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="original_copy_retained"
                  {...register('original_copy_retained')}
                  onCheckedChange={(checked) => setValue('original_copy_retained', !!checked)}
                />
                <Label htmlFor="original_copy_retained" className="text-sm text-gray-600">
                  Original copy retained
                </Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          {showSuccessOptions ? (
            <div className="flex flex-col gap-4 pt-6 border-t border-gray-100">
              <div className="text-center">
                <h4 className="text-lg font-medium text-green-600 mb-2">Files uploaded successfully!</h4>
                <p className="text-sm text-gray-600">What would you like to do next?</p>
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
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
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
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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