import React, { useState } from 'react';
import { Check, ChevronDown, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ContactSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ContactSelector: React.FC<ContactSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Search and select a contact...",
  disabled = false
}) => {
  const [open, setOpen] = useState(false);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-for-selector'],
    queryFn: async (): Promise<{ id: string; name: string }[]> => {
      const { data, error } = await (supabase
        .from('contacts' as any)
        .select('id, name')
        .order('name'));
      
      if (error) throw error;
      return (data as any[]) || [];
    }
  });

  const selectedContact = contacts.find((contact) => contact.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between bg-white border-gray-300 hover:bg-gray-50 focus:border-blue-500 focus:ring-blue-500 text-left"
        >
          <div className="flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-gray-400" />
            <span className={cn(
              "truncate",
              !selectedContact && "text-gray-500"
            )}>
              {selectedContact ? selectedContact.name : placeholder}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-white border border-gray-200 shadow-lg z-[60]" align="start">
        <Command className="bg-white">
          <CommandInput 
            placeholder="Search contacts..." 
            className="border-0 focus:ring-0"
          />
          <CommandList>
            <CommandEmpty>No contacts found.</CommandEmpty>
            <CommandGroup>
              {contacts.map((contact) => (
                <CommandItem
                  key={contact.id}
                  value={contact.name}
                  onSelect={() => {
                    onValueChange(contact.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer hover:bg-gray-100 data-[selected=true]:bg-blue-50"
                >
                  <div className="flex items-center gap-2 w-full">
                    <UserCircle className="h-4 w-4 text-gray-400" />
                    <span className="truncate flex-1">{contact.name}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4 text-blue-600",
                        value === contact.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
