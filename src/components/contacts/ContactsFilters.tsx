import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ContactsFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const ContactsFilters = ({ searchTerm, onSearchChange }: ContactsFiltersProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search contacts by name, email, phone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-slate-900"
          />
        </div>
      </div>
    </div>
  );
};