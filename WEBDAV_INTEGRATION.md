# WebDAV File Preview Integration

This document explains how to use the WebDAV file preview functionality in the React frontend.

## Overview

The WebDAV integration allows users to preview and download files stored in WebDAV directly in the browser. The system uses a Supabase Edge Function (`pydio-webdav`) to fetch files from WebDAV with proper CORS headers.

## Components

### 1. `getFileUrl(clientName, caseName, docType, fileName)`

Generates a direct URL for WebDAV file access.

```typescript
import { getFileUrl } from '@/lib/pydioIntegration';

const url = getFileUrl('Test Client', 'Test Case', 'Court Filings/Orders', 'document.pdf');
// Returns: https://hpcnipcbymruvsnqrmjx.functions.supabase.co/pydio-webdav?clientName=Test%20Client&caseName=Test%20Case&docType=Court%20Filings%2FOrders&fileName=document.pdf
```

### 2. `<FilePreview>` Component

Renders file previews inline within your components.

```tsx
import { FilePreview } from '@/components/documents/FilePreview';

<FilePreview 
  document={document}
  className="w-full h-96"
  showControls={true} // Optional: show download/external controls
/>
```

**Supported file types:**
- **PDFs**: Displayed in an `<iframe>`
- **Images** (jpg, png, gif, webp): Displayed as `<img>` with zoom controls
- **Text files**: Displayed in an `<iframe>`
- **Videos**: Displayed with `<video>` controls
- **Audio**: Displayed with `<audio>` controls
- **Other files**: Shows download button

### 3. `<FilePreviewModal>` Component

Full-screen modal for file previewing.

```tsx
import { FilePreviewModal } from '@/components/documents/FilePreviewModal';

<FilePreviewModal
  open={showModal}
  onClose={() => setShowModal(false)}
  document={document}
/>
```

## Utility Functions

### WebDAV File Utilities (`@/lib/webdavFileUtils`)

```typescript
import { 
  getWebDAVFileUrl, 
  parseWebDAVPath, 
  isWebDAVDocument,
  getFileTypeFromExtension 
} from '@/lib/webdavFileUtils';

// Check if document is stored in WebDAV
const isWebDAV = isWebDAVDocument(document);

// Parse WebDAV path to extract parameters
const params = parseWebDAVPath('/crmdata/Client/Case/Type/file.pdf');
// Returns: { clientName: 'Client', caseName: 'Case', docType: 'Type', fileName: 'file.pdf' }

// Get file type from extension
const fileType = getFileTypeFromExtension('document.pdf'); // Returns: 'pdf'
```

## Integration Examples

### Document Cards

```tsx
import { FilePreviewModal } from '@/components/documents/FilePreviewModal';
import { isWebDAVDocument, getWebDAVFileUrl, parseWebDAVPath } from '@/lib/webdavFileUtils';

const DocumentCard = ({ document }) => {
  const [showPreview, setShowPreview] = useState(false);

  const handleDownload = async () => {
    if (isWebDAVDocument(document)) {
      const params = parseWebDAVPath(document.webdav_path);
      if (params) {
        const url = getWebDAVFileUrl(params);
        const link = document.createElement('a');
        link.href = url;
        link.download = document.file_name;
        link.click();
      }
    }
  };

  return (
    <div>
      <button onClick={() => setShowPreview(true)}>Preview</button>
      <button onClick={handleDownload}>Download</button>
      
      <FilePreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        document={document}
      />
    </div>
  );
};
```

### Case Document Lists

```tsx
import { FilePreview } from '@/components/documents/FilePreview';

const CaseDocuments = ({ caseId }) => {
  const [selectedDoc, setSelectedDoc] = useState(null);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        {/* Document list */}
        {documents.map(doc => (
          <div key={doc.id} onClick={() => setSelectedDoc(doc)}>
            {doc.file_name}
          </div>
        ))}
      </div>
      <div>
        {/* Preview panel */}
        {selectedDoc && (
          <FilePreview 
            document={selectedDoc}
            className="w-full h-full"
          />
        )}
      </div>
    </div>
  );
};
```

## Backend Configuration

The WebDAV integration requires the `pydio-webdav` Supabase Edge Function to be configured with:

- **Base URL**: `https://server.hrulegal.com/dav/crmdata`
- **Credentials**: Username `crm`, Password `Hrulegal@711`
- **CORS Headers**: `Access-Control-Allow-Origin: *`

## File Path Structure

WebDAV files are organized as:
```
/crmdata/{clientName}/{caseName}/{docType}/{fileName}
```

Example:
```
/crmdata/Test Client/Test Case/Court Filings/Orders/judgment.pdf
```

## Browser Compatibility

- **PDFs**: Work in modern browsers with iframe support
- **Images**: Universal support
- **Videos/Audio**: Depends on browser codec support
- **CORS**: All files served with proper CORS headers for cross-origin requests

## Error Handling

All components include proper error handling:
- Network failures show error messages
- Unsupported file types show download buttons
- Invalid WebDAV paths fall back gracefully

## Security

- Files are served through the Supabase Edge Function with authentication
- WebDAV credentials are stored securely in the edge function
- CORS headers allow browser preview while maintaining security