import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, AlertCircle } from 'lucide-react';

interface LegalkartHistoryTableProps {
  caseId: string;
}

interface HistoryData {
  id: string;
  judge: string;
  hearing_date: string;
  cause_list_type: string;
  business_on_date: string;
  purpose_of_hearing: string;
}

const fetchHistory = async (caseId: string): Promise<HistoryData[]> => {
  try {
    const { fetchLegalkartCaseId } = await import('./utils');
    const lkCaseId = await fetchLegalkartCaseId(caseId);
    if (!lkCaseId) return [];

    const { data, error } = await (supabase as any)
      .from('legalkart_case_history')
      .select('*')
      .eq('legalkart_case_id', lkCaseId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
};

export const LegalkartHistoryTable: React.FC<LegalkartHistoryTableProps> = ({ caseId }) => {
  const { data: history, isLoading } = useQuery<HistoryData[]>({
    queryKey: ['legalkart-history', caseId],
    queryFn: () => fetchHistory(caseId),
    enabled: !!caseId
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No hearing history found for this case</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="w-4 h-4" />
        <span>{history.length} hearing(s) in history</span>
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judge</TableHead>
              <TableHead>Hearing Date</TableHead>
              <TableHead>Cause List Type</TableHead>
              <TableHead>Business on Date</TableHead>
              <TableHead>Purpose of Hearing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((hearing) => (
              <TableRow key={hearing.id}>
                <TableCell className="font-medium">{hearing.judge || '-'}</TableCell>
                <TableCell>{formatDate(hearing.hearing_date)}</TableCell>
                <TableCell>{hearing.cause_list_type || '-'}</TableCell>
                <TableCell>{formatDate(hearing.business_on_date)}</TableCell>
                <TableCell className="max-w-md">
                  <div className="text-sm leading-relaxed">
                    {hearing.purpose_of_hearing || '-'}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};