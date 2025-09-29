import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Scale, FileText, Users, Gavel, Building, AlertTriangle, RefreshCw } from 'lucide-react';
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
      return isNaN(d.getTime()) ? val : d.toLocaleDateString();
    }
    return String(val);
  };
  const cnrNumber = legalkartCase?.cnr_number || caseData?.cnr_number || fd?.case_info?.cnr_number || 'Not available';
  const filingNumber = legalkartCase?.filing_number || (caseData as any)?.filing_number || fd?.case_info?.filing_number || '';
  const registrationNumber = legalkartCase?.registration_number || (caseData as any)?.registration_number || fd?.case_info?.registration_number || '';
  const filingDate = legalkartCase?.filing_date || (caseData as any)?.filing_date || fd?.case_info?.filing_date || '';
  const registrationDate = legalkartCase?.registration_date || (caseData as any)?.registration_date || fd?.case_info?.registration_date || '';
  const nextHearingDate = legalkartCase?.next_hearing_date || (caseData as any)?.next_hearing_date || fd?.case_status?.next_hearing_date || '';
  const state = legalkartCase?.state || (caseData as any)?.state || fd?.case_status?.state || '';
  const district = legalkartCase?.district || (caseData as any)?.district || fd?.case_status?.district || '';
  const benchType = legalkartCase?.bench_type || (caseData as any)?.bench_type || fd?.case_status?.bench_type || '';
  const judicialBranch = legalkartCase?.judicial_branch || (caseData as any)?.judicial_branch || fd?.case_status?.judicial_branch || '';
  const coram = legalkartCase?.coram || (caseData as any)?.coram || fd?.case_status?.coram || '';
  const stageOfCase = (legalkartCase as any)?.stage_of_case || (legalkartCase as any)?.stage || (caseData as any)?.stage || fd?.case_status?.stage_of_case || '';
  const category = (legalkartCase as any)?.category || (caseData as any)?.category || fd?.category_info?.category || '';
  const subCategory = (legalkartCase as any)?.sub_category || (caseData as any)?.sub_category || fd?.category_info?.sub_category || '';
  const beforeMe = (legalkartCase as any)?.before_me_part_heard || fd?.case_status?.not_before_me || '';
  const petitionerAdv = (legalkartCase as any)?.petitioner_and_advocate 
    || fd?.petitioner_and_advocate 
    || [ (caseData as any)?.petitioner, (caseData as any)?.petitioner_advocate ? `Advocate- ${(caseData as any)?.petitioner_advocate}` : '' ]
        .filter(Boolean)
        .join(' ').trim();
  const respondentAdv = (legalkartCase as any)?.respondent_and_advocate 
    || fd?.respondent_and_advocate 
    || [ (caseData as any)?.respondent, (caseData as any)?.respondent_advocate ? `Advocate- ${(caseData as any)?.respondent_advocate}` : '' ]
        .filter(Boolean)
        .join(' ').trim();

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Case Details from Legalkart</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Case Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Case Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted mb-1">CNR Number</p>
                <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{cnrNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">Filing Number</p>
                <p className="text-foreground">{filingNumber || 'Not available'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">Registration Number</p>
                <p className="text-foreground">{registrationNumber || 'Not available'}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted mb-1">Filing Date</p>
                <p className="text-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  {formatDate(filingDate)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">Registration Date</p>
                <p className="text-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  {formatDate(registrationDate)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">Next Hearing Date</p>
                <p className="text-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  {nextHearingDate ? formatDate(nextHearingDate) : 'Not scheduled'}
                </p>
              </div>
            </div>

            {/* Court Information */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted mb-1">State</p>
                <p className="text-foreground flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-primary" />
                  {state || 'Not available'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">District</p>
                <p className="text-foreground">{district || 'Not available'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">Bench Type</p>
                <p className="text-foreground">{benchType || 'Not available'}</p>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted mb-1">Coram</p>
                <p className="text-foreground flex items-center gap-1">
                  <Gavel className="w-4 h-4 text-primary" />
                  {coram || 'Not available'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">Stage of Case</p>
                <Badge variant="outline">{stageOfCase || 'Not available'}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">Judicial Branch</p>
                <p className="text-foreground">{judicialBranch || 'Not available'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted mb-1">Category</p>
                <Badge variant="outline">{category || 'Not available'}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">Sub Category</p>
                <p className="text-foreground">{subCategory || 'Not available'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">Before Me / Part Heard</p>
                <p className="text-foreground text-sm">{beforeMe || 'Not available'}</p>
              </div>
            </div>
          </div>

          {/* Parties Section */}
          <div className="mt-8 pt-6 border-t">
            <h4 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Parties Involved
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted mb-2">Petitioner & Advocate</p>
                <div className="bg-muted p-3 rounded text-sm">
                  {petitionerAdv || 'Not available'}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-2">Respondent & Advocate</p>
                <div className="bg-muted p-3 rounded text-sm">
                  {respondentAdv || 'Not available'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Data Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Related Case Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="objections">Objections</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="mt-6">
              <LegalkartDocumentsTable caseId={caseId} />
            </TabsContent>

            <TabsContent value="objections" className="mt-6">
              <LegalkartObjectionsTable caseId={caseId} />
            </TabsContent>

            <TabsContent value="orders" className="mt-6">
              <LegalkartOrdersTable caseId={caseId} />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <LegalkartHistoryTable caseId={caseId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};