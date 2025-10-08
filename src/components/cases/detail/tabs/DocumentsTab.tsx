import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye } from 'lucide-react';
import { openBase64PdfInNewTab } from '@/lib/partyParser';
import { format } from 'date-fns';

interface DocumentsTabProps {
  caseId: string;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ caseId }) => {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['case-documents', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legalkart_documents' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching documents:', error);
        return [];
      }
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading documents...</p>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No documents found for this case</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Document Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc: any) => (
              <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">{doc.document_name || doc.title || 'Untitled Document'}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{doc.document_type || 'Document'}</td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {doc.document_date ? format(new Date(doc.document_date), 'dd MMM yyyy') : 'N/A'}
                </td>
                <td className="py-3 px-4 text-right">
                  {doc.pdf_base64 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openBase64PdfInNewTab(doc.pdf_base64)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View PDF
                    </Button>
                  ) : doc.document_url ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(doc.document_url, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  ) : (
                    <span className="text-xs text-gray-400">No file</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
