import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLegalkartIntegration } from '@/hooks/useLegalkartIntegration';
import { Loader2 } from 'lucide-react';

interface FetchCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

interface FetchFormData {
  cnr_number: string;
}

export const FetchCaseDialog: React.FC<FetchCaseDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [searchType, setSearchType] = useState<'high_court' | 'district_court' | 'supreme_court'>('district_court');
  const [fetchedData, setFetchedData] = useState<any>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FetchFormData>();
  const { searchCase } = useLegalkartIntegration();

  const parsePartyInfo = (partyStr: string | undefined) => {
    if (!partyStr) return { name: '', advocate: '' };
    
    // Split by "Advocate-" or "Advocate -" (case insensitive)
    const parts = partyStr.split(/Advocate\s*-\s*/i);
    
    const rawNames = parts[0]?.trim() || '';
    const rawAdvocate = parts[1]?.trim() || '';
    
    // Check if there are multiple parties (contains "2)" or more numbers)
    const hasMultipleParties = /\d+\)/.test(rawNames) && rawNames.includes('2)');
    
    // For name: keep numbers only if multiple parties, otherwise remove them
    let name = rawNames;
    if (!hasMultipleParties) {
      // Remove leading numbers like "1)" for single party
      name = rawNames.replace(/^\d+\)\s*/, '').trim();
    }
    
    // For advocate: detect based on brackets with codes or "NOTICE SERVED"
    let advocate = '';
    if (rawAdvocate) {
      // Look for text with brackets containing numbers (like "MR C B UPADHYAYA(3508)")
      // or text with "NOTICE SERVED"
      const advocateMatch = rawAdvocate.match(/[A-Z\s\.]+(?:\(\d+\)|NOTICE SERVED\(\d+\))/gi);
      if (advocateMatch) {
        advocate = advocateMatch.join(', ');
      } else {
        advocate = rawAdvocate;
      }
    }
    
    return { name, advocate };
  };

  const handleFetch = async (data: FetchFormData) => {
    try {
      const result = await searchCase.mutateAsync({
        cnr: data.cnr_number,
        searchType: searchType,
      });

      if (result?.success && result?.data) {
        // Parse the nested Legalkart response structure
        const rawData = result.data;
        const caseInfo = rawData.data?.case_info || {};
        const caseStatus = rawData.data?.case_status || {};
        
        const petitionerInfo = parsePartyInfo(rawData.data?.petitioner_and_advocate);
        const respondentInfo = parsePartyInfo(rawData.data?.respondent_and_advocate);
        
        // Create case title without numbers
        const petitionerName = petitionerInfo.name.replace(/^\d+\)\s*/g, '').trim();
        const respondentName = respondentInfo.name.replace(/^\d+\)\s*/g, '').trim();
        const caseTitle = petitionerName && respondentName 
          ? `${petitionerName} vs ${respondentName}` 
          : rawData.case_title || rawData.title || caseInfo.filing_number || 'Case Details';
        
        // Map to a flatter structure for display
        const parsedData = {
          raw: rawData, // Keep raw for later use
          case_title: caseTitle,
          case_number: caseInfo.registration_number || rawData.registration_number || caseInfo.filing_number || rawData.case_number,
          cnr_number: (caseInfo.cnr_number || rawData.cnr_number || rawData.cnr || rawData.CNR || '').replace(/[-\s]/g, ''),
          filing_number: caseInfo.filing_number || rawData.filing_number,
          registration_number: caseInfo.registration_number || rawData.registration_number,
          court: caseStatus.court || rawData.court || rawData.court_name,
          court_name: caseStatus.court || rawData.court_name || rawData.court,
          district: caseStatus.district || rawData.district,
          state: caseStatus.state || rawData.state,
          filing_date: caseInfo.date_of_filing || rawData.filing_date,
          registration_date: caseInfo.date_of_registration || rawData.registration_date,
          first_hearing_date: caseInfo.date_of_first_hearing || rawData.first_hearing_date,
          next_hearing_date: caseInfo.date_next_hearing || rawData.next_hearing_date,
          status: caseStatus.stage_of_case || rawData.status || 'Open',
          stage: caseStatus.stage_of_case || rawData.stage,
          case_type: rawData.case_type || rawData.matter_type || caseInfo.case_type,
          petitioner: petitionerInfo.name,
          petitioner_advocate: petitionerInfo.advocate,
          respondent: respondentInfo.name,
          respondent_advocate: respondentInfo.advocate,
          bench_type: caseStatus.bench_type || rawData.bench_type,
          court_complex: rawData.court_complex,
          coram: caseStatus.coram || rawData.coram,
          under_act: rawData.under_act || caseInfo.under_act,
          under_section: rawData.under_section || caseInfo.under_section,
        };

        setFetchedData(parsedData);
        toast({
          title: "Case Details Fetched",
          description: "Successfully retrieved case details from eCourts.",
        });
      } else {
        throw new Error(result?.error || 'Failed to fetch case details');
      }
    } catch (error: any) {
      toast({
        title: "Fetch Failed",
        description: error.message || "Unable to fetch case details. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddCase = () => {
    if (fetchedData) {
      onSuccess(fetchedData);
      setFetchedData(null);
      reset();
      onClose();
    }
  };

  const handleCancel = () => {
    setFetchedData(null);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fetch Case Details from eCourts</DialogTitle>
        </DialogHeader>
        
        {!fetchedData ? (
          <form onSubmit={handleSubmit(handleFetch)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cnr_number">CNR Number *</Label>
              <Input
                id="cnr_number"
                {...register('cnr_number', { required: 'CNR number is required' })}
                placeholder="Enter CNR number (e.g., DLCT010012345678)"
              />
              {errors.cnr_number && (
                <p className="text-sm text-destructive">{errors.cnr_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="searchType">Court Type *</Label>
              <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select court type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="district_court">District Court</SelectItem>
                  <SelectItem value="high_court">High Court</SelectItem>
                  <SelectItem value="supreme_court">Supreme Court</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={searchCase.isPending}>
                {searchCase.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  'Fetch Details'
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-[#F9FAFB] rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-bold text-[#1F2937]">Basic Case Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-[#6B7280]">Case Title</p>
                  <p className="font-medium text-[#111827]">{fetchedData.case_title || '-'}</p>
                </div>
                {fetchedData.case_number && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Case Number</p>
                    <p className="font-medium text-[#111827]">{fetchedData.case_number}</p>
                  </div>
                )}
                {fetchedData.cnr_number && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">CNR Number</p>
                    <p className="font-medium text-[#111827]">{fetchedData.cnr_number}</p>
                  </div>
                )}
                {fetchedData.filing_number && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Filing Number</p>
                    <p className="font-medium text-[#111827]">{fetchedData.filing_number}</p>
                  </div>
                )}
                {fetchedData.registration_number && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Registration Number</p>
                    <p className="font-medium text-[#111827]">{fetchedData.registration_number}</p>
                  </div>
                )}
                {fetchedData.court && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Court Name</p>
                    <p className="font-medium text-[#111827]">{fetchedData.court}</p>
                  </div>
                )}
                {fetchedData.district && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">District</p>
                    <p className="font-medium text-[#111827]">{fetchedData.district}</p>
                  </div>
                )}
                {fetchedData.state && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">State</p>
                    <p className="font-medium text-[#111827]">{fetchedData.state}</p>
                  </div>
                )}
                {fetchedData.filing_date && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Filing Date</p>
                    <p className="font-medium text-[#111827]">{fetchedData.filing_date}</p>
                  </div>
                )}
                {fetchedData.registration_date && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Registration Date</p>
                    <p className="font-medium text-[#111827]">{fetchedData.registration_date}</p>
                  </div>
                )}
                {fetchedData.first_hearing_date && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">First Hearing Date</p>
                    <p className="font-medium text-[#111827]">{fetchedData.first_hearing_date}</p>
                  </div>
                )}
                {fetchedData.next_hearing_date && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Next Hearing Date</p>
                    <p className="font-medium text-[#111827]">{fetchedData.next_hearing_date}</p>
                  </div>
                )}
                {fetchedData.status && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Status</p>
                    <p className="font-medium text-[#111827]">{fetchedData.status}</p>
                  </div>
                )}
                {fetchedData.stage && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Stage</p>
                    <p className="font-medium text-[#111827]">{fetchedData.stage}</p>
                  </div>
                )}
                {fetchedData.case_type && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Case Type</p>
                    <p className="font-medium text-[#111827]">{fetchedData.case_type}</p>
                  </div>
                )}
                {fetchedData.petitioner && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Petitioner</p>
                    <p className="font-medium text-[#111827]">{fetchedData.petitioner}</p>
                  </div>
                )}
                {fetchedData.petitioner_advocate && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Petitioner Advocate</p>
                    <p className="font-medium text-[#111827]">{fetchedData.petitioner_advocate}</p>
                  </div>
                )}
                {fetchedData.respondent && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Respondent</p>
                    <p className="font-medium text-[#111827]">{fetchedData.respondent}</p>
                  </div>
                )}
                {fetchedData.respondent_advocate && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Respondent Advocate</p>
                    <p className="font-medium text-[#111827]">{fetchedData.respondent_advocate}</p>
                  </div>
                )}
                {fetchedData.bench_type && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Bench Type</p>
                    <p className="font-medium text-[#111827]">{fetchedData.bench_type}</p>
                  </div>
                )}
                {fetchedData.court_complex && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Court Complex</p>
                    <p className="font-medium text-[#111827]">{fetchedData.court_complex}</p>
                  </div>
                )}
                {fetchedData.coram && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Coram (Judge)</p>
                    <p className="font-medium text-[#111827]">{fetchedData.coram}</p>
                  </div>
                )}
                {fetchedData.under_act && (
                  <div className="space-y-1 col-span-1 md:col-span-2">
                    <p className="text-[#6B7280]">Under Act</p>
                    <p className="font-medium text-[#111827]">{fetchedData.under_act}</p>
                  </div>
                )}
                {fetchedData.under_section && (
                  <div className="space-y-1 col-span-1 md:col-span-2">
                    <p className="text-[#6B7280]">Under Section</p>
                    <p className="font-medium text-[#111827]">{fetchedData.under_section}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="button" onClick={handleAddCase}>
                Add Case
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
