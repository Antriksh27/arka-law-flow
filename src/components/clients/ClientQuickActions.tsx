
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Plus, 
  Calendar, 
  FileText, 
  StickyNote,
  Briefcase,
  Edit,
  Trash2
} from 'lucide-react';

interface ClientQuickActionsProps {
  clientId: string;
  onAction: () => void;
}

export const ClientQuickActions: React.FC<ClientQuickActionsProps> = ({ 
  clientId, 
  onAction 
}) => {
  return (
    <div className="flex items-center gap-3">
      <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
        <Plus className="w-4 h-4 mr-2" />
        New Case
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="border-gray-200">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 rounded-xl shadow-sm">
          <DropdownMenuItem className="hover:bg-gray-50">
            <Briefcase className="w-4 h-4 mr-3 text-gray-400" />
            <span>Assign to Case</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-gray-50">
            <Calendar className="w-4 h-4 mr-3 text-gray-400" />
            <span>Schedule Appointment</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-gray-50">
            <FileText className="w-4 h-4 mr-3 text-gray-400" />
            <span>Upload Document</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-gray-50">
            <StickyNote className="w-4 h-4 mr-3 text-gray-400" />
            <span>Add Note</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-200" />
          <DropdownMenuItem className="hover:bg-gray-50">
            <Edit className="w-4 h-4 mr-3 text-gray-400" />
            <span>Edit Client</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-red-50 text-red-600">
            <Trash2 className="w-4 h-4 mr-3 text-red-400" />
            <span>Delete Client</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
