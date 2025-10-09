import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';

interface DocumentsTableProps {
  documents: any[];
}

export const DocumentsTable = ({ documents }: DocumentsTableProps) => {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[#6B7280]">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <div className="text-base">No documents found</div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F9FAFB]">
              <TableHead className="font-semibold">Document No</TableHead>
              <TableHead className="font-semibold">Date of Receiving</TableHead>
              <TableHead className="font-semibold">Filed By</TableHead>
              <TableHead className="font-semibold">Advocate</TableHead>
              <TableHead className="font-semibold">Document Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium text-[#111827]">
                  {doc.document_no || doc.sr_no || 'N/A'}
                </TableCell>
                <TableCell className="text-[#111827]">
                  {doc.date_of_receiving 
                    ? format(new Date(doc.date_of_receiving), 'dd/MM/yyyy')
                    : 'N/A'}
                </TableCell>
                <TableCell className="text-[#111827]">
                  {doc.filed_by || 'N/A'}
                </TableCell>
                <TableCell className="text-[#111827]">
                  {doc.advocate || 'N/A'}
                </TableCell>
                <TableCell className="text-[#111827]">
                  {doc.document_filed || 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
