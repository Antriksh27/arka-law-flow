import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';

interface ObjectionsTableProps {
  objections: any[];
}

export const ObjectionsTable = ({ objections }: ObjectionsTableProps) => {
  if (objections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[#6B7280]">
        <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
        <div className="text-base">No objections found</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F9FAFB]">
            <TableHead className="font-semibold">Scrutiny Date</TableHead>
            <TableHead className="font-semibold">Objection</TableHead>
            <TableHead className="font-semibold">Compliance Date</TableHead>
            <TableHead className="font-semibold">Receipt Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objections.map((objection) => (
            <TableRow key={objection.id}>
              <TableCell className="font-medium text-[#111827]">
                {objection.scrutiny_date 
                  ? format(new Date(objection.scrutiny_date), 'dd-MM-yyyy')
                  : 'N/A'}
              </TableCell>
              <TableCell className="text-[#111827] max-w-md">
                {objection.objection || 'N/A'}
              </TableCell>
              <TableCell className="text-[#111827]">
                {objection.compliance_date 
                  ? format(new Date(objection.compliance_date), 'dd-MM-yyyy')
                  : (objection.objection_compliance_date 
                      ? format(new Date(objection.objection_compliance_date), 'dd-MM-yyyy')
                      : 'N/A')}
              </TableCell>
              <TableCell className="text-[#111827]">
                {objection.receipt_date 
                  ? format(new Date(objection.receipt_date), 'dd-MM-yyyy')
                  : 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
