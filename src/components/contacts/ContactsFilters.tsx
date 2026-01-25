import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ContactsFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const ContactsFilters = ({ searchTerm, onSearchChange }: ContactsFiltersProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-6 border border-slate-200">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search contacts by name, email, phone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-slate-200 h-12 text-base"
          />
        </div>
      </div>
    </div>
  );
};
