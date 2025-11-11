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
  return <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Contacts</h1>
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Button onClick={onAddContact} className="bg-slate-800 hover:bg-slate-700 w-full sm:w-auto h-11 sm:h-10">
          <Plus className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
          <span className="text-sm sm:text-base">New Contact</span>
        </Button>
      </div>
    </div>;
};