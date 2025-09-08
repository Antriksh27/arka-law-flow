import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  uploadFileToWebDAVWithPath, 
  createClientFolder, 
  createCaseFolder,
  downloadFileFromWebDAV 
} from '@/lib/pydioIntegration';
import { callWebDAVFunction } from '@/lib/supabaseEdgeFunction';

export const WebDAVExample: React.FC = () => {
  const [clientName, setClientName] = useState('TestClient');
  const [caseName, setCaseName] = useState('TestCase');
  const [docType, setDocType] = useState('Contracts');
  const [fileName, setFileName] = useState('sample.pdf');
  const [fileContent, setFileContent] = useState('Sample PDF content');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateClientFolder = async () => {
    setLoading(true);
    try {
      const result = await createClientFolder(clientName);
      if (result.success) {
        toast({ title: "Success", description: "Client folder created!" });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create client folder", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCaseFolder = async () => {
    setLoading(true);
    try {
      const result = await createCaseFolder(clientName, caseName);
      if (result.success) {
        toast({ title: "Success", description: "Case folder created!" });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create case folder", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = async () => {
    setLoading(true);
    try {
      const result = await uploadFileToWebDAVWithPath(
        clientName,
        caseName,
        docType,
        fileName,
        fileContent
      );
      if (result.success) {
        toast({ title: "Success", description: "File uploaded successfully!" });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async () => {
    setLoading(true);
    try {
      const blob = await callWebDAVFunction('download', {
        clientName,
        caseName,
        docType,
        fileName
      });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ title: "Success", description: "File downloaded!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to download file", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewFile = () => {
    const previewUrl = `https://hpcnipcbymruvsnqrmjx.functions.supabase.co/pydio-webdav?clientName=${encodeURIComponent(clientName)}&caseName=${encodeURIComponent(caseName)}&docType=${encodeURIComponent(docType)}&fileName=${encodeURIComponent(fileName)}`;
    window.open(previewUrl, '_blank');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>WebDAV Integration Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Client Name</label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Case Name</label>
            <Input value={caseName} onChange={(e) => setCaseName(e.target.value)} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Document Type</label>
            <Input value={docType} onChange={(e) => setDocType(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">File Name</label>
            <Input value={fileName} onChange={(e) => setFileName(e.target.value)} />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">File Content</label>
          <Input value={fileContent} onChange={(e) => setFileContent(e.target.value)} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={handleCreateClientFolder} disabled={loading}>
            Create Client Folder
          </Button>
          <Button onClick={handleCreateCaseFolder} disabled={loading}>
            Create Case Folder
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <Button onClick={handleUploadFile} disabled={loading}>
            Upload File
          </Button>
          <Button onClick={handleDownloadFile} disabled={loading}>
            Download File
          </Button>
          <Button onClick={handlePreviewFile} disabled={loading}>
            Preview File
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};