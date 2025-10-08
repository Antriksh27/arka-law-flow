import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

interface HearingsTableProps {
  hearings: any[];
}

export const HearingsTable = ({ hearings }: HearingsTableProps) => {
  if (hearings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[#6B7280]">
        <Calendar className="h-12 w-12 mb-4 opacity-50" />
        <div className="text-base">No hearings found</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F9FAFB]">
            <TableHead className="font-semibold">Hearing Date</TableHead>
            <TableHead className="font-semibold">Judge</TableHead>
            <TableHead className="font-semibold">Purpose</TableHead>
            <TableHead className="font-semibold">Cause List Type</TableHead>
            <TableHead className="font-semibold">Business On Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hearings.map((hearing) => (
            <TableRow key={hearing.id}>
              <TableCell className="font-medium text-[#111827]">
                {hearing.hearing_date 
                  ? format(new Date(hearing.hearing_date), 'dd-MM-yyyy')
                  : 'N/A'}
              </TableCell>
              <TableCell className="text-[#111827]">
                {hearing.judge || 'N/A'}
              </TableCell>
              <TableCell className="text-[#111827]">
                {hearing.purpose_of_hearing || 'N/A'}
              </TableCell>
              <TableCell className="text-[#111827]">
                {hearing.cause_list_type || 'N/A'}
              </TableCell>
              <TableCell className="text-[#111827]">
                {hearing.business_on_date || 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
