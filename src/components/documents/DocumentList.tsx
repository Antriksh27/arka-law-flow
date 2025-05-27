import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Star, StarOff } from 'lucide-react';
import { format } from 'date-fns';
import { getFileIcon } from '@/lib/fileUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileViewer } from './FileViewer';
interface DocumentListProps {
  documents: any[];
  onRefresh: () => void;
}
export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onRefresh
}) => {
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const {
    toast
  } = useToast();
  const handleViewDocument = (document: any) => {
    setSelectedDocument(document);
    setShowFileViewer(true);
  };
  const handleDownload = async (document: any) => {
    try {
      const {
        data,
        error
      } = await supabase.storage.from('documents').download(document.file_url);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the document",
        variant: "destructive"
      });
    }
  };
  const toggleImportant = async (document: any) => {
    try {
      const {
        error
      } = await supabase.from('documents').update({
        is_evidence: !document.is_evidence
      }).eq('id', document.id);
      if (error) throw error;
      toast({
        title: document.is_evidence ? "Removed from important" : "Marked as important",
        description: `Document ${document.is_evidence ? 'unmarked' : 'marked'} as important`
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Failed to update document",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };
  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };
  return <>
      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-slate-800">Name</TableHead>
              <TableHead className="bg-slate-800">Type</TableHead>
              <TableHead className="bg-slate-800">Case</TableHead>
              <TableHead className="bg-slate-800">Uploaded By</TableHead>
              <TableHead className="bg-slate-800">Date</TableHead>
              <TableHead className="bg-slate-800">Size</TableHead>
              <TableHead className="bg-slate-800">Important</TableHead>
              <TableHead className="bg-slate-800">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map(doc => {
            const FileIcon = getFileIcon(doc.file_type);
            return <TableRow key={doc.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <FileIcon className="w-8 h-8 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.file_name}</p>
                        <p className="text-sm text-gray-500">{doc.folder_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {doc.file_type?.toUpperCase() || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {doc.cases?.title || 'General'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {doc.profiles?.full_name || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {formatFileSize(doc.file_size)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => toggleImportant(doc)} className="p-1">
                      {doc.is_evidence ? <Star className="w-4 h-4 text-yellow-500 fill-current" /> : <StarOff className="w-4 h-4 text-gray-400" />}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="p-1" onClick={() => handleViewDocument(doc)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1" onClick={() => handleDownload(doc)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>;
          })}
          </TableBody>
        </Table>
      </div>

      <FileViewer open={showFileViewer} onClose={() => setShowFileViewer(false)} document={selectedDocument} />
    </>;
};