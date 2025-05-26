import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
interface CaseDocumentsProps {
  caseId: string;
}
export const CaseDocuments: React.FC<CaseDocumentsProps> = ({
  caseId
}) => {
  const {
    data: documents,
    isLoading
  } = useQuery({
    queryKey: ['case-documents', caseId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('documents').select(`
          *,
          profiles!documents_uploaded_by_fkey(full_name)
        `).eq('case_id', caseId).order('uploaded_at', {
        ascending: false
      });
      if (error) throw error;
      return data || [];
    }
  });
  if (isLoading) {
    return <div className="text-center py-8">Loading documents...</div>;
  }
  return <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Documents</h3>
        
      </div>

      {documents && documents.length > 0 ? <div className="border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map(doc => <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{doc.file_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {doc.file_type?.toUpperCase() || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>{doc.profiles?.full_name || 'Unknown'}</TableCell>
                  <TableCell>{format(new Date(doc.uploaded_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </div> : <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No documents uploaded yet</p>
          <Button className="mt-4 bg-slate-800 hover:bg-slate-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload First Document
          </Button>
        </div>}
    </div>;
};