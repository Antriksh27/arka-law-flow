import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ObjectionsTableProps {
  objections: any[];
}

export const ObjectionsTable = ({ objections }: ObjectionsTableProps) => {
  const isMobile = useIsMobile();

  if (objections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <AlertTriangle className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-900">No objections found</p>
        <p className="text-xs text-slate-500 mt-1">Objections will appear here when raised</p>
      </div>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-3">
        {objections.map((objection, index) => (
          <div key={objection.id || index} className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  {objection.scrutiny_date 
                    ? format(new Date(objection.scrutiny_date), 'dd MMM yyyy')
                    : 'No Date'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Scrutiny Date</p>
              </div>
            </div>
            
            {objection.objection && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Objection</p>
                <p className="text-xs text-slate-700 bg-white rounded-lg p-2">
                  {objection.objection}
                </p>
              </div>
            )}
            
            <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Compliance Date</p>
                <p className="text-xs font-medium text-slate-700 mt-0.5">
                  {objection.compliance_date 
                    ? format(new Date(objection.compliance_date), 'dd MMM yyyy')
                    : (objection.objection_compliance_date 
                        ? format(new Date(objection.objection_compliance_date), 'dd MMM yyyy')
                        : 'N/A')}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Receipt Date</p>
                <p className="text-xs font-medium text-slate-700 mt-0.5">
                  {objection.receipt_date 
                    ? format(new Date(objection.receipt_date), 'dd MMM yyyy')
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
            <TableHead className="font-semibold text-slate-700">Scrutiny Date</TableHead>
            <TableHead className="font-semibold text-slate-700">Objection</TableHead>
            <TableHead className="font-semibold text-slate-700">Compliance Date</TableHead>
            <TableHead className="font-semibold text-slate-700">Receipt Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objections.map((objection) => (
            <TableRow key={objection.id}>
              <TableCell className="font-medium text-slate-900">
                {objection.scrutiny_date 
                  ? format(new Date(objection.scrutiny_date), 'dd/MM/yyyy')
                  : 'N/A'}
              </TableCell>
              <TableCell className="text-slate-700 max-w-md">
                {objection.objection || 'N/A'}
              </TableCell>
              <TableCell className="text-slate-700">
                {objection.compliance_date 
                  ? format(new Date(objection.compliance_date), 'dd/MM/yyyy')
                  : (objection.objection_compliance_date 
                      ? format(new Date(objection.objection_compliance_date), 'dd/MM/yyyy')
                      : 'N/A')}
              </TableCell>
              <TableCell className="text-slate-700">
                {objection.receipt_date 
                  ? format(new Date(objection.receipt_date), 'dd/MM/yyyy')
                  : 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
