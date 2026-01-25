import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface DocumentsTableProps {
  documents: any[];
}

export const DocumentsTable = ({ documents }: DocumentsTableProps) => {
  const isMobile = useIsMobile();

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <FileText className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-900">No documents found</p>
        <p className="text-xs text-slate-500 mt-1">Documents will appear here when added</p>
      </div>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-3">
        {documents.map((doc, index) => (
          <div key={doc.id || index} className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {doc.document_filed || 'Document'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Doc #{doc.document_no || doc.sr_no || index + 1}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Date Received</p>
                <p className="text-xs font-medium text-slate-700 mt-0.5">
                  {doc.date_of_receiving 
                    ? format(new Date(doc.date_of_receiving), 'dd MMM yyyy')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Filed By</p>
                <p className="text-xs font-medium text-slate-700 mt-0.5 truncate">
                  {doc.filed_by || 'N/A'}
                </p>
              </div>
              {doc.advocate && (
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Advocate</p>
                  <p className="text-xs font-medium text-slate-700 mt-0.5 truncate">
                    {doc.advocate}
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
            <TableHead className="font-semibold text-slate-700">Document No</TableHead>
            <TableHead className="font-semibold text-slate-700">Date of Receiving</TableHead>
            <TableHead className="font-semibold text-slate-700">Filed By</TableHead>
            <TableHead className="font-semibold text-slate-700">Advocate</TableHead>
            <TableHead className="font-semibold text-slate-700">Document Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium text-slate-900">
                {doc.document_no || doc.sr_no || 'N/A'}
              </TableCell>
              <TableCell className="text-slate-700">
                {doc.date_of_receiving 
                  ? format(new Date(doc.date_of_receiving), 'dd/MM/yyyy')
                  : 'N/A'}
              </TableCell>
              <TableCell className="text-slate-700">
                {doc.filed_by || 'N/A'}
              </TableCell>
              <TableCell className="text-slate-700">
                {doc.advocate || 'N/A'}
              </TableCell>
              <TableCell className="text-slate-700">
                {doc.document_filed || 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
