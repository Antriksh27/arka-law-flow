import React from 'react';
import { Search, Grid3X3, List, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PRIMARY_DOCUMENT_TYPES } from '@/lib/documentTypes';
import { CaseSelector } from '@/components/appointments/CaseSelector';

interface DocumentsFilterBarProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFilters: {
    fileType: string;
    uploadedBy: string;
    caseId: string;
    clientId: string;
  };
  onFiltersChange: (filters: any) => void;
  onUploadClick: () => void;
}

export const DocumentsFilterBar: React.FC<DocumentsFilterBarProps> = ({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  selectedFilters,
  onFiltersChange,
  onUploadClick
}) => {
  // Fetch clients for filter dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, full_name')
        .order('full_name');
      if (error) throw error;
      return data || [];
    }
  });

  return (
    <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 border border-border">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
        {/* Search Input - searches by document name and client name */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by document or client name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 bg-background border-border focus:border-primary"
          />
        </div>

        {/* Client Filter */}
        <Select
          value={selectedFilters.clientId || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ ...selectedFilters, clientId: value, caseId: value === 'all' ? selectedFilters.caseId : 'all' })
          }
        >
          <SelectTrigger className="w-full lg:w-44 bg-background border-border h-10">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Case Filter - Searchable by case title */}
        <div className="w-full lg:w-56">
          <CaseSelector
            value={selectedFilters.caseId === 'all' ? '' : selectedFilters.caseId}
            onValueChange={(value) => 
              onFiltersChange({ ...selectedFilters, caseId: value || 'all' })
            }
            placeholder="Search cases..."
            clientId={selectedFilters.clientId === 'all' ? undefined : selectedFilters.clientId}
          />
        </div>

        {/* Document Type Filter */}
        <Select
          value={selectedFilters.fileType}
          onValueChange={(value) => 
            onFiltersChange({ ...selectedFilters, fileType: value })
          }
        >
          <SelectTrigger className="w-full lg:w-40 bg-background border-border h-10">
            <SelectValue placeholder="Document Type" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">All Types</SelectItem>
            {PRIMARY_DOCUMENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex border border-border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className={viewMode === 'grid' ? 'bg-slate-800 text-white hover:bg-slate-700' : 'hover:bg-accent'}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className={viewMode === 'list' ? 'bg-slate-800 text-white hover:bg-slate-700' : 'hover:bg-accent'}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Button 
            onClick={onUploadClick}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
};
