import React, { useState } from 'react';
import { Folder, Clock, Star, Search, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { DocumentFolderTree } from './DocumentFolderTree';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DOCUMENT_TYPE_ICONS, PRIMARY_DOCUMENT_TYPES } from '@/lib/documentTypes';
import { Badge } from '@/components/ui/badge';

interface DocumentsSidebarProps {
  selectedFolder: string;
  onFolderSelect: (folder: string) => void;
}

export const DocumentsSidebar: React.FC<DocumentsSidebarProps> = ({
  selectedFolder,
  onFolderSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFolderTree, setShowFolderTree] = useState(true);
  const [showDocTypes, setShowDocTypes] = useState(false);

  const sidebarItems = [{
    id: 'all',
    name: 'All Documents',
    icon: Folder,
  }, {
    id: 'recent',
    name: 'Recently Added',
    icon: Clock,
  }, {
    id: 'starred',
    name: 'Important',
    icon: Star,
  }];

  const handleFolderTreeSelect = (path: string, type: string, id?: string) => {
    if (type === 'case' && id) {
      onFolderSelect(id);
    } else if (type === 'client' && id) {
      onFolderSelect(`client:${id}`);
    } else {
      onFolderSelect(path);
    }
  };

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Search Input - Always Visible */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm bg-background border-border"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {/* Main Navigation */}
          {sidebarItems.map(item => {
            const IconComponent = item.icon;
            const isSelected = selectedFolder === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => onFolderSelect(item.id)} 
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isSelected 
                    ? "bg-slate-800 text-white shadow-sm" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <IconComponent className={cn("w-4 h-4", isSelected && "text-white")} />
                <span className={cn("flex-1 text-left", isSelected && "text-white")}>{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* Folder Tree Section */}
        <div className="px-3 pb-3">
          <Collapsible open={showFolderTree} onOpenChange={setShowFolderTree}>
            <CollapsibleTrigger className="flex items-center gap-2 py-2 px-1 w-full hover:bg-accent/50 rounded-lg transition-colors">
              {showFolderTree ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Browse by Client
              </h3>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-1">
                <DocumentFolderTree 
                  onFolderSelect={handleFolderTreeSelect}
                  selectedPath={selectedFolder}
                  searchQuery={searchQuery}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Document Types Section */}
        <div className="px-3 pb-3">
          <Collapsible open={showDocTypes} onOpenChange={setShowDocTypes}>
            <CollapsibleTrigger className="flex items-center gap-2 py-2 px-1 w-full hover:bg-accent/50 rounded-lg transition-colors">
              {showDocTypes ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Document Types
              </h3>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-1 space-y-0.5">
                {PRIMARY_DOCUMENT_TYPES.slice(0, 8).map(type => {
                  const emoji = DOCUMENT_TYPE_ICONS[type];
                  const isSelected = selectedFolder === `type:${type}`;
                  
                  return (
                    <button
                      key={type}
                      onClick={() => onFolderSelect(`type:${type}`)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                        isSelected 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <span className="text-base">{emoji}</span>
                      <span className="flex-1 text-left truncate">{type}</span>
                    </button>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
};
