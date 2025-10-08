import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Eye, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { openBase64PdfInNewTab } from '@/lib/partyParser';
import { toast } from 'sonner';
import { fetchLegalkartCaseId } from '../../legalkart/utils';

interface DocumentsTabProps {
  caseId: string;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ caseId }) => {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['case-documents-api', caseId],
    queryFn: async () => {
      const lkCaseId = await fetchLegalkartCaseId(caseId);
      if (!lkCaseId) return [];

      const { data, error } = await supabase
        .from('legalkart_documents' as any)
        .select('*')
        .eq('legalkart_case_id', lkCaseId)
        .order('date_of_filing', { ascending: false });

      if (error) throw error;
      return (data || []) as any[];
    }
  });

  const handleViewPdf = (pdfBase64: string, filename: string) => {
    try {
      openBase64PdfInNewTab(pdfBase64, filename);
    } catch (error) {
      toast.error('Failed to open PDF document');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-[#6B7280]">Loading documents...</div>;
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
        <p className="text-[#6B7280]">No documents available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Document Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Filed By
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Filing Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-[#F9FAFB]">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-[#1E3A8A] mr-3" />
                    <span className="text-sm font-medium text-[#111827]">
                      {doc.document_name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#6B7280]">
                  {doc.filed_by || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-[#6B7280]">
                  {doc.date_of_filing ? (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(new Date(doc.date_of_filing), 'MMM dd, yyyy')}
                    </div>
                  ) : '-'}
                </td>
                <td className="px-6 py-4">
                  {doc.pdf_base64 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewPdf(doc.pdf_base64, doc.document_name)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View PDF
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
