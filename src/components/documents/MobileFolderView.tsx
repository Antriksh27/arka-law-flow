import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  ChevronRight, 
  ChevronLeft, 
  Building2, 
  Briefcase, 
  Folder, 
  FileText,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getFileIcon } from '@/lib/fileUtils';
import { DOCUMENT_TYPE_ICONS } from '@/lib/documentTypes';
import TimeUtils from '@/lib/timeUtils';
import { FileViewer } from './FileViewer';

interface FolderNode {
  id: string;
  name: string;
  type: 'client' | 'case' | 'primary_type';
  count: number;
  children?: FolderNode[];
  documents?: any[];
}

// Breadcrumb item
interface BreadcrumbItem {
  label: string;
  nodeId: string | null; // null = root
}

export const MobileFolderView: React.FC<{ searchQuery?: string }> = ({ searchQuery = '' }) => {
  const [navigationStack, setNavigationStack] = useState<BreadcrumbItem[]>([
    { label: 'All Clients', nodeId: null }
  ]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const { data: folderData, isLoading } = useQuery({
    queryKey: ['mobile-folder-structure'],
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

      // Build hierarchy: Client > Case > Primary Type, with documents at leaf
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

  // Navigate to find current items
  const getCurrentItems = (): { folders: FolderNode[]; documents: any[] } => {
    if (!folderData) return { folders: [], documents: [] };

    const depth = navigationStack.length;
    
    if (depth === 1) {
      // Root: show clients
      return { folders: folderData, documents: [] };
    }

    // Find the node at the current depth
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

  // Filter by search
  const filteredFolders = searchQuery
    ? folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : folders;
  const filteredDocs = searchQuery
    ? documents.filter((d: any) => d.file_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : documents;

  const navigateInto = (node: FolderNode) => {
    setNavigationStack(prev => [...prev, { label: node.name, nodeId: node.id }]);
  };

  const navigateBack = () => {
    if (navigationStack.length > 1) {
      setNavigationStack(prev => prev.slice(0, -1));
    }
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

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      {navigationStack.length > 1 && (
        <div className="px-4 py-3 bg-background border-b border-border">
          <button
            onClick={navigateBack}
            className="flex items-center gap-2 text-sm text-primary font-medium active:opacity-70"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-1 mt-1.5 overflow-x-auto scrollbar-hide">
            {navigationStack.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                <button
                  onClick={() => navigateTo(i)}
                  className={cn(
                    "text-xs whitespace-nowrap flex-shrink-0",
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
      )}

      {/* Folder / Document List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {/* Folders */}
          {filteredFolders.map(folder => (
            <button
              key={folder.id}
              onClick={() => navigateInto(folder)}
              className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-3 active:scale-[0.98] transition-transform shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                {getIcon(folder.type, folder.name)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground truncate">{folder.name}</p>
                <p className="text-xs text-muted-foreground">
                  {folder.count} document{folder.count !== 1 ? 's' : ''}
                  {folder.children && folder.children.length > 0 && ` · ${folder.children.length} ${folder.type === 'client' ? 'case' : 'folder'}${folder.children.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-normal flex-shrink-0">
                {folder.count}
              </Badge>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}

          {/* Documents (at leaf level) */}
          {filteredDocs.map((doc: any) => {
            const FileIcon = getFileIcon(doc.file_type);
            return (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-3 active:scale-[0.98] transition-transform shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 relative">
                  <FileIcon className="w-5 h-5 text-muted-foreground" />
                  {doc.is_evidence && (
                    <Star className="w-3 h-3 text-yellow-500 fill-current absolute -top-0.5 -right-0.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {doc.file_type?.toUpperCase()}
                    </span>
                    {doc.file_size && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                        </span>
                      </>
                    )}
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {TimeUtils.formatDate(doc.uploaded_at, 'MMM d')}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Empty state */}
          {filteredFolders.length === 0 && filteredDocs.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No matching items' : 'No documents in this folder'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* File Viewer */}
      {selectedDoc && (
        <FileViewer
          open={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          document={selectedDoc}
        />
      )}
    </div>
  );
};
