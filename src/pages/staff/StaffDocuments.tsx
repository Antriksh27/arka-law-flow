import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Upload,
  FileText,
  Download,
  Eye,
  Filter,
  FolderOpen,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_at: string;
  uploaded_by: string;
  case_id: string;
  folder_name: string;
  description: string;
  is_evidence: boolean;
  case_title?: string;
  uploader_name?: string;
}

interface Case {
  id: string;
  case_title: string;
  case_number: string;
}

const StaffDocuments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [caseFilter, setCaseFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [folderFilter, setFolderFilter] = useState('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    case_id: '',
    description: '',
    folder_name: '',
    is_evidence: false
  });

  useEffect(() => {
    fetchDocuments();
    fetchCases();
    
    // Check if should open upload dialog from URL params
    if (searchParams.get('action') === 'upload') {
      setShowUploadDialog(true);
    }
  }, [user, searchParams]);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchQuery, caseFilter, typeFilter, folderFilter]);

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          cases:case_id (
            case_title,
            case_number
          )
        `)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      // Enhance with uploader names
      const enhancedDocs = await Promise.all(
        (data || []).map(async (doc) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', doc.uploaded_by)
            .single();

          return {
            ...doc,
            case_title: doc.cases?.case_title,
            uploader_name: profile?.full_name || 'Unknown'
          };
        })
      );

      setDocuments(enhancedDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title, case_number')
        .order('case_title');

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.case_title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (caseFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.case_id === caseFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.file_type === typeFilter);
    }

    if (folderFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.folder_name === folderFilter);
    }

    setFilteredDocuments(filtered);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadForm(prev => ({
        ...prev,
        folder_name: prev.folder_name || 'General Documents'
      }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Insert document record
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          file_name: selectedFile.name,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          file_url: publicUrl,
          case_id: uploadForm.case_id || null,
          description: uploadForm.description,
          folder_name: uploadForm.folder_name,
          is_evidence: uploadForm.is_evidence,
          uploaded_by: user.id
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      setShowUploadDialog(false);
      setSelectedFile(null);
      setUploadForm({
        case_id: '',
        description: '',
        folder_name: '',
        is_evidence: false
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_url.split('/').pop() || '');

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.file_name;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('excel')) return '📊';
    return '📁';
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uniqueTypes = [...new Set(documents.map(doc => doc.file_type))];
  const uniqueFolders = [...new Set(documents.map(doc => doc.folder_name))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Documents</h1>
          <p className="text-muted-foreground">Manage case documents and files</p>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                />
              </div>
              
              <div>
                <Label htmlFor="case">Related Case (Optional)</Label>
                <Select value={uploadForm.case_id} onValueChange={(value) => 
                  setUploadForm(prev => ({ ...prev, case_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a case" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific case</SelectItem>
                    {cases.map((case_) => (
                      <SelectItem key={case_.id} value={case_.id}>
                        {case_.case_number} - {case_.case_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="folder">Folder</Label>
                <Input
                  id="folder"
                  value={uploadForm.folder_name}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, folder_name: e.target.value }))}
                  placeholder="General Documents"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the document"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="evidence"
                  checked={uploadForm.is_evidence}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, is_evidence: e.target.checked }))}
                />
                <Label htmlFor="evidence">Mark as Evidence</Label>
              </div>

              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile}
                className="w-full"
              >
                Upload Document
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={caseFilter} onValueChange={setCaseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by case" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cases</SelectItem>
                {cases.map((case_) => (
                  <SelectItem key={case_.id} value={case_.id}>
                    {case_.case_number} - {case_.case_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={folderFilter} onValueChange={setFolderFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Folders</SelectItem>
                {uniqueFolders.map((folder) => (
                  <SelectItem key={folder} value={folder}>
                    {folder}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Documents ({filteredDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Case</TableHead>
                  <TableHead>Folder</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No documents found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getFileIcon(document.file_type)}</span>
                          <div>
                            <div className="font-medium">{document.file_name}</div>
                            {document.description && (
                              <div className="text-xs text-muted-foreground">{document.description}</div>
                            )}
                            {document.is_evidence && (
                              <Badge variant="destructive" className="text-xs mt-1">Evidence</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {document.case_title ? (
                          <div className="flex items-center gap-1">
                            <FolderOpen className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{document.case_title}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No case</span>
                        )}
                      </TableCell>
                      <TableCell>{document.folder_name}</TableCell>
                      <TableCell>{document.uploader_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {new Date(document.uploaded_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{formatFileSize(document.file_size)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{document.file_type.split('/').pop()}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(document.file_url, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(document)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffDocuments;