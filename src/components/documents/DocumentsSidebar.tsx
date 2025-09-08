import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Folder, FolderOpen, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
interface DocumentsSidebarProps {
  selectedFolder: string;
  onFolderSelect: (folder: string) => void;
}
export const DocumentsSidebar: React.FC<DocumentsSidebarProps> = ({
  selectedFolder,
  onFolderSelect
}) => {
  // Fetch folders (unique folder names from documents)
  const {
    data: folders = []
  } = useQuery({
    queryKey: ['document-folders'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('documents').select('folder_name, case_id, cases!inner(title)').not('folder_name', 'is', null);
      if (error) throw error;

      // Group by folder name and count documents
      const folderMap = new Map();
      data?.forEach(doc => {
        if (!folderMap.has(doc.folder_name)) {
          folderMap.set(doc.folder_name, {
            name: doc.folder_name,
            count: 0,
            caseId: doc.case_id
          });
        }
        folderMap.get(doc.folder_name).count++;
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
  return <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
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
      <div className="flex-1 px-4 pb-4">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Case Folders
          </h3>
        </div>
        
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {folders.map(folder => {
          const isSelected = selectedFolder === folder.name;
          return <button key={folder.name} onClick={() => onFolderSelect(folder.name)} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors", isSelected ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-200")}>
                {isSelected ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                <span className="flex-1 text-left truncate" title={folder.name}>
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