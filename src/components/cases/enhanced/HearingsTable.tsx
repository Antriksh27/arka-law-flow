import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface HearingsTableProps {
  hearings: any[];
}

export const HearingsTable = ({ hearings }: HearingsTableProps) => {
  const isMobile = useIsMobile();

  if (hearings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Calendar className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-900">No hearings found</p>
        <p className="text-xs text-slate-500 mt-1">Hearing history will appear here</p>
      </div>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-3">
        {hearings.map((hearing, index) => (
          <div key={hearing.id || index} className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  {hearing.hearing_date 
                    ? format(new Date(hearing.hearing_date), 'dd MMM yyyy')
                    : 'No Date'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {hearing.purpose_of_hearing || 'Hearing'}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
              {hearing.judge && (
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">Judge</span>
                  <span className="text-xs font-medium text-slate-700">{hearing.judge}</span>
                </div>
              )}
              {hearing.cause_list_type && (
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">Cause List</span>
                  <span className="text-xs font-medium text-slate-700">{hearing.cause_list_type}</span>
                </div>
              )}
              {hearing.business_on_date && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Business</p>
                  <p className="text-xs text-slate-700 bg-white rounded-lg p-2">
                    {hearing.business_on_date}
                  </p>
                </div>
              )}
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
            <TableHead className="font-semibold text-slate-700">Hearing Date</TableHead>
            <TableHead className="font-semibold text-slate-700">Judge</TableHead>
            <TableHead className="font-semibold text-slate-700">Purpose</TableHead>
            <TableHead className="font-semibold text-slate-700">Cause List Type</TableHead>
            <TableHead className="font-semibold text-slate-700">Business On Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hearings.map((hearing) => (
            <TableRow key={hearing.id}>
              <TableCell className="font-medium text-slate-900">
                {hearing.hearing_date 
                  ? format(new Date(hearing.hearing_date), 'dd/MM/yyyy')
                  : 'N/A'}
              </TableCell>
              <TableCell className="text-slate-700">
                {hearing.judge || 'N/A'}
              </TableCell>
              <TableCell className="text-slate-700">
                {hearing.purpose_of_hearing || 'N/A'}
              </TableCell>
              <TableCell className="text-slate-700">
                {hearing.cause_list_type || 'N/A'}
              </TableCell>
              <TableCell className="text-slate-700">
                {hearing.business_on_date || 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
