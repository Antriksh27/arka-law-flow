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
      const { data, error } = await supabase
        .from('legalkart_cases')
        .select('*')
        .eq('case_id', caseId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!caseId
  });

  // Get original case data for CNR number
  const { data: caseData } = useQuery({
    queryKey: ['case-basic', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('cnr_number, case_title')
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

  if (!legalkartCase) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Legalkart Data Available</h3>
        <p className="text-muted mb-4">
          This case doesn't have any Legalkart API data yet.
        </p>
        <p className="text-sm text-muted">
          CNR Number: {caseData?.cnr_number || 'Not set'}
        </p>
      </div>
    );
  }

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
                <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{legalkartCase.cnr_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">Filing Number</p>
                <p className="text-foreground">{legalkartCase.filing_number || 'Not available'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">Registration Number</p>
                <p className="text-foreground">{legalkartCase.registration_number || 'Not available'}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted mb-1">Filing Date</p>
                <p className="text-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  {legalkartCase.filing_date ? new Date(legalkartCase.filing_date).toLocaleDateString() : 'Not available'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">Registration Date</p>
                <p className="text-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  {legalkartCase.registration_date ? new Date(legalkartCase.registration_date).toLocaleDateString() : 'Not available'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">Next Hearing Date</p>
                <p className="text-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  {legalkartCase.next_hearing_date ? new Date(legalkartCase.next_hearing_date).toLocaleDateString() : 'Not scheduled'}
                </p>
              </div>
            </div>

            {/* Court Information */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted mb-1">State</p>
                <p className="text-foreground flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-primary" />
                  {legalkartCase.state || 'Not available'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">District</p>
                <p className="text-foreground">{legalkartCase.district || 'Not available'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">Bench Type</p>
                <p className="text-foreground">{legalkartCase.bench_type || 'Not available'}</p>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted mb-1">Coram</p>
                <p className="text-foreground flex items-center gap-1">
                  <Gavel className="w-4 h-4 text-primary" />
                  {legalkartCase.coram || 'Not available'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">Stage of Case</p>
                <Badge variant="outline">{legalkartCase.stage_of_case || 'Not available'}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">Judicial Branch</p>
                <p className="text-foreground">{legalkartCase.judicial_branch || 'Not available'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted mb-1">Category</p>
                <Badge variant="outline">{legalkartCase.category || 'Not available'}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">Sub Category</p>
                <p className="text-foreground">{legalkartCase.sub_category || 'Not available'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-1">Before Me / Part Heard</p>
                <p className="text-foreground text-sm">{legalkartCase.before_me_part_heard || 'Not available'}</p>
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
                  {legalkartCase.petitioner_and_advocate || 'Not available'}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-2">Respondent & Advocate</p>
                <div className="bg-muted p-3 rounded text-sm">
                  {legalkartCase.respondent_and_advocate || 'Not available'}
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