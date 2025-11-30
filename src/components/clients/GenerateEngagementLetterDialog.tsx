import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Loader2, Download, Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { CaseSelector } from '@/components/appointments/CaseSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SendEmailDialog } from './SendEmailDialog';
import { generateEngagementLetter } from '@/lib/engagementLetterTemplate';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GenerateEngagementLetterDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  clientEmail?: string | null;
}

interface LawyerOption {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
}

export function GenerateEngagementLetterDialog({
  open,
  onClose,
  clientId,
  clientName,
  clientEmail
}: GenerateEngagementLetterDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [selectedLawyerId, setSelectedLawyerId] = useState<string>('');
  const [matterDescription, setMatterDescription] = useState('');
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  // Fetch client details
  const { data: clientData } = useQuery({
    queryKey: ['client-details', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('full_name, address, email')
        .eq('id', clientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Fetch selected case details
  const { data: caseData } = useQuery({
    queryKey: ['case-details', selectedCaseId],
    queryFn: async () => {
      if (!selectedCaseId) return null;
      const { data, error } = await supabase
        .from('cases')
        .select('case_title, description')
        .eq('id', selectedCaseId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCaseId
  });

  // Fetch lawyers list
  const { data: lawyers, isLoading: loadingLawyers } = useQuery({
    queryKey: ['lawyers-list'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_lawyers_and_juniors');
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Fetch selected lawyer details
  const { data: lawyerData } = useQuery({
    queryKey: ['lawyer-details', selectedLawyerId],
    queryFn: async () => {
      if (!selectedLawyerId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', selectedLawyerId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedLawyerId
  });

  const selectedLawyer = lawyers?.find(l => l.user_id === selectedLawyerId);

  // Fetch firm details
  const { data: firmData } = useQuery({
    queryKey: ['firm-details'],
    queryFn: async () => {
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', user?.id)
        .single();
      if (!teamMember?.firm_id) throw new Error('Firm not found');
      const { data, error } = await supabase
        .from('law_firms')
        .select('name, address')
        .eq('id', teamMember.firm_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!user
  });

  useEffect(() => {
    if (caseData) {
      setMatterDescription(caseData.description || caseData.case_title || '');
    }
  }, [caseData]);

  const handleNext = () => {
    if (step === 1) {
      if (!selectedCaseId || !selectedLawyerId) {
        toast({
          title: 'Missing Information',
          description: 'Please select both a case and a lawyer.',
          variant: 'destructive'
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!matterDescription.trim()) {
        toast({
          title: 'Missing Information',
          description: 'Please provide a matter description.',
          variant: 'destructive'
        });
        return;
      }
      
      if (!clientData || !selectedLawyer || !firmData) {
        toast({
          title: 'Loading Data',
          description: 'Please wait while we load all required information.',
          variant: 'destructive'
        });
        return;
      }
      
      generateLetter();
      setStep(3);
    }
  };

  const generateLetter = () => {
    if (!clientData || !selectedLawyer || !firmData) return;
    
    const letterHTML = generateEngagementLetter({
      date: new Date(),
      clientName: clientData.full_name,
      clientAddress: clientData.address || '',
      matterDescription: matterDescription,
      lawyerName: selectedLawyer.full_name,
      lawyerPhone: lawyerData?.phone || '',
      lawyerEmail: selectedLawyer.email,
      firmName: firmData.name,
      firmAddress: firmData.address || ''
    });
    
    setGeneratedHTML(letterHTML);
  };

  const generatePDF = async (): Promise<Blob> => {
    const element = document.createElement('div');
    element.innerHTML = generatedHTML;
    
    const options = {
      margin: [50, 20, 30, 20] as [number, number, number, number], // [top, right, bottom, left] in mm
      filename: `Engagement_Letter_${clientName.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    return await html2pdf().set(options).from(element).outputPdf('blob');
  };

  const handleDownloadPDF = async () => {
    setGeneratingPDF(true);
    try {
      const blob = await generatePDF();
      setPdfBlob(blob);
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Engagement_Letter_${clientName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'PDF Downloaded',
        description: 'The engagement letter has been saved as a PDF.',
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleSendEmail = async () => {
    if (!pdfBlob) {
      setGeneratingPDF(true);
      try {
        const blob = await generatePDF();
        setPdfBlob(blob);
        setShowEmailDialog(true);
      } catch (error) {
        console.error('PDF generation error:', error);
        toast({
          title: 'Error',
          description: 'Failed to generate PDF for email. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setGeneratingPDF(false);
      }
    } else {
      setShowEmailDialog(true);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedCaseId('');
    setSelectedLawyerId('');
    setMatterDescription('');
    setGeneratedHTML('');
    setPdfBlob(null);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Generate Engagement Letter</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {step === 1 && (
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <div className="p-3 rounded-md text-sm bg-slate-50">
                    {clientData?.full_name || clientName}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Client Address</Label>
                  <div className="p-3 rounded-md text-sm whitespace-pre-line bg-slate-50">
                    {clientData?.address || 'Not provided'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="case-select">Select Case *</Label>
                  <CaseSelector
                    value={selectedCaseId}
                    onValueChange={setSelectedCaseId}
                    placeholder="Select a case..."
                    clientId={clientId}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lawyer-select">Select Lawyer *</Label>
                  {loadingLawyers ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <Select value={selectedLawyerId} onValueChange={setSelectedLawyerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a lawyer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {lawyers?.map(lawyer => (
                          <SelectItem key={lawyer.user_id} value={lawyer.user_id}>
                            {lawyer.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Case Title</Label>
                    <div className="p-3 rounded-md text-sm bg-slate-50">
                      {caseData?.case_title || 'Loading...'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Lawyer</Label>
                    <div className="p-3 rounded-md text-sm bg-slate-50">
                      {selectedLawyer?.full_name || lawyerData?.full_name || 'Loading...'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="matter-description">Matter Description *</Label>
                  <Textarea
                    id="matter-description"
                    value={matterDescription}
                    onChange={e => setMatterDescription(e.target.value)}
                    placeholder="Describe the legal matter..."
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will appear in the engagement letter as the scope of work.
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 py-4">
                {!generatedHTML ? (
                  <div className="flex items-center justify-center h-[500px] w-full border rounded-md">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ScrollArea className="h-[500px] w-full border rounded-md bg-white">
                    <div 
                      className="p-6" 
                      dangerouslySetInnerHTML={{ __html: generatedHTML }}
                    />
                  </ScrollArea>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 flex justify-between items-center sm:justify-between gap-2">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {step < 3 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadPDF}
                    disabled={generatingPDF}
                  >
                    {generatingPDF ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download PDF
                  </Button>
                  <Button 
                    onClick={handleSendEmail}
                    disabled={generatingPDF}
                  >
                    {generatingPDF ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Send Email
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showEmailDialog && clientEmail && pdfBlob && (
        <SendEmailDialog
          open={showEmailDialog}
          onClose={() => setShowEmailDialog(false)}
          clientEmail={clientEmail}
          clientName={clientName}
          defaultSubject={`Engagement Letter for Legal Services - ${caseData?.case_title || 'Legal Matter'}`}
          defaultBody={`Dear ${clientName},\n\nPlease find attached the engagement letter for your legal matter: ${caseData?.case_title || 'Legal Matter'}.\n\nKindly review the terms and conditions outlined in the letter. If you have any questions, please feel free to contact us.\n\nBest regards,\n${selectedLawyer?.full_name || lawyerData?.full_name || ''}\n${firmData?.name || ''}`}
          pdfAttachment={pdfBlob}
          pdfFileName={`Engagement_Letter_${clientName.replace(/\s+/g, '_')}.pdf`}
        />
      )}
    </>
  );
}
