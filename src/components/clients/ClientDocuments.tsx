
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Download, Plus, File } from 'lucide-react';

interface ClientDocumentsProps {
  clientId: string;
}

export const ClientDocuments: React.FC<ClientDocumentsProps> = ({ clientId }) => {
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          uploaded_by:profiles!documents_uploaded_by_fkey(full_name)
        `)
        .eq('client_id', clientId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading documents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Documents</CardTitle>
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No documents uploaded for this client
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => (
              <div key={document.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <File className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {document.title || document.file_name}
                      </h3>
                      {document.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {document.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Size: {formatFileSize(document.file_size)}</span>
                        <span>Type: {document.file_type || 'Unknown'}</span>
                        {document.uploaded_by && (
                          <span>Uploaded by: {document.uploaded_by.full_name}</span>
                        )}
                        <span>
                          {new Date(document.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
