import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { FileText, Printer, Upload, Loader2, Plus, Trash2 } from 'lucide-react';

interface EngagementLetterDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

interface EngagementLetterData {
  // Matter Details
  matter_title: string;
  case_number: string;
  primary_lawyer_name: string;
  court_name: string;
  
  // Fee Structure
  fee_professional_amount: number;
  fee_professional_tax: number;
  retainer_amount: number;
  retainer_tax: number;
  oop_amount: number;
  oop_tax: number;
  late_fee_rate: number;
  
  // Payment Details
  payment_schedule_text: string;
  payment_method: string;
  payment_reference: string;
  
  // Client Details
  client_salutation_or_name: string;
  client_address_line1: string;
  client_address_line2: string;
  client_city: string;
  client_state: string;
  client_pin: string;
  client_id_last4: string;
  
  // Firm Details
  firm_address_line1: string;
  firm_address_line2: string;
  firm_city: string;
  firm_state: string;
  firm_pin: string;
  firm_phone: string;
  firm_gstin: string;
  firm_signatory_name: string;
  firm_signatory_title: string;
  
  // Governance
  governing_city: string;
  
  // Dates
  issue_date: string;
  client_sign_date: string;
  
  // Annexure
  annexure_rows: Array<{
    deliverable: string;
    target_date: string;
    notes: string;
  }>;
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
    control,
    formState: { errors }
  } = useForm<EngagementLetterData>({
    defaultValues: {
      issue_date: new Date().toISOString().split('T')[0],
      client_sign_date: '',
      payment_method: 'UPI/Bank Transfer',
      late_fee_rate: 2,
      governing_city: 'New Delhi',
      annexure_rows: [
        { deliverable: 'Draft & file plaint / petition', target_date: '', notes: 'As instructed' },
        { deliverable: 'Appear for interim relief', target_date: '', notes: 'Subject to listing' }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "annexure_rows"
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
    const feeProfessionalTotal = data.fee_professional_amount + data.fee_professional_tax;
    const retainerTotal = data.retainer_amount + data.retainer_tax;
    const oopTotal = data.oop_amount + data.oop_tax;
    const grandAmount = data.fee_professional_amount + data.retainer_amount + data.oop_amount;
    const grandTax = data.fee_professional_tax + data.retainer_tax + data.oop_tax;
    const grandTotal = grandAmount + grandTax;

    return {
      feeProfessionalTotal,
      retainerTotal,
      oopTotal,
      grandAmount,
      grandTax,
      grandTotal
    };
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
  .logo{height:44px; width:auto; object-fit:contain;}
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
  .muted{color:var(--muted)}
  .sign-row{display:flex; gap:24px; margin-top:18px;}
  .sign{flex:1; border-top:1px solid var(--line); padding-top:10px; font-size:12px;}
  .right{float:right;}
  .note{font-size:11px; color:var(--muted);}
  footer{margin-top:18px; font-size:11px; color:var(--muted); text-align:center;}
  .badge{display:inline-block; font-size:11px; color:#000; background:#fff2cc; padding:2px 6px; border:1px solid #f1d777; border-radius:6px;}
  .accent{color:#000; background:#fff8e1; border-left:3px solid var(--accent); padding:8px 10px; margin:8px 0;}
</style>
</head>
<body>

<div class="sheet">

  <header>
    <div class="brand">
      <h1>${firmDetails?.name || data.firm_signatory_name}</h1>
      <p>${data.firm_address_line1}, ${data.firm_address_line2} · ${data.firm_city}, ${data.firm_state} – ${data.firm_pin}</p>
      <p>Phone: ${data.firm_phone} · Email: ${firmDetails?.admin_email || 'contact@lawfirm.com'} · GSTIN: ${data.firm_gstin}</p>
    </div>
  </header>

  <p class="right"><strong>Date:</strong> ${new Date(data.issue_date).toLocaleDateString()}</p>
  <p><strong>To,</strong><br>
     ${data.client_salutation_or_name || clientName}<br>
     ${data.client_address_line1}<br>
     ${data.client_address_line2}<br>
     ${data.client_city}, ${data.client_state} – ${data.client_pin}
  </p>

  <h2 class="section-title">Subject: Engagement Letter for Legal Services</h2>

  <p>Dear ${data.client_salutation_or_name || clientName},</p>
  <p>
    This Engagement Letter (the "Agreement") sets out the terms on which <strong>${firmDetails?.name || data.firm_signatory_name}</strong> ("<em>Firm</em>", "<em>we</em>", "<em>us</em>") will provide legal services to
    <strong>${clientName}</strong> ("<em>Client</em>", "<em>you</em>") in relation to the matter described below, in accordance with the Advocates Act, 1961 and the Bar Council of India Rules.
  </p>

  <div class="meta">
    <div><span>Matter Title</span><strong>${data.matter_title}</strong></div>
    <div><span>Case / File No.</span><strong>${data.case_number}</strong></div>
    <div><span>Primary Lawyer</span><strong>${data.primary_lawyer_name}</strong></div>
    <div><span>Jurisdiction / Court</span><strong>${data.court_name}</strong></div>
  </div>

  <h2 class="section-title">1. Scope of Services</h2>
  <div class="box">
    <p>The Firm will render the following services (as applicable):</p>
    <ul>
      <li>Consultation, legal research, drafting/review of pleadings, affidavits, notices and applications.</li>
      <li>Filing and court appearances, briefing counsel, and liaison with court registry.</li>
      <li>Evidence preparation, discovery, and correspondence with opposing parties.</li>
      <li>Advisory, negotiation, and settlement discussions.</li>
    </ul>
    <p class="note">Detailed scope is appended in <strong>Annexure A</strong> and may be refined in writing (email acceptable) by mutual consent.</p>
  </div>

  <h2 class="section-title">2. Fees, Retainer & Payment Terms</h2>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Amount (₹)</th>
        <th>Tax</th>
        <th>Total (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Professional Fee</td>
        <td>${data.fee_professional_amount.toLocaleString()}</td>
        <td>${data.fee_professional_tax.toLocaleString()}</td>
        <td>${totals.feeProfessionalTotal.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Retainer (Adjustable)</td>
        <td>${data.retainer_amount.toLocaleString()}</td>
        <td>${data.retainer_tax.toLocaleString()}</td>
        <td>${totals.retainerTotal.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Out-of-Pocket Expenses (court fee, process, travel, etc.)</td>
        <td>${data.oop_amount.toLocaleString()}</td>
        <td>${data.oop_tax.toLocaleString()}</td>
        <td>${totals.oopTotal.toLocaleString()}</td>
      </tr>
      <tr>
        <th style="text-align:right">Grand Total</th>
        <th>${totals.grandAmount.toLocaleString()}</th>
        <th>${totals.grandTax.toLocaleString()}</th>
        <th>${totals.grandTotal.toLocaleString()}</th>
      </tr>
    </tbody>
  </table>

  <div class="accent">
    <strong>Payment Schedule:</strong> ${data.payment_schedule_text}<br/>
    <strong>Payment Method:</strong> ${data.payment_method} · <strong>Reference:</strong> ${data.payment_reference}
  </div>

  <p><span class="badge">Billing</span> Invoices will be raised per milestone or monthly, as agreed. Interest may be applied on overdue invoices at ${data.late_fee_rate}% per month.</p>

  <h2 class="section-title">3. Client Responsibilities</h2>
  <ul>
    <li>Provide complete and accurate information and documents on a timely basis.</li>
    <li>Attend meetings, sign documents, and comply with procedural timelines.</li>
    <li>Maintain courteous conduct and avoid actions that may prejudice the matter.</li>
  </ul>

  <h2 class="section-title">4. Confidentiality & Data</h2>
  <p>We will maintain confidentiality of client information as per the Advocates Act and applicable professional standards. Documents may be stored on our secure systems and local servers. You consent to such storage and processing for legitimate legal purposes.</p>

  <h2 class="section-title">5. Conflict of Interest</h2>
  <p>We have conducted preliminary checks and found no conflict. If any potential conflict arises, we will promptly inform you and take appropriate steps as per Bar Council rules.</p>

  <h2 class="section-title">6. Document Custody</h2>
  <p>Original documents provided by you will be returned upon reasonable request against acknowledgment. We may retain copies for our records as permitted by law.</p>

  <h2 class="section-title">7. Term & Termination</h2>
  <p>Either party may terminate this engagement upon written notice. Fees for work completed and expenses incurred up to the date of termination shall be payable immediately.</p>

  <h2 class="section-title">8. Limitation of Liability</h2>
  <p>To the extent permitted by law, our liability shall not exceed the fees paid for the services under this Agreement, and we do not guarantee the outcome of any proceedings.</p>

  <h2 class="section-title">9. Governing Law & Jurisdiction</h2>
  <p>This Agreement is governed by the laws of India. Courts at ${data.governing_city} shall have exclusive jurisdiction.</p>

  <h2 class="section-title">10. Acceptance</h2>
  <p>Kindly sign below to confirm your acceptance of the terms of this Engagement Letter, including Annexure A.</p>

  <div class="sign-row" style="margin-top:14px;">
    <div class="sign">
      <strong>For ${firmDetails?.name || data.firm_signatory_name}</strong><br><br><br>
      Signature: ___________________________<br>
      Name: ${data.firm_signatory_name}<br>
      Designation: ${data.firm_signatory_title}<br>
      Date: ${new Date(data.issue_date).toLocaleDateString()}
    </div>
    <div class="sign">
      <strong>Accepted & Agreed – Client</strong><br><br><br>
      Signature: ___________________________<br>
      Name: ${clientName}<br>
      ID Proof (last 4 digits): ${data.client_id_last4}<br>
      Date: ${data.client_sign_date ? new Date(data.client_sign_date).toLocaleDateString() : '_______________'}
    </div>
  </div>

  <h2 class="section-title">Annexure A – Detailed Scope / Deliverables</h2>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Deliverable / Task</th><th>Target Date</th><th>Notes</th>
      </tr>
    </thead>
    <tbody>
      ${data.annexure_rows.map((row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${row.deliverable}</td>
        <td>${row.target_date ? new Date(row.target_date).toLocaleDateString() : 'TBD'}</td>
        <td>${row.notes}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>

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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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

            {/* Client Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Client Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_salutation_or_name">Client Salutation/Name</Label>
                  <Input
                    id="client_salutation_or_name"
                    {...register('client_salutation_or_name')}
                    placeholder={clientName}
                    defaultValue={clientName}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_id_last4">Client ID (Last 4 digits)</Label>
                  <Input
                    id="client_id_last4"
                    {...register('client_id_last4')}
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_address_line1">Address Line 1</Label>
                  <Input
                    id="client_address_line1"
                    {...register('client_address_line1')}
                    placeholder="Street address"
                    defaultValue={client?.address || ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_address_line2">Address Line 2</Label>
                  <Input
                    id="client_address_line2"
                    {...register('client_address_line2')}
                    placeholder="Area, locality"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_city">City</Label>
                  <Input
                    id="client_city"
                    {...register('client_city')}
                    placeholder="City"
                    defaultValue={client?.city || ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_state">State</Label>
                  <Input
                    id="client_state"
                    {...register('client_state')}
                    placeholder="State"
                    defaultValue={client?.state || ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_pin">PIN Code</Label>
                  <Input
                    id="client_pin"
                    {...register('client_pin')}
                    placeholder="110001"
                  />
                </div>
              </div>
            </div>

            {/* Firm Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Firm Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firm_address_line1">Firm Address Line 1</Label>
                  <Input
                    id="firm_address_line1"
                    {...register('firm_address_line1')}
                    placeholder="Office address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firm_address_line2">Firm Address Line 2</Label>
                  <Input
                    id="firm_address_line2"
                    {...register('firm_address_line2')}
                    placeholder="Area, locality"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firm_city">Firm City</Label>
                  <Input
                    id="firm_city"
                    {...register('firm_city')}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firm_state">Firm State</Label>
                  <Input
                    id="firm_state"
                    {...register('firm_state')}
                    placeholder="State"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firm_pin">Firm PIN Code</Label>
                  <Input
                    id="firm_pin"
                    {...register('firm_pin')}
                    placeholder="110001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firm_phone">Firm Phone</Label>
                  <Input
                    id="firm_phone"
                    {...register('firm_phone')}
                    placeholder="+91-11-12345678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firm_gstin">GSTIN</Label>
                  <Input
                    id="firm_gstin"
                    {...register('firm_gstin')}
                    placeholder="07AAACG0606Q1ZN"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firm_signatory_name">Signatory Name</Label>
                  <Input
                    id="firm_signatory_name"
                    {...register('firm_signatory_name')}
                    placeholder="Partner/Managing Partner"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firm_signatory_title">Signatory Title</Label>
                  <Input
                    id="firm_signatory_title"
                    {...register('firm_signatory_title')}
                    placeholder="Managing Partner"
                  />
                </div>
              </div>
            </div>

            {/* Fee Structure */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Fee Structure</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fee_professional_amount">Professional Fee (₹) *</Label>
                  <Input
                    id="fee_professional_amount"
                    type="number"
                    {...register('fee_professional_amount', { required: 'Professional fee is required', min: 0 })}
                    placeholder="100000"
                  />
                  {errors.fee_professional_amount && <p className="text-sm text-red-600">{errors.fee_professional_amount.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fee_professional_tax">Professional Fee Tax (₹)</Label>
                  <Input
                    id="fee_professional_tax"
                    type="number"
                    {...register('fee_professional_tax', { min: 0 })}
                    placeholder="18000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Professional Fee Total</Label>
                  <Input
                    value={`₹${((watchedValues.fee_professional_amount || 0) + (watchedValues.fee_professional_tax || 0)).toLocaleString()}`}
                    disabled
                    className="bg-gray-50"
                  />
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
                  <Label htmlFor="retainer_tax">Retainer Tax (₹)</Label>
                  <Input
                    id="retainer_tax"
                    type="number"
                    {...register('retainer_tax', { min: 0 })}
                    placeholder="9000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Retainer Total</Label>
                  <Input
                    value={`₹${((watchedValues.retainer_amount || 0) + (watchedValues.retainer_tax || 0)).toLocaleString()}`}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oop_amount">Out-of-Pocket Expenses (₹)</Label>
                  <Input
                    id="oop_amount"
                    type="number"
                    {...register('oop_amount', { min: 0 })}
                    placeholder="10000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oop_tax">OOP Tax (₹)</Label>
                  <Input
                    id="oop_tax"
                    type="number"
                    {...register('oop_tax', { min: 0 })}
                    placeholder="1800"
                  />
                </div>

                <div className="space-y-2">
                  <Label>OOP Total</Label>
                  <Input
                    value={`₹${((watchedValues.oop_amount || 0) + (watchedValues.oop_tax || 0)).toLocaleString()}`}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Grand Amount</p>
                    <p className="text-lg font-semibold">₹{((watchedValues.fee_professional_amount || 0) + (watchedValues.retainer_amount || 0) + (watchedValues.oop_amount || 0)).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tax</p>
                    <p className="text-lg font-semibold">₹{((watchedValues.fee_professional_tax || 0) + (watchedValues.retainer_tax || 0) + (watchedValues.oop_tax || 0)).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Grand Total</p>
                    <p className="text-xl font-bold text-primary">₹{((watchedValues.fee_professional_amount || 0) + (watchedValues.fee_professional_tax || 0) + (watchedValues.retainer_amount || 0) + (watchedValues.retainer_tax || 0) + (watchedValues.oop_amount || 0) + (watchedValues.oop_tax || 0)).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_schedule_text">Payment Schedule *</Label>
                  <Textarea
                    id="payment_schedule_text"
                    {...register('payment_schedule_text', { required: 'Payment schedule is required' })}
                    placeholder="50% retainer upfront, balance on completion"
                    rows={2}
                  />
                  {errors.payment_schedule_text && <p className="text-sm text-red-600">{errors.payment_schedule_text.message}</p>}
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

                <div className="space-y-2">
                  <Label htmlFor="payment_reference">Payment Reference</Label>
                  <Input
                    id="payment_reference"
                    {...register('payment_reference')}
                    placeholder="Account details or reference"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="late_fee_rate">Late Fee Rate (% per month)</Label>
                  <Input
                    id="late_fee_rate"
                    type="number"
                    step="0.1"
                    {...register('late_fee_rate')}
                    placeholder="2"
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Dates</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issue_date">Issue Date *</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    {...register('issue_date', { required: 'Issue date is required' })}
                  />
                  {errors.issue_date && <p className="text-sm text-red-600">{errors.issue_date.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_sign_date">Client Sign Date</Label>
                  <Input
                    id="client_sign_date"
                    type="date"
                    {...register('client_sign_date')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="governing_city">Governing City</Label>
                  <Input
                    id="governing_city"
                    {...register('governing_city')}
                    placeholder="New Delhi"
                  />
                </div>
              </div>
            </div>

            {/* Annexure */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary">Annexure A - Deliverables</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ deliverable: '', target_date: '', notes: '' })}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Row
                </Button>
              </div>
              
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor={`annexure_rows.${index}.deliverable`}>Deliverable</Label>
                      <Input
                        id={`annexure_rows.${index}.deliverable`}
                        {...register(`annexure_rows.${index}.deliverable`)}
                        placeholder="Task description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`annexure_rows.${index}.target_date`}>Target Date</Label>
                      <Input
                        id={`annexure_rows.${index}.target_date`}
                        type="date"
                        {...register(`annexure_rows.${index}.target_date`)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`annexure_rows.${index}.notes`}>Notes</Label>
                      <Input
                        id={`annexure_rows.${index}.notes`}
                        {...register(`annexure_rows.${index}.notes`)}
                        placeholder="Additional notes"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(index)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
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