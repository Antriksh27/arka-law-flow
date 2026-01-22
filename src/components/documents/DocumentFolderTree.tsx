import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  FileText,
  Building2,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { DOCUMENT_TYPE_ICONS } from '@/lib/documentTypes';
import { HighlightedText } from './HighlightedText';

interface FolderNode {
  id: string;
  name: string;
  type: 'client' | 'case' | 'primary_type' | 'sub_type';
  count: number;
  children?: FolderNode[];
  path?: string;
}

interface DocumentFolderTreeProps {
  onFolderSelect: (path: string, type: string, id?: string) => void;
  selectedPath?: string;
  searchQuery?: string;
}

export const DocumentFolderTree: React.FC<DocumentFolderTreeProps> = ({
  onFolderSelect,
  selectedPath,
  searchQuery = ''
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['clients']));

  // Fetch documents grouped by client > case > primary_type > sub_type
  const { data: folderStructure = [], isLoading } = useQuery({
    queryKey: ['document-folder-structure'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          client_id,
          case_id,
          file_type,
          folder_name,
          clients!left(id, full_name),
          cases!left(id, case_title, case_number)
        `);

      if (error) throw error;

      // Build hierarchical structure
      const clientMap = new Map<string, FolderNode>();

      data?.forEach((doc: any) => {
        const clientId = doc.client_id || 'no-client';
        const clientName = doc.clients?.full_name || 'General Documents';
        const caseId = doc.case_id || 'no-case';
        const caseTitle = doc.cases?.case_title || 'Uncategorized';
        const caseNumber = doc.cases?.case_number;
        const primaryType = doc.folder_name || 'Miscellaneous';
        const subType = doc.file_type?.toUpperCase() || 'Other';

        // Get or create client node
        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            id: clientId,
            name: clientName,
            type: 'client',
            count: 0,
            children: [],
            path: `client:${clientId}`
          });
        }
        const clientNode = clientMap.get(clientId)!;
        clientNode.count++;

        // Get or create case node
        let caseNode = clientNode.children?.find(c => c.id === caseId);
        if (!caseNode) {
          caseNode = {
            id: caseId,
            name: caseNumber ? `${caseTitle} (${caseNumber})` : caseTitle,
            type: 'case',
            count: 0,
            children: [],
            path: `case:${caseId}`
          };
          clientNode.children?.push(caseNode);
        }
        caseNode.count++;

        // Get or create primary type node
        let primaryNode = caseNode.children?.find(p => p.name === primaryType);
        if (!primaryNode) {
          primaryNode = {
            id: `${caseId}-${primaryType}`,
            name: primaryType,
            type: 'primary_type',
            count: 0,
            children: [],
            path: `primary:${caseId}:${primaryType}`
          };
          caseNode.children?.push(primaryNode);
        }
        primaryNode.count++;

        // Get or create sub type node
        let subNode = primaryNode.children?.find(s => s.name === subType);
        if (!subNode) {
          subNode = {
            id: `${caseId}-${primaryType}-${subType}`,
            name: subType,
            type: 'sub_type',
            count: 0,
            path: `sub:${caseId}:${primaryType}:${subType}`
          };
          primaryNode.children?.push(subNode);
        }
        subNode.count++;
      });

      return Array.from(clientMap.values());
    }
  });

  // Filter nodes based on search query
  const filterNodes = (nodes: FolderNode[], query: string): FolderNode[] => {
    if (!query.trim()) return nodes;
    
    const lowerQuery = query.toLowerCase();
    
    return nodes.reduce<FolderNode[]>((acc, node) => {
      const matchesQuery = node.name.toLowerCase().includes(lowerQuery);
      const filteredChildren = node.children ? filterNodes(node.children, query) : [];
      const hasMatchingChildren = filteredChildren.length > 0;
      
      if (matchesQuery || hasMatchingChildren) {
        acc.push({
          ...node,
          children: hasMatchingChildren ? filteredChildren : node.children
        });
      }
      
      return acc;
    }, []);
  };

  // Get all node IDs that should be expanded when searching
  const getMatchingNodeIds = (nodes: FolderNode[], query: string): Set<string> => {
    const ids = new Set<string>();
    if (!query.trim()) return ids;
    
    const lowerQuery = query.toLowerCase();
    
    const traverse = (node: FolderNode): boolean => {
      const matchesQuery = node.name.toLowerCase().includes(lowerQuery);
      let hasMatchingChild = false;
      
      if (node.children) {
        for (const child of node.children) {
          if (traverse(child)) {
            hasMatchingChild = true;
          }
        }
      }
      
      if (matchesQuery || hasMatchingChild) {
        ids.add(node.id);
        return true;
      }
      
      return false;
    };
    
    nodes.forEach(traverse);
    return ids;
  };

  const filteredStructure = useMemo(() => 
    filterNodes(folderStructure, searchQuery), 
    [folderStructure, searchQuery]
  );

  // Auto-expand matching nodes when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const matchingIds = getMatchingNodeIds(folderStructure, searchQuery);
      setExpandedNodes(prev => new Set([...prev, ...matchingIds]));
    }
  }, [searchQuery, folderStructure]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderNode = (node: FolderNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedPath === node.path;
    const hasChildren = node.children && node.children.length > 0;

    const getIcon = () => {
      if (node.type === 'client') return Building2;
      if (node.type === 'case') return Briefcase;
      if (node.type === 'primary_type') {
        const emoji = DOCUMENT_TYPE_ICONS[node.name];
        if (emoji) return null;
      }
      return isExpanded ? FolderOpen : Folder;
    };

    const Icon = getIcon();
    const emoji = node.type === 'primary_type' ? DOCUMENT_TYPE_ICONS[node.name] : null;

    return (
      <div key={node.id}>
        <Collapsible open={isExpanded} onOpenChange={() => toggleNode(node.id)}>
          <div
            className={cn(
              "flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all",
              "hover:bg-accent/50",
              isSelected && "bg-primary/10 text-primary font-medium"
            )}
            style={{ paddingLeft: `${(level * 12) + 8}px` }}
            onClick={() => onFolderSelect(node.path || '', node.type, node.id)}
          >
            {hasChildren ? (
              <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="p-0.5 hover:bg-accent rounded transition-colors">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
            ) : (
              <div className="w-4" />
            )}

            {emoji ? (
              <span className="text-sm">{emoji}</span>
            ) : Icon ? (
              <Icon className={cn(
                "w-4 h-4 flex-shrink-0",
                node.type === 'client' && "text-blue-500",
                node.type === 'case' && "text-amber-500",
                node.type === 'sub_type' && "text-muted-foreground"
              )} />
            ) : (
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}

            <span className={cn(
              "text-sm truncate flex-1",
              isSelected ? "font-medium" : "font-normal"
            )}>
              <HighlightedText text={node.name} query={searchQuery} />
            </span>

            <Badge variant="outline" className="text-xs h-5 px-1.5 bg-muted/80 text-muted-foreground font-normal">
              {node.count}
            </Badge>
          </div>

          {hasChildren && (
            <CollapsibleContent className="animate-in slide-in-from-top-1 duration-200">
              {node.children?.map(child => renderNode(child, level + 1))}
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-2 space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (filteredStructure.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        {searchQuery ? 'No matching folders' : 'No documents yet'}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {filteredStructure.map(node => renderNode(node))}
    </div>
  );
};
