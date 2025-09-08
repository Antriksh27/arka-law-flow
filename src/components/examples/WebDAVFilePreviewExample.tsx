import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePreview } from '@/components/documents/FilePreview';
import { FilePreviewModal } from '@/components/documents/FilePreviewModal';
import { getFileUrl } from '@/lib/pydioIntegration';

/**
 * Example component demonstrating how to use WebDAV file preview functionality
 */
export const WebDAVFilePreviewExample: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  // Example document data (this would normally come from your database)
  const exampleWebDAVDocument = {
    id: 'example-1',
    file_name: 'sample-document.pdf',
    file_type: 'pdf',
    file_size: 1024000, // 1MB
    webdav_synced: true,
    webdav_path: '/crmdata/Test Client/Test Case/Court Filings/Orders/sample-document.pdf',
    uploaded_at: new Date().toISOString(),
    folder_name: 'Test Case'
  };

  // Example: Generate direct URL for WebDAV file
  const directUrl = getFileUrl('Test Client', 'Test Case', 'Court Filings/Orders', 'sample-document.pdf');

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>WebDAV File Preview Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Example 1: Direct URL generation */}
          <div>
            <h3 className="text-sm font-medium mb-2">Direct URL Generation</h3>
            <p className="text-xs text-gray-600 mb-2">
              Generate direct URLs for WebDAV files:
            </p>
            <code className="text-xs bg-gray-100 p-2 rounded block break-all">
              {directUrl}
            </code>
          </div>

          {/* Example 2: Inline file preview */}
          <div>
            <h3 className="text-sm font-medium mb-2">Inline File Preview</h3>
            <p className="text-xs text-gray-600 mb-2">
              Preview files directly in your component:
            </p>
            <div className="border rounded-lg">
              <FilePreview 
                document={exampleWebDAVDocument}
                className="w-full h-64"
              />
            </div>
          </div>

          {/* Example 3: Modal file preview */}
          <div>
            <h3 className="text-sm font-medium mb-2">Modal File Preview</h3>
            <p className="text-xs text-gray-600 mb-2">
              Open files in a full-screen modal for better viewing:
            </p>
            <Button onClick={() => setShowModal(true)}>
              Open File in Modal
            </Button>
          </div>

          {/* Code examples */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Usage Examples</h3>
            <div className="space-y-3">
              
              <div>
                <h4 className="text-xs font-medium text-gray-700">1. Generate file URL:</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
{`import { getFileUrl } from '@/lib/pydioIntegration';

const url = getFileUrl('Test Client', 'Test Case', 'Documents', 'file.pdf');`}
                </pre>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-700">2. Inline preview:</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
{`<FilePreview 
  document={document}
  className="w-full h-96"
  showControls={true}
/>`}
                </pre>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-700">3. Modal preview:</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
{`<FilePreviewModal
  open={showModal}
  onClose={() => setShowModal(false)}
  document={document}
/>`}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <FilePreviewModal
        open={showModal}
        onClose={() => setShowModal(false)}
        document={exampleWebDAVDocument}
      />
    </div>
  );
};

export default WebDAVFilePreviewExample;