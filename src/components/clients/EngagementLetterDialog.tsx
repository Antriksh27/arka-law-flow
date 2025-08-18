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
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Printer, Upload, Loader2 } from 'lucide-react';

interface EngagementLetterDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

interface EngagementLetterData {
  // Essential Matter Details
  matter_title: string;
  case_number: string;
  primary_lawyer_name: string;
  court_name: string;
  
  // Simple Fee Structure
  professional_fee: number;
  retainer_amount: number;
  expenses: number;
  tax_rate: number; // percentage
  including_tax: boolean; // if true, amounts include tax
  
  // Payment Details
  payment_schedule: string;
  payment_method: string;
  
  // Dates
  issue_date: string;
  
  // Simple Annexure
  scope_description: string;
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
      issue_date: new Date().toISOString().split('T')[0],
      payment_method: 'UPI/Bank Transfer',
      tax_rate: 18,
      including_tax: false,
      scope_description: 'Legal consultation, research, drafting, court appearances, and related legal services as required for the matter.'
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

  const calculateTotals = (data: EngagementLetterData) => {
    if (data.including_tax) {
      // When amounts include tax, calculate the base amount and tax separately
      const taxMultiplier = 1 + (data.tax_rate / 100);
      
      const professionalBase = Math.round(data.professional_fee / taxMultiplier);
      const retainerBase = Math.round(data.retainer_amount / taxMultiplier);
      const expensesBase = Math.round(data.expenses / taxMultiplier);
      
      const professionalTax = data.professional_fee - professionalBase;
      const retainerTax = data.retainer_amount - retainerBase;
      const expensesTax = data.expenses - expensesBase;
      
      const subtotal = professionalBase + retainerBase + expensesBase;
      const totalTax = professionalTax + retainerTax + expensesTax;
      const grandTotal = data.professional_fee + data.retainer_amount + data.expenses;

      return {
        professionalTax,
        retainerTax,
        expensesTax,
        professionalTotal: data.professional_fee,
        retainerTotal: data.retainer_amount,
        expensesTotal: data.expenses,
        subtotal,
        totalTax,
        grandTotal
      };
    } else {
      // When amounts exclude tax, add tax on top
      const professionalTax = Math.round((data.professional_fee * data.tax_rate) / 100);
      const retainerTax = Math.round((data.retainer_amount * data.tax_rate) / 100);
      const expensesTax = Math.round((data.expenses * data.tax_rate) / 100);
      
      const professionalTotal = data.professional_fee + professionalTax;
      const retainerTotal = data.retainer_amount + retainerTax;
      const expensesTotal = data.expenses + expensesTax;
      
      const subtotal = data.professional_fee + data.retainer_amount + data.expenses;
      const totalTax = professionalTax + retainerTax + expensesTax;
      const grandTotal = subtotal + totalTax;

      return {
        professionalTax,
        retainerTax,
        expensesTax,
        professionalTotal,
        retainerTotal,
        expensesTotal,
        subtotal,
        totalTax,
        grandTotal
      };
    }
  };

