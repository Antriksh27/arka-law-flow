import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Grid3X3, List } from 'lucide-react';
interface ContactsHeaderProps {
  onAddContact: () => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
}
export const ContactsHeader = ({
  onAddContact,
  viewMode,
  onViewModeChange
}: ContactsHeaderProps) => {
  return <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
      </div>
      
      <div className="flex items-center gap-3">
        
        
        <Button onClick={onAddContact} className="bg-slate-800 hover:bg-slate-700">
          <Plus className="h-4 w-4 mr-2" />
          New Contact
        </Button>
      </div>
    </div>;
};