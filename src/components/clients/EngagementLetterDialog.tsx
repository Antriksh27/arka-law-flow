import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { FileText, Printer, Upload, Loader2 } from 'lucide-react';

interface EngagementLetterDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

interface EngagementLetterData {
  legal_services: string;
  hourly_rate: number;
  retainer_amount: number;
  payment_terms: string;
  billing_frequency: string;
  case_type: string;
  scope_of_work: string;
  additional_costs: string;
  termination_clause: string;
  effective_date: string;
}

export const EngagementLetterDialog: React.FC<EngagementLetterDialogProps> = ({
  open,
  onClose,
  clientId,
  clientName
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'fill' | 'print' | 'upload'>('fill');
  const [generatedLetter, setGeneratedLetter] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<EngagementLetterData>({
    defaultValues: {
      billing_frequency: 'monthly',
      payment_terms: '30 days',
      effective_date: new Date().toISOString().split('T')[0]
    }
  });

  const watchedValues = watch();

  // Fetch firm details for the letter header
  const { data: firmDetails } = useQuery({
    queryKey: ['firm-details'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: teamMember } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', user.user.id)
        .single();

      if (!teamMember) throw new Error('No firm found');

      const { data: firm } = await supabase
        .from('law_firms')
        .select('*')
        .eq('id', teamMember.firm_id)
        .single();

      return firm;
    },
    enabled: open
  });

  // Fetch client details
  const { data: client } = useQuery({
    queryKey: ['client-details', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open && !!clientId
  });

  const generateLetter = (data: EngagementLetterData) => {
    const letterTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1E3A8A; margin-bottom: 10px;">${firmDetails?.name || 'Law Firm'}</h1>
          <p>${firmDetails?.address || 'Firm Address'}</p>
          <p>Email: ${firmDetails?.admin_email || 'contact@lawfirm.com'}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <p style="margin-bottom: 10px;"><strong>Date:</strong> ${new Date(data.effective_date).toLocaleDateString()}</p>
          <p style="margin-bottom: 10px;"><strong>Client:</strong> ${clientName}</p>
          <p style="margin-bottom: 10px;"><strong>Address:</strong> ${client?.address || 'Client Address'}</p>
        </div>

        <h2 style="color: #1E3A8A; margin-bottom: 20px;">ENGAGEMENT LETTER</h2>

        <p style="margin-bottom: 15px;">Dear ${clientName},</p>

        <p style="margin-bottom: 15px;">
          This letter confirms our agreement for legal representation in connection with <strong>${data.case_type}</strong>.
          We appreciate the opportunity to represent you and look forward to working with you.
        </p>

        <h3 style="color: #1E3A8A; margin-top: 25px; margin-bottom: 15px;">SCOPE OF REPRESENTATION</h3>
        <p style="margin-bottom: 15px;">${data.scope_of_work}</p>

        <h3 style="color: #1E3A8A; margin-top: 25px; margin-bottom: 15px;">LEGAL SERVICES</h3>
        <p style="margin-bottom: 15px;">${data.legal_services}</p>

        <h3 style="color: #1E3A8A; margin-top: 25px; margin-bottom: 15px;">FEES AND BILLING</h3>
        <ul style="margin-bottom: 15px;">
          <li><strong>Hourly Rate:</strong> ₹${data.hourly_rate.toLocaleString()} per hour</li>
          <li><strong>Retainer Amount:</strong> ₹${data.retainer_amount.toLocaleString()}</li>
          <li><strong>Billing Frequency:</strong> ${data.billing_frequency}</li>
          <li><strong>Payment Terms:</strong> ${data.payment_terms}</li>
        </ul>

        <h3 style="color: #1E3A8A; margin-top: 25px; margin-bottom: 15px;">ADDITIONAL COSTS</h3>
        <p style="margin-bottom: 15px;">${data.additional_costs}</p>

        <h3 style="color: #1E3A8A; margin-top: 25px; margin-bottom: 15px;">TERMINATION</h3>
        <p style="margin-bottom: 15px;">${data.termination_clause}</p>

        <div style="margin-top: 40px;">
          <p style="margin-bottom: 30px;">
            Please sign and return one copy of this letter to indicate your agreement to these terms.
          </p>

          <div style="display: flex; justify-content: space-between; margin-top: 60px;">
            <div style="width: 45%;">
              <div style="border-bottom: 1px solid #000; margin-bottom: 10px; height: 60px;"></div>
              <p><strong>Client Signature</strong></p>
              <p>Date: _______________</p>
            </div>
            <div style="width: 45%;">
              <div style="border-bottom: 1px solid #000; margin-bottom: 10px; height: 60px;"></div>
              <p><strong>Attorney Signature</strong></p>
              <p>Date: _______________</p>
            </div>
          </div>
        </div>
      </div>
    `;
    return letterTemplate;
  };

  const uploadSignedLetter = useMutation({
    mutationFn: async (file: File) => {
      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `engagement-letter-${clientId}-${Date.now()}.${fileExt}`;
      const filePath = `engagement-letters/${fileName}`;

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
          document_type_id: null,
          notes: 'Signed Engagement Letter',
          confidential: true,
          uploaded_by_user_id: (await supabase.auth.getUser()).data.user?.id,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          folder_name: 'Engagement Letters'
        })
        .select()
        .single();

      if (documentError) throw documentError;

      return documentData;
    },
    onSuccess: () => {
      toast({
        title: "Engagement letter uploaded successfully",
        description: "The signed engagement letter has been saved to the client's documents."
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload the signed engagement letter.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: EngagementLetterData) => {
    const letter = generateLetter(data);
    setGeneratedLetter(letter);
    setStep('print');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Engagement Letter - ${clientName}</title>
            <style>
              body { margin: 20px; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${generatedLetter}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    setStep('upload');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleUpload = () => {
    if (uploadedFile) {
      uploadSignedLetter.mutate(uploadedFile);
    }
  };

  const handleClose = () => {
    setStep('fill');
    setGeneratedLetter('');
    setUploadedFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Engagement Letter - {clientName}
          </DialogTitle>
        </DialogHeader>

        {step === 'fill' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="case_type">Case Type *</Label>
                <Input
                  id="case_type"
                  {...register('case_type', { required: 'Case type is required' })}
                  placeholder="e.g., Civil Litigation, Criminal Defense"
                />
                {errors.case_type && <p className="text-sm text-red-600">{errors.case_type.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="effective_date">Effective Date *</Label>
                <Input
                  id="effective_date"
                  type="date"
                  {...register('effective_date', { required: 'Effective date is required' })}
                />
                {errors.effective_date && <p className="text-sm text-red-600">{errors.effective_date.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate (₹) *</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  {...register('hourly_rate', { required: 'Hourly rate is required', min: 1 })}
                  placeholder="5000"
                />
                {errors.hourly_rate && <p className="text-sm text-red-600">{errors.hourly_rate.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="retainer_amount">Retainer Amount (₹) *</Label>
                <Input
                  id="retainer_amount"
                  type="number"
                  {...register('retainer_amount', { required: 'Retainer amount is required', min: 0 })}
                  placeholder="50000"
                />
                {errors.retainer_amount && <p className="text-sm text-red-600">{errors.retainer_amount.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing_frequency">Billing Frequency</Label>
                <Select onValueChange={(value) => setValue('billing_frequency', value)} value={watchedValues.billing_frequency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select billing frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="on_completion">On Completion</SelectItem>
                    <SelectItem value="as_incurred">As Incurred</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Input
                  id="payment_terms"
                  {...register('payment_terms')}
                  placeholder="e.g., 30 days, Due on receipt"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope_of_work">Scope of Work *</Label>
              <Textarea
                id="scope_of_work"
                {...register('scope_of_work', { required: 'Scope of work is required' })}
                placeholder="Describe the scope of legal representation..."
                rows={3}
              />
              {errors.scope_of_work && <p className="text-sm text-red-600">{errors.scope_of_work.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal_services">Legal Services *</Label>
              <Textarea
                id="legal_services"
                {...register('legal_services', { required: 'Legal services description is required' })}
                placeholder="Describe the legal services to be provided..."
                rows={3}
              />
              {errors.legal_services && <p className="text-sm text-red-600">{errors.legal_services.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional_costs">Additional Costs</Label>
              <Textarea
                id="additional_costs"
                {...register('additional_costs')}
                placeholder="Court fees, expert witness fees, travel expenses, etc."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="termination_clause">Termination Clause</Label>
              <Textarea
                id="termination_clause"
                {...register('termination_clause')}
                placeholder="Terms for termination of the engagement..."
                rows={2}
                defaultValue="Either party may terminate this engagement upon written notice. Client remains responsible for all fees and costs incurred up to the date of termination."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">
                Generate Letter
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'print' && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: generatedLetter }} />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep('fill')}>
                Back to Edit
              </Button>
              <Button onClick={handlePrint} className="flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Print Letter
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <Printer className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Letter Printed Successfully</h3>
              <p className="text-green-700">Please get the letter signed by the client and upload the signed copy below.</p>
            </div>

            <div className="space-y-4">
              <Label htmlFor="signed_letter" className="text-sm font-medium">
                Upload Signed Engagement Letter *
              </Label>
              <Input
                id="signed_letter"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500">
                Supported formats: PDF, JPG, JPEG, PNG
              </p>
              
              {uploadedFile && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!uploadedFile || uploadSignedLetter.isPending}
                className="flex items-center gap-2"
              >
                {uploadSignedLetter.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Signed Letter
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};