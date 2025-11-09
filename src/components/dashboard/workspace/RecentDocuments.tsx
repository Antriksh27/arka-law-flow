import { FileText, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TimeUtils from '@/lib/timeUtils';
interface Document {
  id: string;
  file_name: string;
  case_title?: string;
  uploaded_at: string;
  file_type?: string;
}
interface RecentDocumentsProps {
  documents: Document[];
  isLoading?: boolean;
}
export const RecentDocuments = ({
  documents,
  isLoading
}: RecentDocumentsProps) => {
  if (isLoading) {
    return <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📁</span>
            <h2 className="text-xl font-semibold">Recent Documents</h2>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      </div>;
  }
  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) {
      return <FileText className="w-8 h-8 text-red-500" />;
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      return <FileText className="w-8 h-8 text-blue-500" />;
    } else {
      return <FileText className="w-8 h-8 text-green-500" />;
    }
  };
  return <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          
          <h2 className="text-xl font-semibold">Recent Documents</h2>
        </div>
        <Button size="sm" className="bg-slate-900 hover:bg-slate-800">
          + Upload New
        </Button>
      </div>

      {documents.length === 0 ? <Card className="p-8 text-center border-dashed">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No recent documents</p>
        </Card> : <div className="space-y-3">
          {documents.slice(0, 3).map(doc => <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                {getFileIcon(doc.file_name)}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{doc.file_name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {doc.case_title} • Uploaded {TimeUtils.formatRelative(doc.uploaded_at)}
                  </p>
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </Card>)}
        </div>}
    </div>;
};