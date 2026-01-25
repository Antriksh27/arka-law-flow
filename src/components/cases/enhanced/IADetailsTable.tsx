import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';

interface IADetailsTableProps {
  iaDetails: any[];
}

export const IADetailsTable = ({ iaDetails }: IADetailsTableProps) => {
  const isMobile = useIsMobile();

  if (iaDetails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <FileText className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-900">No IA details found</p>
        <p className="text-xs text-slate-500 mt-1">Interlocutory Applications will appear here</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-slate-100 text-slate-600';
    const lower = status.toLowerCase();
    if (lower.includes('pending')) return 'bg-amber-100 text-amber-700';
    if (lower.includes('disposed') || lower.includes('allowed')) return 'bg-emerald-100 text-emerald-700';
    if (lower.includes('rejected') || lower.includes('dismissed')) return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-600';
  };

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-3">
        {iaDetails.map((ia, index) => (
          <div key={ia.id || index} className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {ia.ia_number || 'IA'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {ia.party || 'Unknown Party'}
                  </p>
                </div>
              </div>
              {ia.ia_status && (
                <Badge className={`${getStatusColor(ia.ia_status)} text-[10px] font-medium border-0`}>
                  {ia.ia_status}
                </Badge>
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Date of Filing</p>
                <p className="text-xs font-medium text-slate-700 mt-0.5">
                  {ia.date_of_filing 
                    ? format(new Date(ia.date_of_filing), 'dd MMM yyyy')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Next Date</p>
                <p className="text-xs font-medium text-slate-700 mt-0.5">
                  {ia.next_date 
                    ? format(new Date(ia.next_date), 'dd MMM yyyy')
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="font-semibold text-slate-700">IA Number</TableHead>
            <TableHead className="font-semibold text-slate-700">Party</TableHead>
            <TableHead className="font-semibold text-slate-700">Date of Filing</TableHead>
            <TableHead className="font-semibold text-slate-700">Next Date</TableHead>
            <TableHead className="font-semibold text-slate-700">IA Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {iaDetails.map((ia) => (
            <TableRow key={ia.id}>
              <TableCell className="font-medium text-slate-900">
                {ia.ia_number || 'N/A'}
              </TableCell>
              <TableCell className="text-slate-700">
                {ia.party || 'N/A'}
              </TableCell>
              <TableCell className="text-slate-700">
                {ia.date_of_filing 
                  ? format(new Date(ia.date_of_filing), 'dd/MM/yyyy')
                  : 'N/A'}
              </TableCell>
              <TableCell className="text-slate-700">
                {ia.next_date 
                  ? format(new Date(ia.next_date), 'dd/MM/yyyy')
                  : 'N/A'}
              </TableCell>
              <TableCell>
                {ia.ia_status ? (
                  <Badge className={`${getStatusColor(ia.ia_status)} border-0`}>
                    {ia.ia_status}
                  </Badge>
                ) : (
                  <span className="text-slate-700">N/A</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
