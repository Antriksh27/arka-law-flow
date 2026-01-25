import { FileText, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TimeUtils from '@/lib/timeUtils';
import { bg, text } from '@/lib/colors';

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
    return <div className="mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg md:text-xl">📁</span>
            <h2 className="text-lg md:text-xl font-semibold">Recent Documents</h2>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className={`h-16 ${bg.muted} rounded-lg animate-pulse`} />)}
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
  return <div className="mb-4 md:mb-6">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          
          <h2 className="text-lg md:text-xl font-semibold truncate">Recent Documents</h2>
        </div>
        <Button size="sm" className="bg-slate-900 hover:bg-slate-800 flex-shrink-0 text-xs md:text-sm">
          + Upload
        </Button>
      </div>

      {documents.length === 0 ? <Card className="p-6 md:p-8 text-center border-dashed">
          <FileText className={`w-12 h-12 ${text.light} mx-auto mb-3`} />
          <p className="text-sm text-muted-foreground">No recent documents</p>
        </Card> : <div className="space-y-3">
          {documents.slice(0, 3).map(doc => <Card key={doc.id} className="p-3 md:p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">{getFileIcon(doc.file_name)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{doc.file_name}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {doc.case_title} • Uploaded {TimeUtils.formatRelative(doc.uploaded_at)}
                  </p>
                </div>
                <button className="text-muted-foreground hover:text-foreground flex-shrink-0">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </Card>)}
        </div>}
    </div>;
};