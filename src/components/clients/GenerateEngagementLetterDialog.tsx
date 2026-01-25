import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { 
  X, 
  Loader2, 
  Download, 
  Mail, 
  ArrowLeft, 
  ChevronRight, 
  User, 
  Briefcase, 
  FileText,
  Check,
  Search,
  FileSignature,
  Building,
  MapPin
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { SendEmailDialog } from './SendEmailDialog';
import { generateEngagementLetter } from '@/lib/engagementLetterTemplate';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CaseSelector } from '@/components/appointments/CaseSelector';
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

interface Case {
  id: string;
  case_title: string;
  case_number: string;
  description?: string;
}

type StepType = 'form' | 'case' | 'lawyer' | 'description' | 'preview';

export function GenerateEngagementLetterDialog({
  open,
  onClose,
  clientId,
  clientName,
  clientEmail
}: GenerateEngagementLetterDialogProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [step, setStep] = useState<StepType>('form');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [selectedLawyerId, setSelectedLawyerId] = useState<string>('');
  const [matterDescription, setMatterDescription] = useState('');
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [caseSearch, setCaseSearch] = useState('');
  const [lawyerSearch, setLawyerSearch] = useState('');

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

  // Fetch cases for this client
  const { data: cases } = useQuery({
    queryKey: ['client-cases', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title, case_number, description')
        .eq('client_id', clientId)
        .order('case_title');
      if (error) throw error;
      return data as Case[];
    },
    enabled: open
  });

  // Fetch lawyers list
  const { data: lawyers, isLoading: loadingLawyers } = useQuery({
    queryKey: ['lawyers-list'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_lawyers_and_juniors');
      if (error) throw error;
      return data as LawyerOption[];
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
  const selectedCase = cases?.find(c => c.id === selectedCaseId);

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
    if (selectedCase) {
      setMatterDescription(selectedCase.description || selectedCase.case_title || '');
    }
  }, [selectedCase]);

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setStep('form');
      setSelectedCaseId('');
      setSelectedLawyerId('');
      setMatterDescription('');
      setGeneratedHTML('');
      setPdfBlob(null);
      setCaseSearch('');
      setLawyerSearch('');
    }
  }, [open]);

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

  const handleGeneratePreview = () => {
    if (!selectedCaseId || !selectedLawyerId) {
      toast({
        title: 'Missing Information',
        description: 'Please select both a case and a lawyer.',
        variant: 'destructive'
      });
      return;
    }
    if (!matterDescription.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a matter description.',
        variant: 'destructive'
      });
      return;
    }
    generateLetter();
    setStep('preview');
  };

  const generatePDF = async (): Promise<Blob> => {
    const element = document.createElement('div');
    element.innerHTML = generatedHTML;
    
    const options = {
      margin: [50, 20, 30, 20] as [number, number, number, number],
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

  const goBack = () => {
    setStep('form');
    setCaseSearch('');
    setLawyerSearch('');
  };

  // Filtered lists
  const filteredCases = cases?.filter(c => 
    c.case_title.toLowerCase().includes(caseSearch.toLowerCase()) ||
    (c.case_number && c.case_number.toLowerCase().includes(caseSearch.toLowerCase()))
  ) || [];

  const filteredLawyers = lawyers?.filter(l =>
    l.full_name.toLowerCase().includes(lawyerSearch.toLowerCase())
  ) || [];

  // Avatar helper
  const getAvatarColor = (name: string) => {
    const colors = [
      { bg: 'bg-rose-100', text: 'text-rose-500' },
      { bg: 'bg-sky-100', text: 'text-sky-500' },
      { bg: 'bg-violet-100', text: 'text-violet-500' },
      { bg: 'bg-emerald-100', text: 'text-emerald-500' },
      { bg: 'bg-amber-100', text: 'text-amber-500' },
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const Avatar = ({ name }: { name: string }) => {
    const color = getAvatarColor(name);
    return (
      <div className={cn("w-11 h-11 rounded-full flex items-center justify-center shrink-0", color.bg)}>
        <span className={cn("text-sm font-semibold", color.text)}>
          {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  };

  // Shared picker header
  const PickerHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-background sticky top-0 z-10">
      <button 
        onClick={goBack} 
        className="w-9 h-9 flex items-center justify-center rounded-full bg-muted active:scale-95 transition-transform"
      >
        <ArrowLeft className="w-5 h-5 text-foreground" />
      </button>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    </div>
  );

  // Search input component
  const SearchInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
    <div className="px-4 py-3 border-b border-border bg-muted/30">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder={placeholder} 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          className="h-11 pl-10 rounded-xl bg-background border-border" 
          autoFocus 
        />
      </div>
    </div>
  );

  // Main form view
  const renderFormView = () => (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5 bg-muted/30">
        <h2 className="text-2xl font-bold text-foreground">Engagement Letter</h2>
        <button 
          onClick={onClose} 
          className="w-10 h-10 flex items-center justify-center rounded-full bg-muted active:scale-95 transition-transform"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-28 px-4">
        {/* Client Info Card */}
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm mb-4">
          <div className="flex items-center gap-4 p-4 border-b border-border">
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
              <User className="w-5 h-5 text-violet-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Client</p>
              <p className="text-base font-semibold text-foreground mt-0.5">
                {clientData?.full_name || clientName}
              </p>
            </div>
          </div>
          {clientData?.address && (
            <div className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Address</p>
                <p className="text-sm text-foreground mt-0.5 whitespace-pre-line">
                  {clientData.address}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Case Selection */}
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm mb-4">
          <button 
            type="button" 
            onClick={() => setStep('case')} 
            className="w-full flex items-center gap-4 p-4 active:bg-muted/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Select Case <span className="text-rose-400">*</span>
              </p>
              <p className={cn("text-base font-semibold mt-0.5 truncate", selectedCase ? "text-foreground" : "text-muted-foreground")}>
                {selectedCase ? selectedCase.case_title : 'Choose a case'}
              </p>
              {selectedCase?.case_number && (
                <p className="text-xs text-muted-foreground truncate">{selectedCase.case_number}</p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/50 shrink-0" />
          </button>
        </div>

        {/* Lawyer Selection */}
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm mb-4">
          <button 
            type="button" 
            onClick={() => setStep('lawyer')} 
            className="w-full flex items-center gap-4 p-4 active:bg-muted/50 transition-colors"
          >
            {selectedLawyer ? (
              <Avatar name={selectedLawyer.full_name} />
            ) : (
              <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center">
                <User className="w-5 h-5 text-sky-500" />
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Select Lawyer <span className="text-rose-400">*</span>
              </p>
              <p className={cn("text-base font-semibold mt-0.5", selectedLawyer ? "text-foreground" : "text-muted-foreground")}>
                {selectedLawyer?.full_name || 'Choose a lawyer'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
          </button>
        </div>

        {/* Matter Description */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
            Matter Description <span className="text-rose-400">*</span>
          </p>
          <div className="bg-card rounded-2xl overflow-hidden shadow-sm p-4">
            <Textarea
              value={matterDescription}
              onChange={e => setMatterDescription(e.target.value)}
              placeholder="Describe the legal matter and scope of work..."
              className="min-h-[120px] rounded-xl resize-none border-0 bg-transparent p-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 px-1">
            This will appear in the engagement letter as the scope of work.
          </p>
        </div>

        {/* Firm Info Display */}
        {firmData && (
          <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <Building className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Firm</p>
                <p className="text-base font-semibold text-foreground mt-0.5">{firmData.name}</p>
                {firmData.address && (
                  <p className="text-xs text-muted-foreground mt-1">{firmData.address}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-muted/30 safe-area-pb">
        <Button 
          onClick={handleGeneratePreview}
          disabled={!selectedCaseId || !selectedLawyerId || !matterDescription.trim()}
          className="w-full h-14 rounded-full text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl"
        >
          <FileSignature className="w-5 h-5 mr-2" />
          Generate Letter
        </Button>
      </div>
    </div>
  );

  // Case picker view
  const renderCasePicker = () => (
    <div className="flex flex-col h-full bg-background">
      <PickerHeader title="Select Case" />
      <SearchInput value={caseSearch} onChange={setCaseSearch} placeholder="Search by title or number..." />
      <div className="flex-1 overflow-y-auto">
        {filteredCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Briefcase className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No cases found</p>
          </div>
        ) : (
          filteredCases.map(caseItem => {
            const isSelected = selectedCaseId === caseItem.id;
            return (
              <button
                key={caseItem.id}
                onClick={() => {
                  setSelectedCaseId(caseItem.id);
                  goBack();
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-4 border-b border-border active:bg-muted/50 transition-colors bg-background",
                  isSelected && "bg-amber-50"
                )}
              >
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-foreground truncate">{caseItem.case_title}</p>
                  {caseItem.case_number && (
                    <p className="text-sm text-muted-foreground truncate">{caseItem.case_number}</p>
                  )}
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // Lawyer picker view
  const renderLawyerPicker = () => (
    <div className="flex flex-col h-full bg-background">
      <PickerHeader title="Select Lawyer" />
      <SearchInput value={lawyerSearch} onChange={setLawyerSearch} placeholder="Search lawyers..." />
      <div className="flex-1 overflow-y-auto">
        {loadingLawyers ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLawyers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <User className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No lawyers found</p>
          </div>
        ) : (
          filteredLawyers.map(lawyer => {
            const isSelected = selectedLawyerId === lawyer.user_id;
            return (
              <button
                key={lawyer.user_id}
                onClick={() => {
                  setSelectedLawyerId(lawyer.user_id);
                  goBack();
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-4 border-b border-border active:bg-muted/50 transition-colors bg-background",
                  isSelected && "bg-sky-50"
                )}
              >
                <Avatar name={lawyer.full_name} />
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{lawyer.full_name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{lawyer.role}</p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // Preview view
  const renderPreviewView = () => (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-background sticky top-0 z-10">
        <button 
          onClick={() => setStep('form')} 
          className="w-9 h-9 flex items-center justify-center rounded-full bg-muted active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h3 className="text-lg font-semibold text-foreground">Preview Letter</h3>
      </div>

      {/* Letter Preview */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        {!generatedHTML ? (
          <div className="flex items-center justify-center h-[400px] bg-card rounded-2xl border border-border">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            <div 
              className="p-6" 
              dangerouslySetInnerHTML={{ __html: generatedHTML }}
            />
          </div>
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-muted/30 safe-area-pb space-y-2">
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={generatingPDF}
            className="flex-1 h-14 rounded-full text-base font-semibold bg-card border-border"
          >
            {generatingPDF ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            Download
          </Button>
          <Button 
            onClick={handleSendEmail}
            disabled={generatingPDF || !clientEmail}
            className="flex-1 h-14 rounded-full text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl"
          >
            {generatingPDF ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Mail className="w-5 h-5 mr-2" />
            )}
            Email
          </Button>
        </div>
      </div>
    </div>
  );

  // Desktop fallback (keep original dialog for desktop)
  if (!isMobile) {
    return (
      <>
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Generate Engagement Letter</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              {step === 'form' && (
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label>Client Name</Label>
                    <div className="p-3 rounded-md text-sm bg-muted">
                      {clientData?.full_name || clientName}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Client Address</Label>
                    <div className="p-3 rounded-md text-sm whitespace-pre-line bg-muted">
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

              {step === 'preview' && (
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
                {step === 'preview' && (
                  <Button variant="outline" onClick={() => setStep('form')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {step === 'form' ? (
                  <Button onClick={handleGeneratePreview}>
                    Generate Preview
                    <FileSignature className="w-4 h-4 ml-2" />
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
            defaultSubject={`Engagement Letter for Legal Services - ${selectedCase?.case_title || 'Legal Matter'}`}
            defaultBody={`Dear ${clientName},\n\nPlease find attached the engagement letter for your legal matter: ${selectedCase?.case_title || 'Legal Matter'}.\n\nKindly review the terms and conditions outlined in the letter. If you have any questions, please feel free to contact us.\n\nBest regards,\n${selectedLawyer?.full_name || lawyerData?.full_name || ''}\n${firmData?.name || ''}`}
            pdfAttachment={pdfBlob}
            pdfFileName={`Engagement_Letter_${clientName.replace(/\s+/g, '_')}.pdf`}
          />
        )}
      </>
    );
  }

  // Mobile view with Sheet
  return (
    <>
      <Sheet open={open} onOpenChange={isOpen => !isOpen && onClose()}>
        <SheetContent hideCloseButton side="bottom" className="h-[95vh] rounded-t-3xl p-0 overflow-hidden">
          <div className="h-full">
            {step === 'form' && renderFormView()}
            {step === 'case' && renderCasePicker()}
            {step === 'lawyer' && renderLawyerPicker()}
            {step === 'preview' && renderPreviewView()}
          </div>
        </SheetContent>
      </Sheet>

      {showEmailDialog && clientEmail && pdfBlob && (
        <SendEmailDialog
          open={showEmailDialog}
          onClose={() => setShowEmailDialog(false)}
          clientEmail={clientEmail}
          clientName={clientName}
          defaultSubject={`Engagement Letter for Legal Services - ${selectedCase?.case_title || 'Legal Matter'}`}
          defaultBody={`Dear ${clientName},\n\nPlease find attached the engagement letter for your legal matter: ${selectedCase?.case_title || 'Legal Matter'}.\n\nKindly review the terms and conditions outlined in the letter. If you have any questions, please feel free to contact us.\n\nBest regards,\n${selectedLawyer?.full_name || lawyerData?.full_name || ''}\n${firmData?.name || ''}`}
          pdfAttachment={pdfBlob}
          pdfFileName={`Engagement_Letter_${clientName.replace(/\s+/g, '_')}.pdf`}
        />
      )}
    </>
  );
}
