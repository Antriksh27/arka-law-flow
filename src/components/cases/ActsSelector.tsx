import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ActsSelectorProps {
  value: string[];
  onChange: (acts: string[]) => void;
  disabled?: boolean;
}

export const ActsSelector: React.FC<ActsSelectorProps> = ({
  value = [],
  onChange,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [newAct, setNewAct] = useState('');
  const queryClient = useQueryClient();

  // Fetch available acts from database
  const { data: availableActs = [], isLoading } = useQuery({
    queryKey: ['acts-master'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acts_master')
        .select('act_name')
        .order('act_name');
      
      if (error) throw error;
      return data.map(a => a.act_name);
    }
  });

  // Mutation to add new act to master list
  const addActMutation = useMutation({
    mutationFn: async (actName: string) => {
      const { error } = await supabase
        .from('acts_master')
        .insert([{ act_name: actName }]);
      
      if (error) throw error;
    },
    onSuccess: (_, actName) => {
      queryClient.invalidateQueries({ queryKey: ['acts-master'] });
      toast.success('New act added to master list');
      setNewAct('');
      // Also add to selected acts
      if (!value.includes(actName)) {
        onChange([...value, actName]);
      }
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('This act already exists');
      } else {
        toast.error('Failed to add act');
      }
    }
  });

  const toggleAct = (act: string) => {
    if (value.includes(act)) {
      onChange(value.filter(a => a !== act));
    } else {
      onChange([...value, act]);
    }
  };

  const removeAct = (act: string) => {
    onChange(value.filter(a => a !== act));
  };

  const handleAddNewAct = () => {
    if (newAct.trim()) {
      addActMutation.mutate(newAct.trim());
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between bg-white border-gray-300 hover:bg-gray-50 focus:border-blue-500 focus:ring-blue-500 text-left"
          >
            <span className="text-gray-500">
              {value.length === 0 ? 'Select acts...' : `${value.length} act(s) selected`}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-white border border-gray-200 shadow-lg z-[60]" align="start">
          <Command className="bg-white">
            <CommandInput 
              placeholder="Search acts..." 
              className="border-0 focus:ring-0"
            />
            <CommandList>
              <CommandEmpty>
                <div className="p-4 space-y-3">
                  <p className="text-sm text-gray-500">No acts found.</p>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700">Add a new act:</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter act name..."
                        value={newAct}
                        onChange={(e) => setNewAct(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewAct();
                          }
                        }}
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddNewAct}
                        disabled={!newAct.trim() || addActMutation.isPending}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {isLoading ? (
                  <div className="p-4 text-sm text-gray-500">Loading acts...</div>
                ) : (
                  <>
                    {availableActs.map((act) => (
                      <CommandItem
                        key={act}
                        value={act}
                        onSelect={() => toggleAct(act)}
                        className="cursor-pointer hover:bg-gray-100 data-[selected=true]:bg-blue-50"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Check
                            className={cn(
                              "h-4 w-4 text-blue-600",
                              value.includes(act) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate flex-1 text-sm">{act}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </>
                )}
              </CommandGroup>
            </CommandList>
            {!isLoading && availableActs.length > 0 && (
              <div className="p-3 border-t border-gray-200">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">Add a new act:</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter act name..."
                      value={newAct}
                      onChange={(e) => setNewAct(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewAct();
                        }
                      }}
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddNewAct}
                      disabled={!newAct.trim() || addActMutation.isPending}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Acts */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.map((act) => (
            <Badge
              key={act}
              variant="default"
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 pr-1"
            >
              <span className="max-w-xs truncate">{act}</span>
              <button
                type="button"
                onClick={() => removeAct(act)}
                className="ml-1 rounded-full hover:bg-blue-200 p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};