import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface LegalkartObjectionsTableProps {
  caseId: string;
}

interface ObjectionData {
  id: string;
  sr_no: string;
  objection: string;
  receipt_date: string;
  scrutiny_date: string;
  objection_compliance_date: string;
}

const fetchObjections = async (caseId: string): Promise<ObjectionData[]> => {
  try {
    const { fetchLegalkartCaseId } = await import('./utils');
    const lkCaseId = await fetchLegalkartCaseId(caseId);
    if (!lkCaseId) return [];

    const { data, error } = await (supabase as any)
      .from('legalkart_case_objections')
      .select('*')
      .eq('legalkart_case_id', lkCaseId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching objections:', error);
    return [];
  }
};

export const LegalkartObjectionsTable: React.FC<LegalkartObjectionsTableProps> = ({ caseId }) => {
  const { data: objections, isLoading } = useQuery<ObjectionData[]>({
    queryKey: ['legalkart-objections', caseId],
    queryFn: () => fetchObjections(caseId),
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

  if (!objections || objections.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No objections found for this case</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="w-4 h-4" />
        <span>{objections.length} objection(s) found</span>
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Sr No</TableHead>
              <TableHead>Objection</TableHead>
              <TableHead>Receipt Date</TableHead>
              <TableHead>Scrutiny Date</TableHead>
              <TableHead>Compliance Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {objections.map((objection) => (
              <TableRow key={objection.id}>
                <TableCell className="font-medium">{objection.sr_no}</TableCell>
                <TableCell className="max-w-md">
                  <div className="text-sm leading-relaxed">
                    {objection.objection || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  {objection.receipt_date 
                    ? new Date(objection.receipt_date).toLocaleDateString()
                    : '-'
                  }
                </TableCell>
                <TableCell>
                  {objection.scrutiny_date 
                    ? new Date(objection.scrutiny_date).toLocaleDateString()
                    : '-'
                  }
                </TableCell>
                <TableCell>
                  {objection.objection_compliance_date 
                    ? new Date(objection.objection_compliance_date).toLocaleDateString()
                    : '-'
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};