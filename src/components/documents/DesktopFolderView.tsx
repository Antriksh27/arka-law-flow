import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ChevronRight,
  Building2,
  Briefcase,
  Folder,
  FileText,
  Star,
  Download,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getFileIcon } from '@/lib/fileUtils';
import { DOCUMENT_TYPE_ICONS } from '@/lib/documentTypes';
import TimeUtils from '@/lib/timeUtils';
import { FileViewer } from './FileViewer';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';
import { useToast } from '@/hooks/use-toast';

interface FolderNode {
  id: string;
  name: string;
  type: 'client' | 'case' | 'primary_type';
  count: number;
  children?: FolderNode[];
  documents?: any[];
}

interface BreadcrumbItem {
  label: string;
  nodeId: string | null;
}

export const DesktopFolderView: React.FC<{ searchQuery?: string }> = ({ searchQuery = '' }) => {
  const [navigationStack, setNavigationStack] = useState<BreadcrumbItem[]>([
    { label: 'All Clients', nodeId: null }
  ]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [deleteDoc, setDeleteDoc] = useState<any>(null);
  const { toast } = useToast();

  const { data: folderData, isLoading, refetch } = useQuery({
    queryKey: ['desktop-folder-structure'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          file_name,
          file_type,
          file_size,
          file_url,
          uploaded_at,
          is_evidence,
          folder_name,
          client_id,
          case_id,
          clients!left(id, full_name),
          cases!left(id, case_title, case_number)
        `)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      const clientMap = new Map<string, FolderNode>();

      data?.forEach((doc: any) => {
        const clientId = doc.client_id || 'no-client';
        const clientName = doc.clients?.full_name || 'General Documents';
        const caseId = doc.case_id || 'no-case';
        const caseTitle = doc.cases?.case_title || 'Uncategorized';
        const caseNumber = doc.cases?.case_number;
        const primaryType = doc.folder_name || 'Miscellaneous';

        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            id: clientId,
            name: clientName,
            type: 'client',
            count: 0,
            children: [],
          });
        }
        const clientNode = clientMap.get(clientId)!;
        clientNode.count++;

        let caseNode = clientNode.children?.find(c => c.id === caseId);
        if (!caseNode) {
          caseNode = {
            id: caseId,
            name: caseNumber ? `${caseTitle} (${caseNumber})` : caseTitle,
            type: 'case',
            count: 0,
            children: [],
          };
          clientNode.children?.push(caseNode);
        }
        caseNode.count++;

        let typeNode = caseNode.children?.find(p => p.id === `${caseId}-${primaryType}`);
        if (!typeNode) {
          typeNode = {
            id: `${caseId}-${primaryType}`,
            name: primaryType,
            type: 'primary_type',
            count: 0,
            documents: [],
          };
          caseNode.children?.push(typeNode);
        }
        typeNode.count++;
        typeNode.documents?.push(doc);
      });

      return Array.from(clientMap.values()).sort((a, b) =>
        a.name === 'General Documents' ? 1 : b.name === 'General Documents' ? -1 : a.name.localeCompare(b.name)
      );
    }
  });

  const getCurrentItems = (): { folders: FolderNode[]; documents: any[] } => {
    if (!folderData) return { folders: [], documents: [] };
    const depth = navigationStack.length;
    if (depth === 1) return { folders: folderData, documents: [] };

    let currentNodes: FolderNode[] = folderData;
    for (let i = 1; i < depth; i++) {
      const targetId = navigationStack[i].nodeId;
      const found = currentNodes.find(n => n.id === targetId);
      if (found?.children) {
        currentNodes = found.children;
      } else if (found?.documents) {
        return { folders: [], documents: found.documents };
      } else {
        return { folders: [], documents: [] };
      }
    }
    return { folders: currentNodes, documents: [] };
  };

  const { folders, documents } = getCurrentItems();

  // Recursively check if a folder or any of its descendants match the search
  const folderMatchesSearch = (node: FolderNode, query: string): boolean => {
    const q = query.toLowerCase();
    if (node.name.toLowerCase().includes(q)) return true;
    if (node.children?.some(c => folderMatchesSearch(c, query))) return true;
    if (node.documents?.some((d: any) => d.file_name.toLowerCase().includes(q))) return true;
    return false;
  };

  const filteredFolders = searchQuery
    ? folders.filter(f => folderMatchesSearch(f, searchQuery))
    : folders;
  const filteredDocs = searchQuery
    ? documents.filter((d: any) => d.file_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : documents;

  const navigateInto = (node: FolderNode) => {
    setNavigationStack(prev => [...prev, { label: node.name, nodeId: node.id }]);
  };
  const navigateBack = () => {
    if (navigationStack.length > 1) setNavigationStack(prev => prev.slice(0, -1));
  };
  const navigateTo = (index: number) => {
    setNavigationStack(prev => prev.slice(0, index + 1));
  };

  const getIcon = (type: string, name?: string) => {
    if (type === 'client') return <Building2 className="w-5 h-5 text-blue-500" />;
    if (type === 'case') return <Briefcase className="w-5 h-5 text-amber-500" />;
    if (type === 'primary_type' && name) {
      const emoji = DOCUMENT_TYPE_ICONS[name];
      if (emoji) return <span className="text-lg">{emoji}</span>;
    }
    return <Folder className="w-5 h-5 text-muted-foreground" />;
  };

  const getSubtext = (node: FolderNode) => {
    if (node.type === 'client') return `${node.children?.length || 0} case${(node.children?.length || 0) !== 1 ? 's' : ''} · ${node.count} document${node.count !== 1 ? 's' : ''}`;
    if (node.type === 'case') return `${node.children?.length || 0} folder${(node.children?.length || 0) !== 1 ? 's' : ''} · ${node.count} document${node.count !== 1 ? 's' : ''}`;
    return `${node.count} document${node.count !== 1 ? 's' : ''}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const handleDownload = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage.from('documents').download(doc.file_url);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Download failed', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb bar */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-2">
        {navigationStack.length > 1 && (
          <Button variant="ghost" size="sm" onClick={navigateBack} className="mr-1">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        )}
        <div className="flex items-center gap-1 text-sm overflow-x-auto">
          {navigationStack.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
              <button
                onClick={() => navigateTo(i)}
                className={cn(
                  "whitespace-nowrap px-1.5 py-0.5 rounded hover:bg-accent transition-colors",
                  i === navigationStack.length - 1
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {crumb.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Folders grid */}
          {filteredFolders.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFolders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => navigateInto(folder)}
                  className="bg-card rounded-2xl border border-border p-5 flex items-start gap-4 hover:shadow-md hover:border-primary/20 transition-all text-left group"
                >
                  <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/5 transition-colors">
                    {getIcon(folder.type, folder.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{folder.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{getSubtext(folder)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}

          {/* Documents table */}
          {filteredDocs.length > 0 && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Name</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Type</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Size</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Uploaded</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc: any) => {
                    const FileIcon = getFileIcon(doc.file_type);
                    return (
                      <tr
                        key={doc.id}
                        className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <FileIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium text-foreground truncate max-w-[300px]">
                              {doc.file_name}
                            </span>
                            {doc.is_evidence && <Star className="w-3.5 h-3.5 text-yellow-500 fill-current flex-shrink-0" />}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant="outline" className="text-xs">{doc.file_type?.toUpperCase() || '—'}</Badge>
                        </td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{formatFileSize(doc.file_size)}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{TimeUtils.formatDate(doc.uploaded_at, 'MMM d, yyyy')}</td>
                        <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedDoc(doc)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDownload(doc)}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredFolders.length === 0 && filteredDocs.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                {searchQuery ? 'No matching items' : 'No documents here'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try a different search' : 'Upload documents to see them organized by folder'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {selectedDoc && (
        <FileViewer open={!!selectedDoc} onClose={() => setSelectedDoc(null)} document={selectedDoc} />
      )}
      {deleteDoc && (
        <DeleteDocumentDialog open={!!deleteDoc} onClose={() => setDeleteDoc(null)} document={deleteDoc} onDeleted={() => refetch()} />
      )}
    </div>
  );
};
