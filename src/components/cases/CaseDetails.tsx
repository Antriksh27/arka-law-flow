import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, MapPin, Scale, FileText, Users, Gavel, Building, 
  RefreshCw, Hash, Clock, Briefcase, User, BookOpen, Flag,
  CheckCircle, AlertCircle, Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LegalkartDocumentsTable } from './legalkart/LegalkartDocumentsTable';
import { LegalkartObjectionsTable } from './legalkart/LegalkartObjectionsTable';
import { LegalkartOrdersTable } from './legalkart/LegalkartOrdersTable';
import { LegalkartHistoryTable } from './legalkart/LegalkartHistoryTable';

interface CaseDetailsProps {
  caseId: string;
}

export const CaseDetails: React.FC<CaseDetailsProps> = ({ caseId }) => {
  const [refreshing, setRefreshing] = useState(false);

  // Query for Legalkart case data
  const { data: legalkartCase, isLoading, refetch } = useQuery({
    queryKey: ['legalkart-case', caseId],
    queryFn: async () => {
      // Try by direct case link first
      const { data: byCase } = await supabase
        .from('legalkart_cases')
        .select('*')
        .eq('case_id', caseId)
        .maybeSingle();
      if (byCase) return byCase;

      // Fallback by CNR number if present on the case
      const { data: cnrRow } = await supabase
        .from('cases')
        .select('cnr_number')
        .eq('id', caseId)
        .maybeSingle();

      const cnr = (cnrRow as any)?.cnr_number;
      if (!cnr) return null;

      const { data: byCnr } = await supabase
        .from('legalkart_cases')
        .select('*')
        .eq('cnr_number', cnr)
        .maybeSingle();

      return byCnr ?? null;
    },
    enabled: !!caseId
  });

  // Get original case data for CNR number
  const { data: caseData } = useQuery({
    queryKey: ['case-basic', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          cnr_number,
          case_title,
          filing_number,
          registration_number,
          filing_date,
          registration_date,
          next_hearing_date,
          state,
          district,
          bench_type,
          judicial_branch,
          coram,
          stage,
          category,
          sub_category,
          fetched_data,
          petitioner,
          petitioner_advocate,
          respondent,
          respondent_advocate
        `)
        .eq('id', caseId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!caseId
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      toast.success('Case details refreshed');
    } catch (error) {
      toast.error('Failed to refresh case details');
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Build a safe view model from legalkart_cases or fallback to raw fetched_data on cases
  const fd: any = (caseData as any)?.fetched_data || null;
  const formatDate = (val: any): string => {
    if (!val) return 'Not available';
    if (typeof val === 'string') {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return String(val);
  };
  
  // Extract data from various sources
  const apiData = fd?.data || fd || {};
  
  const cnrNumber = legalkartCase?.cnr_number || caseData?.cnr_number || apiData?.cnr_number || fd?.case_info?.cnr_number || 'Not available';
  const filingNumber = legalkartCase?.filing_number || (caseData as any)?.filing_number || apiData?.filing_number || fd?.case_info?.filing_number || '';
  const registrationNumber = legalkartCase?.registration_number || (caseData as any)?.registration_number || apiData?.registration_number || fd?.case_info?.registration_number || '';
  const filingDate = legalkartCase?.filing_date || (caseData as any)?.filing_date || apiData?.filing_date || fd?.case_info?.filing_date || '';
  const registrationDate = legalkartCase?.registration_date || (caseData as any)?.registration_date || apiData?.registration_date || fd?.case_info?.registration_date || '';
  const nextHearingDate = legalkartCase?.next_hearing_date || (caseData as any)?.next_hearing_date || apiData?.next_hearing_date || fd?.case_status?.next_hearing_date || '';
  const state = legalkartCase?.state || (caseData as any)?.state || apiData?.state || fd?.case_status?.state || '';
  const district = legalkartCase?.district || (caseData as any)?.district || apiData?.district || fd?.case_status?.district || '';
  const benchType = legalkartCase?.bench_type || (caseData as any)?.bench_type || apiData?.bench_type || apiData?.bench_category || fd?.case_status?.bench_type || '';
  const judicialBranch = legalkartCase?.judicial_branch || (caseData as any)?.judicial_branch || apiData?.judicial_branch || fd?.case_status?.judicial_branch || '';
  const coram = legalkartCase?.coram || (caseData as any)?.coram || apiData?.coram || apiData?.judges || fd?.case_status?.coram || '';
  const stageOfCase = (legalkartCase as any)?.stage_of_case || (legalkartCase as any)?.stage || (caseData as any)?.stage || apiData?.stage || fd?.case_status?.stage_of_case || '';
  const category = (legalkartCase as any)?.category || (caseData as any)?.category || apiData?.category || fd?.category_info?.category || '';
  const subCategory = (legalkartCase as any)?.sub_category || (caseData as any)?.sub_category || apiData?.sub_category || fd?.category_info?.sub_category || '';
  const beforeMe = (legalkartCase as any)?.before_me_part_heard || apiData?.before_me || fd?.case_status?.not_before_me || '';
  
  // Additional fields from Legalkart
  const purposeOfListing = apiData?.purpose_of_listing || apiData?.purpose_of_hearing || apiData?.listing_reason || '';
  const caseDescription = apiData?.case_desc || apiData?.case_description || apiData?.matter_type || '';
  const stampNumber = apiData?.stamp_number || apiData?.ia_number || '';
  const listingDate = apiData?.listing_date || apiData?.listed_date || '';
  const presentedOn = apiData?.presented_on || apiData?.presentation_date || '';
  const caseStatus = apiData?.case_status || apiData?.status || '';
  const caseType = apiData?.case_type || (caseData as any)?.case_type || '';
  const classificationDesc = apiData?.classification_description || apiData?.classification || '';
  const actDescription = apiData?.act_description || apiData?.acts || (apiData?.acts && Array.isArray(apiData.acts) ? apiData.acts.join(', ') : '');
  
  const petitionerAdv = (legalkartCase as any)?.petitioner_and_advocate 
    || apiData?.petitioner_and_advocate
    || fd?.petitioner_and_advocate 
    || [ (caseData as any)?.petitioner, (caseData as any)?.petitioner_advocate ? `Advocate- ${(caseData as any)?.petitioner_advocate}` : '' ]
        .filter(Boolean)
        .join(' ').trim();
  const respondentAdv = (legalkartCase as any)?.respondent_and_advocate 
    || apiData?.respondent_and_advocate
    || fd?.respondent_and_advocate 
    || [ (caseData as any)?.respondent, (caseData as any)?.respondent_advocate ? `Advocate- ${(caseData as any)?.respondent_advocate}` : '' ]
        .filter(Boolean)
        .join(' ').trim();

  // Info card component for consistent styling
  const InfoCard = ({ icon: Icon, label, value, variant = 'default' }: any) => (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        variant === 'primary' ? 'bg-primary/10 text-primary' :
        variant === 'success' ? 'bg-green-100 text-green-700' :
        variant === 'warning' ? 'bg-yellow-100 text-yellow-700' :
        'bg-gray-100 text-gray-700'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">{label}</p>
        <p className="text-sm font-semibold text-foreground break-words">{value || 'Not available'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Scale className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Legalkart Case Details</h2>
            <p className="text-sm text-muted">Comprehensive case information from court records</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-gray-300"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Case Numbers & Identification */}
      <Card className="rounded-2xl shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Hash className="w-5 h-5 text-primary" />
              Case Identification
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary">
              Official Record
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoCard 
              icon={Hash} 
              label="CNR Number" 
              value={cnrNumber}
              variant="primary"
            />
            <InfoCard 
              icon={FileText} 
              label="Filing Number" 
              value={filingNumber}
            />
            <InfoCard 
              icon={Archive} 
              label="Registration Number" 
              value={registrationNumber}
            />
            {stampNumber && (
              <InfoCard 
                icon={Hash} 
                label="Stamp Number" 
                value={stampNumber}
              />
            )}
            {caseType && (
              <InfoCard 
                icon={FileText} 
                label="Case Type" 
                value={caseType}
              />
            )}
            {caseDescription && (
              <InfoCard 
                icon={FileText} 
                label="Case Description" 
                value={caseDescription}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Court & Location Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-sm border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              Court Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoCard 
              icon={MapPin} 
              label="State" 
              value={state}
              variant="success"
            />
            <InfoCard 
              icon={MapPin} 
              label="District" 
              value={district}
            />
            <InfoCard 
              icon={Building} 
              label="Bench Type" 
              value={benchType}
            />
            <InfoCard 
              icon={Briefcase} 
              label="Judicial Branch" 
              value={judicialBranch}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Important Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoCard 
              icon={Calendar} 
              label="Filing Date" 
              value={formatDate(filingDate)}
              variant="primary"
            />
            <InfoCard 
              icon={Calendar} 
              label="Registration Date" 
              value={formatDate(registrationDate)}
            />
            {presentedOn && (
              <InfoCard 
                icon={Calendar} 
                label="Presented On" 
                value={formatDate(presentedOn)}
              />
            )}
            {listingDate && (
              <InfoCard 
                icon={Calendar} 
                label="Listing Date" 
                value={formatDate(listingDate)}
              />
            )}
            <InfoCard 
              icon={Clock} 
              label="Next Hearing Date" 
              value={nextHearingDate ? formatDate(nextHearingDate) : 'Not scheduled'}
              variant={nextHearingDate ? 'warning' : 'default'}
            />
          </CardContent>
        </Card>
      </div>

      {/* Case Status & Classification */}
      <Card className="rounded-2xl shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Flag className="w-5 h-5 text-primary" />
            Case Status & Classification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {caseStatus && (
              <InfoCard 
                icon={CheckCircle} 
                label="Case Status" 
                value={caseStatus}
                variant="success"
              />
            )}
            <InfoCard 
              icon={Gavel} 
              label="Coram / Judges" 
              value={coram}
            />
            <InfoCard 
              icon={CheckCircle} 
              label="Stage of Case" 
              value={stageOfCase}
              variant="success"
            />
            <InfoCard 
              icon={BookOpen} 
              label="Category" 
              value={category}
            />
            <InfoCard 
              icon={FileText} 
              label="Sub Category" 
              value={subCategory}
            />
            {purposeOfListing && (
              <InfoCard 
                icon={FileText} 
                label="Purpose of Listing" 
                value={purposeOfListing}
              />
            )}
          </div>
          
          {/* Classification & Act Details */}
          {(classificationDesc || actDescription) && (
            <div className="mt-6 space-y-3">
              {classificationDesc && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">Classification</p>
                      <p className="text-sm text-blue-800 mt-1">{classificationDesc}</p>
                    </div>
                  </div>
                </div>
              )}
              {actDescription && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <Scale className="w-5 h-5 text-purple-700 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-900">Act(s)</p>
                      <p className="text-sm text-purple-800 mt-1">{actDescription}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {beforeMe && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Before Me / Part Heard</p>
                  <p className="text-sm text-yellow-800 mt-1">{beforeMe}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parties Involved */}
      <Card className="rounded-2xl shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Parties Involved
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-700" />
                </div>
                <h4 className="font-semibold text-foreground">Petitioner</h4>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {petitionerAdv || 'Not available'}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-red-700" />
                </div>
                <h4 className="font-semibold text-foreground">Respondent</h4>
              </div>
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {respondentAdv || 'Not available'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Information Tabs */}
      <Card className="rounded-2xl shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Case Documents & Records
          </CardTitle>
          <p className="text-sm text-muted mt-1">
            View documents, objections, orders, and case history
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-gray-100">
              <TabsTrigger 
                value="documents" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5"
              >
                <FileText className="w-4 h-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger 
                value="objections"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Objections
              </TabsTrigger>
              <TabsTrigger 
                value="orders"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5"
              >
                <Gavel className="w-4 h-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5"
              >
                <Clock className="w-4 h-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="documents" className="mt-0">
                <LegalkartDocumentsTable caseId={caseId} />
              </TabsContent>

              <TabsContent value="objections" className="mt-0">
                <LegalkartObjectionsTable caseId={caseId} />
              </TabsContent>

              <TabsContent value="orders" className="mt-0">
                <LegalkartOrdersTable caseId={caseId} />
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <LegalkartHistoryTable caseId={caseId} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};