  const generateLetter = (data: EngagementLetterData) => {
    const totals = calculateTotals(data);
    
    const letterTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Engagement Letter – ${clientName}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root{
    --primary:#0D47A1; --accent:#FFC107; --text:#222; --muted:#666; --line:#e6e6e6;
  }
  *{box-sizing:border-box;}
  body{
    font-family: "Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    color: var(--text); background:#fff; margin:0; padding:0;
  }
  .sheet{
    width: 210mm; min-height: 297mm; margin: 0 auto; padding: 20mm 18mm;
    background: #fff;
  }
  header{display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px;}
  .brand{max-width:60%}
  .brand h1{margin:0 0 4px; font-size:20px; color:var(--primary); letter-spacing:.2px;}
  .brand p{margin:0; font-size:12px; color:var(--muted);}
  h2.section-title{
    font-size:15px; margin:20px 0 8px; color:var(--primary); border-bottom:2px solid var(--line); padding-bottom:6px;
  }
  p, li{font-size:12.5px; line-height:1.6; margin:0 0 8px;}
  .meta{
    display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin:12px 0 18px;
    border:1px solid var(--line); padding:10px; border-radius:6px; background:#fafafa;
  }
  .meta div span{display:block; font-size:11px; color:var(--muted);}
  .meta div strong{font-size:12.5px;}
  .box{border:1px solid var(--line); border-radius:8px; padding:10px 12px; background:#fff;}
  table{
    width:100%; border-collapse:collapse; margin:6px 0 12px; font-size:12.5px;
  }
  th, td{border:1px solid var(--line); padding:8px; vertical-align:top;}
  th{background:#f8f9fb; text-align:left;}
  .sign-row{display:flex; gap:24px; margin-top:18px;}
  .sign{flex:1; border-top:1px solid var(--line); padding-top:10px; font-size:12px;}
  .right{float:right;}
  .accent{color:#000; background:#fff8e1; border-left:3px solid var(--accent); padding:8px 10px; margin:8px 0;}
  footer{margin-top:18px; font-size:11px; color:var(--muted); text-align:center;}
</style>
</head>
<body>

<div class="sheet">

  <header>
    <div class="brand">
      <h1>${firmDetails?.name || 'Law Firm'}</h1>
      <p>${firmDetails?.address || 'Firm Address'}</p>
      <p>Email: ${firmDetails?.admin_email || 'contact@lawfirm.com'}</p>
    </div>
  </header>

  <p class="right"><strong>Date:</strong> ${new Date(data.issue_date).toLocaleDateString()}</p>
  <p><strong>To,</strong><br>
     ${clientName}<br>
     ${client?.address || 'Client Address'}
  </p>

  <h2 class="section-title">Subject: Engagement Letter for Legal Services</h2>

  <p>Dear ${clientName},</p>
  <p>
    This Engagement Letter sets out the terms on which <strong>${firmDetails?.name || 'Law Firm'}</strong> will provide legal services to
    <strong>${clientName}</strong> in relation to the matter described below, in accordance with the Advocates Act, 1961 and the Bar Council of India Rules.
  </p>

  <div class="meta">
    <div><span>Matter Title</span><strong>${data.matter_title}</strong></div>
    <div><span>Case / File No.</span><strong>${data.case_number || 'TBD'}</strong></div>
    <div><span>Primary Lawyer</span><strong>${data.primary_lawyer_name}</strong></div>
    <div><span>Jurisdiction / Court</span><strong>${data.court_name || 'As applicable'}</strong></div>
  </div>

  <h2 class="section-title">1. Scope of Services</h2>
  <div class="box">
    <p>${data.scope_description}</p>
  </div>

  <h2 class="section-title">2. Fees & Payment Terms</h2>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Amount (₹)</th>
        <th>Tax (${data.tax_rate}%)</th>
        <th>Total (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Professional Fee</td>
        <td>${data.professional_fee.toLocaleString()}</td>
        <td>${totals.professionalTax.toLocaleString()}</td>
        <td>${totals.professionalTotal.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Retainer Amount</td>
        <td>${data.retainer_amount.toLocaleString()}</td>
        <td>${totals.retainerTax.toLocaleString()}</td>
        <td>${totals.retainerTotal.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Out-of-Pocket Expenses</td>
        <td>${data.expenses.toLocaleString()}</td>
        <td>${totals.expensesTax.toLocaleString()}</td>
        <td>${totals.expensesTotal.toLocaleString()}</td>
      </tr>
      <tr>
        <th style="text-align:right">Grand Total</th>
        <th>${totals.subtotal.toLocaleString()}</th>
        <th>${totals.totalTax.toLocaleString()}</th>
        <th>${totals.grandTotal.toLocaleString()}</th>
      </tr>
    </tbody>
  </table>

  <div class="accent">
    <strong>Payment Schedule:</strong> ${data.payment_schedule}<br/>
    <strong>Payment Method:</strong> ${data.payment_method}
  </div>

  <h2 class="section-title">3. Client Responsibilities</h2>
  <ul>
    <li>Provide complete and accurate information and documents on a timely basis.</li>
    <li>Attend meetings, sign documents, and comply with procedural timelines.</li>
    <li>Maintain courteous conduct and avoid actions that may prejudice the matter.</li>
  </ul>

  <h2 class="section-title">4. Confidentiality & Terms</h2>
  <p>We will maintain confidentiality of client information as per the Advocates Act and applicable professional standards. Either party may terminate this engagement upon written notice. Fees for work completed and expenses incurred up to the date of termination shall be payable immediately.</p>

  <h2 class="section-title">5. Acceptance</h2>
  <p>Kindly sign below to confirm your acceptance of the terms of this Engagement Letter.</p>

  <div class="sign-row" style="margin-top:40px;">
    <div class="sign">
      <strong>For ${firmDetails?.name || 'Law Firm'}</strong><br><br><br>
      Signature: ___________________________<br>
      Name: ${data.primary_lawyer_name}<br>
      Date: ${new Date(data.issue_date).toLocaleDateString()}
    </div>
    <div class="sign">
      <strong>Accepted & Agreed – Client</strong><br><br><br>
      Signature: ___________________________<br>
      Name: ${clientName}<br>
      Date: _______________
    </div>
  </div>

  <footer>
    This is a computer-generated document. A signed copy will be retained for records.
  </footer>
</div>

</body>
</html>
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
      printWindow.document.write(generatedLetter);
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

  // Calculate totals for display
  const totals = calculateTotals(watchedValues);

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
            {/* Matter Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Matter Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matter_title">Matter Title *</Label>
                  <Input
                    id="matter_title"
                    {...register('matter_title', { required: 'Matter title is required' })}
                    placeholder="e.g., Civil Litigation - Property Dispute"
                  />
                  {errors.matter_title && <p className="text-sm text-red-600">{errors.matter_title.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="case_number">Case/File Number</Label>
                  <Input
                    id="case_number"
                    {...register('case_number')}
                    placeholder="e.g., CS 123/2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary_lawyer_name">Primary Lawyer *</Label>
                  <Input
                    id="primary_lawyer_name"
                    {...register('primary_lawyer_name', { required: 'Primary lawyer is required' })}
                    placeholder="Lead lawyer name"
                  />
                  {errors.primary_lawyer_name && <p className="text-sm text-red-600">{errors.primary_lawyer_name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="court_name">Court/Jurisdiction</Label>
                  <Input
                    id="court_name"
                    {...register('court_name')}
                    placeholder="e.g., Delhi High Court"
                  />
                </div>
              </div>
            </div>

            {/* Fee Structure */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Fee Structure</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="professional_fee">Professional Fee (₹) *</Label>
                   <Input
                     id="professional_fee"
                     type="number"
                     {...register('professional_fee', { required: 'Professional fee is required', min: 0, valueAsNumber: true })}
                     placeholder="100000"
                     style={{ 
                       MozAppearance: 'textfield',
                       WebkitAppearance: 'none',
                       appearance: 'none'
                     }}
                     className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                   />
                   {errors.professional_fee && <p className="text-sm text-red-600">{errors.professional_fee.message}</p>}
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="retainer_amount">Retainer Amount (₹) *</Label>
                   <Input
                     id="retainer_amount"
                     type="number"
                     {...register('retainer_amount', { required: 'Retainer amount is required', min: 0, valueAsNumber: true })}
                     placeholder="50000"
                     style={{ 
                       MozAppearance: 'textfield',
                       WebkitAppearance: 'none',
                       appearance: 'none'
                     }}
                     className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                   />
                   {errors.retainer_amount && <p className="text-sm text-red-600">{errors.retainer_amount.message}</p>}
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="expenses">Out-of-Pocket Expenses (₹)</Label>
                   <Input
                     id="expenses"
                     type="number"
                     {...register('expenses', { min: 0, valueAsNumber: true })}
                     placeholder="25000"
                     style={{ 
                       MozAppearance: 'textfield',
                       WebkitAppearance: 'none',
                       appearance: 'none'
                     }}
                     className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                   />
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                   <Select value={watchedValues.tax_rate?.toString()} onValueChange={(value) => setValue('tax_rate', parseInt(value))}>
                     <SelectTrigger>
                       <SelectValue placeholder="Select tax rate" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="18">18% (GST)</SelectItem>
                       <SelectItem value="12">12%</SelectItem>
                       <SelectItem value="5">5%</SelectItem>
                       <SelectItem value="0">0% (Tax Exempt)</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>

               <div className="flex items-center space-x-2">
                 <Checkbox
                   id="including_tax"
                   checked={watchedValues.including_tax}
                   onCheckedChange={(checked) => setValue('including_tax', Boolean(checked))}
                 />
                 <Label htmlFor="including_tax" className="text-sm font-normal">
                   The amounts entered above include tax
                 </Label>
               </div>

              {/* Fee Calculator Display */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Fee Calculation</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Professional Fee</p>
                    <p className="font-semibold">₹{(watchedValues.professional_fee || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">+ Tax: ₹{totals.professionalTax.toLocaleString()}</p>
                    <p className="font-medium">Total: ₹{totals.professionalTotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Retainer</p>
                    <p className="font-semibold">₹{(watchedValues.retainer_amount || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">+ Tax: ₹{totals.retainerTax.toLocaleString()}</p>
                    <p className="font-medium">Total: ₹{totals.retainerTotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expenses</p>
                    <p className="font-semibold">₹{(watchedValues.expenses || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">+ Tax: ₹{totals.expensesTax.toLocaleString()}</p>
                    <p className="font-medium">Total: ₹{totals.expensesTotal.toLocaleString()}</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded">
                    <p className="text-muted-foreground">Grand Total</p>
                    <p className="text-xl font-bold text-primary">₹{totals.grandTotal.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_schedule">Payment Schedule *</Label>
                  <Textarea
                    id="payment_schedule"
                    {...register('payment_schedule', { required: 'Payment schedule is required' })}
                    placeholder="50% retainer upfront, balance on completion"
                    rows={2}
                  />
                  {errors.payment_schedule && <p className="text-sm text-red-600">{errors.payment_schedule.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select onValueChange={(value) => setValue('payment_method', value)} value={watchedValues.payment_method}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI/Bank Transfer">UPI/Bank Transfer</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Scope Description */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Scope of Services</h3>
              <div className="space-y-2">
                <Label htmlFor="scope_description">Detailed Scope *</Label>
                <Textarea
                  id="scope_description"
                  {...register('scope_description', { required: 'Scope description is required' })}
                  placeholder="Describe the legal services to be provided..."
                  rows={3}
                />
                {errors.scope_description && <p className="text-sm text-red-600">{errors.scope_description.message}</p>}
              </div>
            </div>

            {/* Date */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Issue Date</h3>
              <div className="space-y-2">
                <Label htmlFor="issue_date">Issue Date *</Label>
                <Input
                  id="issue_date"
                  type="date"
                  {...register('issue_date', { required: 'Issue date is required' })}
                />
                {errors.issue_date && <p className="text-sm text-red-600">{errors.issue_date.message}</p>}
              </div>
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