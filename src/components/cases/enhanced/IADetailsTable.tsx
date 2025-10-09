import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';

interface IADetailsTableProps {
  iaDetails: any[];
}

export const IADetailsTable = ({ iaDetails }: IADetailsTableProps) => {
  if (iaDetails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[#6B7280]">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <div className="text-base">No IA details found</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F9FAFB]">
            <TableHead className="font-semibold">IA Number</TableHead>
            <TableHead className="font-semibold">Party</TableHead>
            <TableHead className="font-semibold">Date of Filing</TableHead>
            <TableHead className="font-semibold">Next Date</TableHead>
            <TableHead className="font-semibold">IA Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {iaDetails.map((ia) => (
            <TableRow key={ia.id}>
              <TableCell className="font-medium text-[#111827]">
                {ia.ia_number || 'N/A'}
              </TableCell>
              <TableCell className="text-[#111827]">
                {ia.party || 'N/A'}
              </TableCell>
              <TableCell className="text-[#111827]">
                {ia.date_of_filing 
                  ? format(new Date(ia.date_of_filing), 'dd/MM/yyyy')
                  : 'N/A'}
              </TableCell>
              <TableCell className="text-[#111827]">
                {ia.next_date 
                  ? format(new Date(ia.next_date), 'dd/MM/yyyy')
                  : 'N/A'}
              </TableCell>
              <TableCell className="text-[#111827]">
                {ia.ia_status || 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
