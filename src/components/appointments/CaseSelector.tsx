import React, { useState, useEffect } from 'react';
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
  useEffect(() => {
    fetchCases();
  }, [clientId]);
  const fetchCases = async () => {
    let query = supabase.from('cases').select('id, case_title, case_number, client_id').order('case_title');
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    const {
      data
    } = await query;
    setCases(data || []);
  };
  const selectedCase = cases.find(c => c.id === value);
  return <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
          {selectedCase ? <div className="flex items-center gap-2 truncate">
              <Briefcase className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="truncate">
                {selectedCase.case_title.length > 50 
                  ? `${selectedCase.case_title.substring(0, 50)}...` 
                  : selectedCase.case_title}
              </span>
              {selectedCase.case_number && (
                <span className="text-xs text-muted-foreground">({selectedCase.case_number})</span>
              )}
            </div> : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-white border-gray-300" align="start">
        <Command className="bg-white">
          <CommandInput placeholder="Search cases by title or number..." value={searchValue} onValueChange={setSearchValue} className="text-gray-900" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="text-gray-500 py-6">
              <div className="text-center">
                <p>No cases found.</p>
                {clientId && <p className="text-sm mt-1">Select a different client to see more cases.</p>}
              </div>
            </CommandEmpty>
            
            {cases.length > 0 && <CommandGroup heading="Cases" className="text-gray-700">
                {cases.map(caseItem => <CommandItem key={caseItem.id} value={`${caseItem.case_title} ${caseItem.case_number || ''}`} onSelect={() => {
              onValueChange(caseItem.id);
              setOpen(false);
            }} className="flex items-start gap-2 text-gray-900 cursor-pointer py-3">
                    <Briefcase className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{caseItem.case_title}</div>
                      {caseItem.case_number}
                    </div>
                    <Check className={cn("ml-auto h-4 w-4 flex-shrink-0", value === caseItem.id ? "opacity-100" : "opacity-0")} />
                  </CommandItem>)}
              </CommandGroup>}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>;
};