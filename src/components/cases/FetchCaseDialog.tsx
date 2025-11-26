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
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface FetchCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  preSelectedClientId?: string;
}

interface FetchFormData {
  cnr_number: string;
}

export const FetchCaseDialog: React.FC<FetchCaseDialogProps> = ({
  open,
  onClose,
  onSuccess,
  preSelectedClientId
}) => {
  const { toast } = useToast();
  const [searchType, setSearchType] = useState<'high_court' | 'district_court' | 'supreme_court'>('district_court');
  const [fetchedData, setFetchedData] = useState<any>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FetchFormData>();
  const { searchCase } = useLegalkartIntegration();

  // Supreme Court case detection
  const isSupremeCourtCase = (data: any): boolean => {
    return !!(
      data?.diary_number ||
      data?.data?.diary_number ||
      (data?.cnr_number || data?.data?.case_details?.['CNR Number'] || '').startsWith('SCIN')
    );
  };

  const parsePartyInfo = (partyStr: string | undefined) => {
    if (!partyStr) return { name: '', advocate: '' };
    
    // Split by "Advocate-" or "Advocate -" (case insensitive)
    const parts = partyStr.split(/Advocate\s*-\s*/i);
    
    const rawNames = parts[0]?.trim() || '';
    const rawAdvocate = parts[1]?.trim() || '';
    
    // Check if there are multiple parties (contains "2)" indicating at least 2 parties)
    const hasMultipleParties = rawNames.includes('2)');
    
    // For name: keep numbers if multiple parties, otherwise remove the leading number
    let name = rawNames;
    if (!hasMultipleParties && /^\d+\)\s*/.test(rawNames)) {
      // Single party: remove the leading "1)" 
      name = rawNames.replace(/^\d+\)\s*/, '').trim();
    }
    // If multiple parties, keep all numbers and formatting as-is
    
    // For advocate: extract advocate names with codes or NOTICE SERVED
    let advocate = '';
    if (rawAdvocate) {
      // Match patterns like "MR C B UPADHYAYA(3508)" or "NOTICE SERVED(4)"
      const advocateMatches = rawAdvocate.match(/(?:[A-Z][A-Z\s\.]+(?:\([^)]+\)))/g);
      if (advocateMatches) {
        advocate = advocateMatches.join(', ');
      } else {
        advocate = rawAdvocate.trim();
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
        const rawData = result.data;
        
        // Check if this is a Supreme Court case
        if (isSupremeCourtCase(rawData)) {
          // Supreme Court specific parsing
          const apiData = rawData.data || rawData;
          const caseDetails = apiData.case_details || {};
          
          const parsedData = {
            raw: rawData,
            is_supreme_court: true,
            
            // SC-specific fields from root level (lowercase)
            diary_number: apiData.diary_number || caseDetails['Diary Number'],
            case_numbers: apiData.case_numbers || [],
            
            // Core case info from case_details (capitalized field names)
            case_title: caseDetails['Case Title'] || apiData.case_title || 'Supreme Court Case',
            cnr_number: (caseDetails['CNR Number'] || apiData.cnr_number || '').replace(/[-\s]/g, ''),
            category: caseDetails['Category'] || caseDetails['Sub Category'],
            status: caseDetails['Status/Stage'] || apiData.status || 'Pending',
            
            // Parties from case_details
            petitioner: caseDetails['Petitioner(s)'] || apiData.petitioner || '',
            petitioner_advocate: caseDetails['Petitioner Advocate(s)'] || '',
            respondent: caseDetails['Respondent(s)'] || apiData.respondent || '',
            respondent_advocate: caseDetails['Respondent Advocate(s)'] || '',
            
            // Bench composition from "Present/Last Listed On"
            bench_composition: caseDetails['Present/Last Listed On'] || '',
            
            // Court info
            court: 'Supreme Court of India',
            court_name: 'Supreme Court of India',
            
            // SC-specific nested data counts
            earlier_courts_count: Array.isArray(caseDetails['Earlier Court Details']) ? caseDetails['Earlier Court Details'].length : 0,
            tagged_matters_count: Array.isArray(caseDetails['Tagged Matters']) ? caseDetails['Tagged Matters'].length : 0,
            listing_dates_count: Array.isArray(caseDetails['Listing Dates']) ? caseDetails['Listing Dates'].length : 0,
            notices_count: Array.isArray(caseDetails['Notices']) ? caseDetails['Notices'].length : 0,
            defects_count: Array.isArray(caseDetails['Defects']) ? caseDetails['Defects'].length : 0,
            orders_count: Array.isArray(caseDetails['Judgement Orders']) ? caseDetails['Judgement Orders'].length : 0,
            office_reports_count: Array.isArray(caseDetails['Office Report']) ? caseDetails['Office Report'].length : 0,
          };
          
          setFetchedData(parsedData);
        } else {
          // High Court / District Court parsing (existing logic)
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
            raw: rawData,
            is_supreme_court: false,
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
        }
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

  const queryClient = useQueryClient();

  const addCaseMutation = useMutation({
    mutationFn: async (caseData: any) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user's firm_id
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', user.id)
        .single();

      if (!teamMember) throw new Error('User is not part of any firm');

      const firmId = teamMember.firm_id;
      const rawData = caseData.raw?.data || {};

      // Map status to valid enum values (pending, disposed)
      const mapStatus = (status: string | undefined): 'pending' | 'disposed' => {
        if (!status) return 'pending';
        const normalized = status.toLowerCase();
        if (normalized.includes('close') || normalized.includes('disposed') || normalized.includes('decided')) {
          return 'disposed';
        }
        return 'pending';
      };

      // Map case_type to valid enum values
      const mapCaseType = (type: string | undefined): 'civil' | 'criminal' | 'family' | 'corporate' | 'constitutional' | 'immigration' | 'intellectual_property' | 'labor' | 'real_estate' | 'tax' | 'other' => {
        if (!type) return 'civil';
        const normalized = type.toLowerCase();
        if (normalized.includes('criminal')) return 'criminal';
        if (normalized.includes('family')) return 'family';
        if (normalized.includes('commercial') || normalized.includes('corporate')) return 'corporate';
        if (normalized.includes('constitutional')) return 'constitutional';
        if (normalized.includes('immigration')) return 'immigration';
        if (normalized.includes('intellectual') || normalized.includes('ip')) return 'intellectual_property';
        if (normalized.includes('labor') || normalized.includes('labour')) return 'labor';
        if (normalized.includes('real estate') || normalized.includes('property')) return 'real_estate';
        if (normalized.includes('tax')) return 'tax';
        if (normalized.includes('other')) return 'other';
        return 'civil';
      };

      // Prepare case data for insertion
      const insertData: any = {
        // Basic info
        case_title: caseData.case_title,
        case_number: caseData.case_number,
        cnr_number: caseData.cnr_number,
        filing_number: caseData.filing_number,
        registration_number: caseData.registration_number,
        
        // Court info
        court: caseData.court,
        court_name: caseData.court_name,
        
        // Status and type - mapped to valid enum values
        status: mapStatus(caseData.status),
        stage: caseData.stage,
        case_type: caseData.is_supreme_court ? 'other' : mapCaseType(caseData.case_type),
        
        // Parties
        petitioner: caseData.petitioner,
        petitioner_advocate: caseData.petitioner_advocate,
        respondent: caseData.respondent,
        respondent_advocate: caseData.respondent_advocate,
        vs: caseData.petitioner && caseData.respondent 
          ? `${caseData.petitioner} vs ${caseData.respondent}` 
          : null,
        
        // Client link
        client_id: preSelectedClientId || null,
        
        // Metadata
        firm_id: firmId,
        created_by: user.id,
        fetched_data: caseData.raw,
        is_auto_fetched: true,
        last_fetched_at: new Date().toISOString(),
        fetch_status: 'success',
      };

      // Add HC/DC specific fields only if not SC case
      if (!caseData.is_supreme_court) {
        insertData.court_complex = caseData.court_complex;
        insertData.district = caseData.district;
        insertData.state = caseData.state;
        insertData.bench_type = caseData.bench_type;
        insertData.coram = caseData.coram;
        insertData.filing_date = caseData.filing_date;
        insertData.registration_date = caseData.registration_date;
        insertData.first_hearing_date = caseData.first_hearing_date;
        insertData.next_hearing_date = caseData.next_hearing_date;
        insertData.under_act = caseData.under_act;
        insertData.under_section = caseData.under_section;
      }

      // Insert the case
      const { data: insertedCase, error: caseError } = await supabase
        .from('cases')
        .insert([insertData])
        .select()
        .single();

      if (caseError) throw caseError;
      const caseId = insertedCase.id;

      // Parse and insert hearing history
      const hearingHistory = rawData.history || [];
      if (Array.isArray(hearingHistory) && hearingHistory.length > 0) {
        const hearingsToInsert = hearingHistory
          .filter((h: any) => h.hearing_date || h.date)
          .map((hearing: any) => ({
            case_id: caseId,
            firm_id: firmId,
            hearing_date: hearing.hearing_date || hearing.date,
            court_name: caseData.court_name || caseData.court,
            judge_name: hearing.judge_name || hearing.coram || caseData.coram,
            hearing_type: hearing.purpose_of_hearing || hearing.business || 'General Hearing',
            status: hearing.status || 'completed',
            outcome: hearing.outcome || hearing.business,
            notes: hearing.purpose || hearing.listing_reason,
            created_by: user.id,
            assigned_to: user.id,
          }));

        if (hearingsToInsert.length > 0) {
          const { error: hearingsError } = await supabase
            .from('case_hearings')
            .insert(hearingsToInsert);
          
          if (hearingsError) {
            console.error('Failed to insert hearings:', hearingsError);
          }
        }
      }

      // Show API Response JSON
      console.log('📦 API Response JSON:', JSON.stringify(rawData, null, 2));
      
      // Parse and store all case data using edge function
      const { data: upsertResult, error: upsertError } = await supabase.functions.invoke('legalkart-api', {
        body: {
          action: 'upsert_from_json',
          caseId: caseId,
          rawData: rawData
        }
      });

      if (upsertError) {
        console.error('Failed to upsert case data:', upsertError);
      } else {
        console.log('✅ Case data upserted successfully:', upsertResult);
      }

      // Parse and insert document links as case activities
      const documents = rawData.documents || [];
      if (Array.isArray(documents) && documents.length > 0) {
        const documentActivities = documents
          .filter((doc: any) => doc.document_name || doc.name)
          .map((doc: any) => ({
            case_id: caseId,
            activity_type: 'document_reference',
            description: `Document: ${doc.document_name || doc.name}`,
            created_by: user.id,
            metadata: {
              document_url: doc.document_url || doc.url || doc.link,
              document_name: doc.document_name || doc.name,
              document_date: doc.document_date || doc.date,
              document_type: doc.document_type || doc.type,
            }
          }));

        if (documentActivities.length > 0) {
          const { error: activitiesError } = await supabase
            .from('case_activities')
            .insert(documentActivities);

          if (activitiesError) {
            console.error('Failed to insert document activities:', activitiesError);
          }
        }
      }

      // Parse and insert orders as case activities
      const orders = rawData.orders || [];
      if (Array.isArray(orders) && orders.length > 0) {
        const orderActivities = orders
          .filter((order: any) => order.order_date || order.date)
          .map((order: any) => ({
            case_id: caseId,
            activity_type: 'order_received',
            description: `Order: ${order.order_description || order.description || 'Court Order'}`,
            created_by: user.id,
            metadata: {
              order_date: order.order_date || order.date,
              order_description: order.order_description || order.description,
              order_type: order.order_type || order.type,
              order_url: order.order_url || order.url || order.link,
            }
          }));

        if (orderActivities.length > 0) {
          const { error: orderError } = await supabase
            .from('case_activities')
            .insert(orderActivities);

          if (orderError) {
            console.error('Failed to insert order activities:', orderError);
          }
        }
      }

      return insertedCase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast({
        title: "Case Added Successfully",
        description: "The case has been added to your database.",
      });
      setFetchedData(null);
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Case",
        description: error.message || "Could not add case to database. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddCase = () => {
    if (fetchedData) {
      addCaseMutation.mutate(fetchedData);
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
            {/* Supreme Court Specific Display */}
            {fetchedData.is_supreme_court ? (
              <div className="bg-[#E0E7FF] rounded-lg p-4 space-y-4 border-2 border-[#1E3A8A]">
                <h3 className="text-lg font-bold text-[#1E3A8A]">Supreme Court Case Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {fetchedData.diary_number && (
                    <div className="space-y-1 col-span-1 md:col-span-2 bg-white rounded p-3">
                      <p className="text-[#6B7280] font-semibold">Diary Number</p>
                      <p className="font-bold text-[#1E3A8A] text-lg">{fetchedData.diary_number}</p>
                    </div>
                  )}
                  {fetchedData.case_title && (
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <p className="text-[#6B7280]">Case Title</p>
                      <p className="font-medium text-[#111827]">{fetchedData.case_title}</p>
                    </div>
                  )}
                  {fetchedData.cnr_number && (
                    <div className="space-y-1">
                      <p className="text-[#6B7280]">CNR Number</p>
                      <p className="font-medium text-[#111827]">{fetchedData.cnr_number}</p>
                    </div>
                  )}
                  {fetchedData.category && (
                    <div className="space-y-1">
                      <p className="text-[#6B7280]">Category</p>
                      <p className="font-medium text-[#111827]">{fetchedData.category}</p>
                    </div>
                  )}
                  {fetchedData.bench_composition && (
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <p className="text-[#6B7280]">Bench Composition</p>
                      <p className="font-medium text-[#111827]">{fetchedData.bench_composition}</p>
                    </div>
                  )}
                  {fetchedData.case_numbers && fetchedData.case_numbers.length > 0 && (
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <p className="text-[#6B7280]">Case Numbers</p>
                      <p className="font-medium text-[#111827]">{fetchedData.case_numbers.join(', ')}</p>
                    </div>
                  )}
                  {fetchedData.status && (
                    <div className="space-y-1">
                      <p className="text-[#6B7280]">Status</p>
                      <p className="font-medium text-[#111827]">{fetchedData.status}</p>
                    </div>
                  )}
                  {fetchedData.petitioner && (
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <p className="text-[#6B7280]">Petitioner(s)</p>
                      <p className="font-medium text-[#111827]">{fetchedData.petitioner}</p>
                    </div>
                  )}
                  {fetchedData.petitioner_advocate && (
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <p className="text-[#6B7280]">Petitioner Advocate(s)</p>
                      <p className="font-medium text-[#111827]">{fetchedData.petitioner_advocate}</p>
                    </div>
                  )}
                  {fetchedData.respondent && (
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <p className="text-[#6B7280]">Respondent(s)</p>
                      <p className="font-medium text-[#111827]">{fetchedData.respondent}</p>
                    </div>
                  )}
                  {fetchedData.respondent_advocate && (
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <p className="text-[#6B7280]">Respondent Advocate(s)</p>
                      <p className="font-medium text-[#111827]">{fetchedData.respondent_advocate}</p>
                    </div>
                  )}
                </div>

                {/* SC-specific nested data counts */}
                <div className="bg-white rounded p-3 space-y-2">
                  <p className="text-[#6B7280] font-semibold">Additional Data Available:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {fetchedData.earlier_courts_count > 0 && (
                      <div className="bg-[#F9FAFB] rounded p-2">
                        <span className="font-bold text-[#1E3A8A]">{fetchedData.earlier_courts_count}</span>
                        <span className="text-[#6B7280]"> Earlier Courts</span>
                      </div>
                    )}
                    {fetchedData.tagged_matters_count > 0 && (
                      <div className="bg-[#F9FAFB] rounded p-2">
                        <span className="font-bold text-[#1E3A8A]">{fetchedData.tagged_matters_count}</span>
                        <span className="text-[#6B7280]"> Tagged Matters</span>
                      </div>
                    )}
                    {fetchedData.listing_dates_count > 0 && (
                      <div className="bg-[#F9FAFB] rounded p-2">
                        <span className="font-bold text-[#1E3A8A]">{fetchedData.listing_dates_count}</span>
                        <span className="text-[#6B7280]"> Listing Dates</span>
                      </div>
                    )}
                    {fetchedData.notices_count > 0 && (
                      <div className="bg-[#F9FAFB] rounded p-2">
                        <span className="font-bold text-[#1E3A8A]">{fetchedData.notices_count}</span>
                        <span className="text-[#6B7280]"> Notices</span>
                      </div>
                    )}
                    {fetchedData.defects_count > 0 && (
                      <div className="bg-[#F9FAFB] rounded p-2">
                        <span className="font-bold text-[#1E3A8A]">{fetchedData.defects_count}</span>
                        <span className="text-[#6B7280]"> Defects</span>
                      </div>
                    )}
                    {fetchedData.orders_count > 0 && (
                      <div className="bg-[#F9FAFB] rounded p-2">
                        <span className="font-bold text-[#1E3A8A]">{fetchedData.orders_count}</span>
                        <span className="text-[#6B7280]"> Judgement Orders</span>
                      </div>
                    )}
                    {fetchedData.office_reports_count > 0 && (
                      <div className="bg-[#F9FAFB] rounded p-2">
                        <span className="font-bold text-[#1E3A8A]">{fetchedData.office_reports_count}</span>
                        <span className="text-[#6B7280]"> Office Reports</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* High Court / District Court Display (existing) */
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
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={addCaseMutation.isPending}>
                Cancel
              </Button>
              <Button type="button" onClick={handleAddCase} disabled={addCaseMutation.isPending}>
                {addCaseMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Case...
                  </>
                ) : (
                  'Add Case'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
