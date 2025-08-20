import React, { useState } from 'react';
import { Check, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  full_name: string;
}

interface ClientSelectorProps {
  clients: Client[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  clients,
  value,
  onValueChange,
  placeholder = "Search and select a client...",
  disabled = false
}) => {
  const [open, setOpen] = useState(false);

  const selectedClient = clients.find((client) => client.id === value);

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
            <User className="h-4 w-4 text-gray-400" />
            <span className={cn(
              "truncate",
              !selectedClient && "text-gray-500"
            )}>
              {selectedClient ? selectedClient.full_name : placeholder}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-white border border-gray-200 shadow-lg z-[60]" align="start">
        <Command className="bg-white">
          <CommandInput 
            placeholder="Search clients..." 
            className="border-0 focus:ring-0"
          />
          <CommandList>
            <CommandEmpty>No clients found.</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.full_name}
                  onSelect={() => {
                    onValueChange(client.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer hover:bg-gray-100 data-[selected=true]:bg-blue-50"
                >
                  <div className="flex items-center gap-2 w-full">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="truncate flex-1">{client.full_name}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4 text-blue-600",
                        value === client.id ? "opacity-100" : "opacity-0"
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