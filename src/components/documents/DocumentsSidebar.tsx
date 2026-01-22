import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Folder, FolderOpen, Clock, Star, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { DocumentFolderTree } from './DocumentFolderTree';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

  const sidebarItems = [{
    id: 'all',
    name: 'All Documents',
    icon: Folder,
    count: null
  }, {
    id: 'recent',
    name: 'Recently Added',
    icon: Clock,
    count: null
  }, {
    id: 'starred',
    name: 'Important',
    icon: Star,
    count: null
  }];

  const handleFolderTreeSelect = (path: string, type: string, id?: string) => {
    // Convert folder tree selection to filter
    if (type === 'case' && id) {
      onFolderSelect(id);
    } else if (type === 'client' && id) {
      onFolderSelect(`client:${id}`);
    } else {
      onFolderSelect(path);
    }
  };

  return (
    <div className="w-full sm:w-64 bg-muted/30 sm:border-r border-border flex flex-col h-full">
      {/* Main Navigation */}
      <div className="p-4">
        <div className="space-y-1">
          {sidebarItems.map(item => {
            const IconComponent = item.icon;
            const isSelected = selectedFolder === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => onFolderSelect(item.id)} 
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isSelected 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <IconComponent className="w-4 h-4" />
                <span className="flex-1 text-left">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Folder Tree Section */}
      <div className="flex-1 px-4 pb-4 overflow-hidden flex flex-col">
        <Collapsible open={showFolderTree} onOpenChange={setShowFolderTree}>
          <CollapsibleTrigger className="flex items-center gap-2 mb-3 w-full">
            {showFolderTree ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Browse by Client
            </h3>
          </CollapsibleTrigger>

          <CollapsibleContent className="flex-1 overflow-hidden flex flex-col">
            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-background"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto -mx-2">
              <DocumentFolderTree 
                onFolderSelect={handleFolderTreeSelect}
                selectedPath={selectedFolder}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};