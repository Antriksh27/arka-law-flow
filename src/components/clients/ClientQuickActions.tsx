
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Plus, 
  Calendar, 
  FileText, 
  StickyNote,
  Briefcase 
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
    <div className="flex items-center gap-2">
      <Button size="sm" className="bg-primary hover:bg-primary/90">
        <Plus className="w-4 h-4 mr-2" />
        Quick Add
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>
            <Briefcase className="w-4 h-4 mr-2" />
            Assign to Case
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Calendar className="w-4 h-4 mr-2" />
            Create Appointment
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileText className="w-4 h-4 mr-2" />
            Upload Document
          </DropdownMenuItem>
          <DropdownMenuItem>
            <StickyNote className="w-4 h-4 mr-2" />
            Add Note
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
