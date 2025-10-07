import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Scale, MapPin } from 'lucide-react';

interface LegalkartCaseInfoProps {
  caseId: string;
}

const fetchCaseInfo = async (caseId: string) => {
  try {
    const { fetchLegalkartCaseId } = await import('./utils');
    const lkCaseId = await fetchLegalkartCaseId(caseId);
    if (!lkCaseId) return null;

    const { data, error } = await supabase
      .from('legalkart_cases')
      .select('*')
      .eq('id', lkCaseId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching case info:', error);
    return null;
  }
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '-';
  }
};

export const LegalkartCaseInfo: React.FC<LegalkartCaseInfoProps> = ({ caseId }) => {
  const { data: caseInfo, isLoading } = useQuery({
    queryKey: ['legalkart-case-info', caseId],
    queryFn: () => fetchCaseInfo(caseId),
    enabled: !!caseId
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-xl"></div>
        <div className="h-32 bg-muted rounded-xl"></div>
      </div>
    );
  }

  if (!caseInfo) {
    return (
      <div className="text-center py-12">
        <Scale className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No case information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Case Details</h3>
              <div className="flex items-center gap-3 flex-wrap">
                {caseInfo.stage_of_case && (
                  <Badge variant="default">
                    {caseInfo.stage_of_case}
                  </Badge>
                )}
                {caseInfo.category && (
                  <Badge variant="outline">{caseInfo.category}</Badge>
                )}
              </div>
            </div>
            {caseInfo.next_hearing_date && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Next Hearing</p>
                <p className="text-lg font-semibold">{formatDate(caseInfo.next_hearing_date)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Case Numbers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Case Numbers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {caseInfo.cnr_number && (
              <div>
                <p className="text-sm text-muted-foreground">CNR Number</p>
                <p className="font-mono font-medium">{caseInfo.cnr_number}</p>
              </div>
            )}
            {caseInfo.filing_number && (
              <div>
                <p className="text-sm text-muted-foreground">Filing Number</p>
                <p className="font-mono font-medium">{caseInfo.filing_number}</p>
              </div>
            )}
            {caseInfo.registration_number && (
              <div>
                <p className="text-sm text-muted-foreground">Registration Number</p>
                <p className="font-mono font-medium">{caseInfo.registration_number}</p>
              </div>
            )}
            {caseInfo.case_id && (
              <div>
                <p className="text-sm text-muted-foreground">Case ID</p>
                <p className="font-mono font-medium">{caseInfo.case_id}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Important Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Important Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {caseInfo.filing_date && (
              <div>
                <p className="text-sm text-muted-foreground">Filing Date</p>
                <p className="font-medium">{formatDate(caseInfo.filing_date)}</p>
              </div>
            )}
            {caseInfo.registration_date && (
              <div>
                <p className="text-sm text-muted-foreground">Registration Date</p>
                <p className="font-medium">{formatDate(caseInfo.registration_date)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Court Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Court Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {caseInfo.bench_type && (
              <div>
                <p className="text-sm text-muted-foreground">Bench Type</p>
                <p className="font-medium">{caseInfo.bench_type}</p>
              </div>
            )}
            {caseInfo.judicial_branch && (
              <div>
                <p className="text-sm text-muted-foreground">Judicial Branch</p>
                <p className="font-medium">{caseInfo.judicial_branch}</p>
              </div>
            )}
            {caseInfo.district && (
              <div>
                <p className="text-sm text-muted-foreground">District</p>
                <p className="font-medium">{caseInfo.district}</p>
              </div>
            )}
            {caseInfo.state && (
              <div>
                <p className="text-sm text-muted-foreground">State</p>
                <p className="font-medium">{caseInfo.state}</p>
              </div>
            )}
            {caseInfo.coram && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Coram (Judge(s))</p>
                <p className="font-medium">{caseInfo.coram}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Details */}
      {(caseInfo.category || caseInfo.sub_category || caseInfo.before_me_part_heard) && (
        <Card>
          <CardHeader>
            <CardTitle>Case Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {caseInfo.category && (
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{caseInfo.category}</p>
              </div>
            )}
            {caseInfo.sub_category && (
              <div>
                <p className="text-sm text-muted-foreground">Sub Category</p>
                <p className="font-medium">{caseInfo.sub_category}</p>
              </div>
            )}
            {caseInfo.before_me_part_heard && (
              <div>
                <p className="text-sm text-muted-foreground">Before Me / Part Heard</p>
                <p className="font-medium">{caseInfo.before_me_part_heard}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
