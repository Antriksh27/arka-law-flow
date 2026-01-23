import React, { useState, useEffect, useCallback } from 'react';
import { Check, ChevronsUpDown, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';

interface Case {
  id: string;
  case_title: string;
  case_number: string | null;
  cnr_number: string | null;
  client_id: string | null;
}

interface CaseSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  clientId?: string;
}

export const CaseSelector: React.FC<CaseSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Select case...",
  clientId
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Detect if input looks like a case number
  const isLikelyNumber = (input: string) => {
    return /^[\dA-Z\/\.\s-]+$/i.test(input) && 
           (input.includes('/') || input.includes('GJHC') || /^\d+$/.test(input));
  };

  // Fetch the selected case separately to ensure it's always available
  useEffect(() => {
    const fetchSelectedCase = async () => {
      if (!value || value === 'no-case') {
        setSelectedCase(null);
        return;
      }

      // Check if already in cases list
      const existingCase = cases.find(c => c.id === value);
      if (existingCase) {
        setSelectedCase(existingCase);
        return;
      }

      // Fetch from database
      const { data } = await supabase
        .from('cases')
        .select('id, case_title, case_number, cnr_number, client_id')
        .eq('id', value)
        .single();

      if (data) {
        setSelectedCase(data);
      }
    };

    fetchSelectedCase();
  }, [value, cases]);

  // Search cases server-side
  const searchCases = useCallback(async (searchTerm: string) => {
    setIsSearching(true);
    
    let query = supabase
      .from('cases')
      .select('id, case_title, case_number, cnr_number, client_id');
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (searchTerm && searchTerm.length >= 2) {
      if (isLikelyNumber(searchTerm)) {
        // Search by case number, CNR, or other reference numbers
        query = query.or(
          `case_number.ilike.%${searchTerm}%,cnr_number.ilike.%${searchTerm}%,registration_number.ilike.%${searchTerm}%,filing_number.ilike.%${searchTerm}%`
        );
      } else {
        // Search by case title, petitioner, respondent
        query = query.or(
          `case_title.ilike.%${searchTerm}%,petitioner.ilike.%${searchTerm}%,respondent.ilike.%${searchTerm}%`
        );
      }
    }

    // Limit results for performance, but search covers ALL cases
    query = query.order('case_title').limit(50);

    const { data } = await query;
    
    if (data) {
      // Sort results - exact matches first
      const sorted = data.sort((a, b) => {
        const searchLower = searchTerm.toLowerCase();
        const aExact = a.case_number?.toLowerCase() === searchLower ||
                       a.cnr_number?.toLowerCase() === searchLower;
        const bExact = b.case_number?.toLowerCase() === searchLower ||
                       b.cnr_number?.toLowerCase() === searchLower;
        
        if (aExact && !bExact) return -1;
        if (bExact && !aExact) return 1;
        return 0;
      });
      setCases(sorted);
    }
    
    setIsSearching(false);
  }, [clientId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCases(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, searchCases]);

  // Initial load - fetch recent cases
  useEffect(() => {
    searchCases('');
  }, [clientId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          role="combobox" 
          aria-expanded={open} 
          className="w-full justify-between bg-white border-gray-300 text-gray-900 hover:bg-gray-50 overflow-hidden"
        >
          {selectedCase ? (
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              <Briefcase className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="truncate">{selectedCase.case_title}</span>
              {selectedCase.case_number && (
                <span className="text-xs text-muted-foreground flex-shrink-0">({selectedCase.case_number})</span>
              )}
            </div>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[450px] p-0 bg-white border-gray-300" align="start">
        <Command className="bg-white" shouldFilter={false}>
          <CommandInput 
            placeholder="Search by case title, number, CNR, petitioner..." 
            value={searchValue} 
            onValueChange={setSearchValue} 
            className="text-gray-900" 
          />
          <CommandList className="max-h-[350px]">
            {isSearching ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Searching all cases...
              </div>
            ) : cases.length === 0 ? (
              <CommandEmpty className="text-gray-500 py-6">
                <div className="text-center">
                  <p>No cases found {searchValue ? `matching "${searchValue}"` : ''}</p>
                  <p className="text-xs mt-1 text-muted-foreground">
                    {searchValue.length < 2 
                      ? "Type at least 2 characters to search all cases"
                      : isLikelyNumber(searchValue) 
                        ? "Try entering the full case number or CNR" 
                        : "Try a different search term"}
                  </p>
                </div>
              </CommandEmpty>
            ) : (
              <CommandGroup heading={`Cases (${cases.length} results)`} className="text-gray-700">
                {cases.map(caseItem => (
                  <CommandItem 
                    key={caseItem.id} 
                    value={caseItem.id}
                    onSelect={() => {
                      onValueChange(caseItem.id);
                      setOpen(false);
                    }} 
                    className="flex items-start gap-2 text-gray-900 cursor-pointer py-3"
                  >
                    <Briefcase className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{caseItem.case_title}</div>
                      <div className="text-xs text-gray-500 space-x-2 mt-1">
                        {caseItem.case_number && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {caseItem.case_number}
                          </span>
                        )}
                        {caseItem.cnr_number && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            CNR: {caseItem.cnr_number}
                          </span>
                        )}
                      </div>
                    </div>
                    <Check className={cn("ml-auto h-4 w-4 flex-shrink-0", value === caseItem.id ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
