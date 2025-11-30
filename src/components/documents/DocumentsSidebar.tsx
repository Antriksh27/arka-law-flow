import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Folder, FolderOpen, Clock, Star, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
interface DocumentsSidebarProps {
  selectedFolder: string;
  onFolderSelect: (folder: string) => void;
}
export const DocumentsSidebar: React.FC<DocumentsSidebarProps> = ({
  selectedFolder,
  onFolderSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  // Fetch folders (unique folder names from documents)
  const {
    data: folders = []
  } = useQuery({
    queryKey: ['document-folders'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('documents').select('folder_name, case_id, cases!inner(case_title)').not('folder_name', 'is', null);
      if (error) throw error;

      // Group by case and count documents
      const folderMap = new Map();
      data?.forEach(doc => {
        const caseTitle = doc.cases?.case_title || doc.folder_name;
        if (!folderMap.has(doc.case_id)) {
          folderMap.set(doc.case_id, {
            name: caseTitle,
            count: 0,
            caseId: doc.case_id
          });
        }
        folderMap.get(doc.case_id).count++;
      });
      return Array.from(folderMap.values());
    }
  });
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

  // Filter folders based on search query
  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return <div className="w-full sm:w-64 bg-gray-50 sm:border-r border-gray-200 flex flex-col h-full">
      {/* Main Navigation */}
      <div className="p-4">
        <div className="space-y-1">
          {sidebarItems.map(item => {
          const IconComponent = item.icon;
          const isSelected = selectedFolder === item.id;
          return <button key={item.id} onClick={() => onFolderSelect(item.id)} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", isSelected ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-200")}>
                <IconComponent className="w-4 h-4" />
                <span className="flex-1 text-left text-gray-400">{item.name}</span>
                {item.count && <span className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded-full">
                    {item.count}
                  </span>}
              </button>;
        })}
        </div>
      </div>

      {/* Folders Section */}
      <div className="flex-1 px-4 pb-4 overflow-hidden flex flex-col">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Case Folders
          </h3>
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        
        <div className="space-y-1 flex-1 overflow-y-auto">
          {filteredFolders.map(folder => {
          const isSelected = selectedFolder === folder.name;
          return <button key={folder.name} onClick={() => onFolderSelect(folder.name)} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors", isSelected ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-200")}>
                {isSelected ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                <span className={cn("flex-1 text-left truncate", isSelected ? "text-white" : "text-gray-700")} title={folder.name}>
                  {folder.name}
                </span>
                <span className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded-full">
                  {folder.count}
                </span>
              </button>;
        })}
        </div>
      </div>
    </div>;
};