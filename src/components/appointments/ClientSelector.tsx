import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { AddClientDialog } from '@/components/clients/AddClientDialog';

interface Client {
  id: string;
  full_name: string;
  type: 'client';
}

interface Contact {
  id: string;
  full_name: string;
  type: 'contact';
}

type ClientOrContact = Client | Contact;

interface ClientSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  onClientAdded?: (clientId: string) => void;
  showAddButton?: boolean;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Select client/contact...",
  onClientAdded,
  showAddButton = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);

  useEffect(() => {
    fetchClientsAndContacts();
  }, []);

  const fetchClientsAndContacts = async () => {
    const { data: clientsData } = await supabase
      .from('clients')
      .select('id, full_name')
      .order('full_name');

    const { data: contactsData } = await supabase
      .from('contacts')
      .select('id, name')
      .order('name');

    setClients((clientsData || []).map(c => ({ ...c, type: 'client' as const })));
    setContacts((contactsData || []).map(c => ({ id: c.id, full_name: c.name, type: 'contact' as const })));
  };

  const allOptions = [...clients, ...contacts];
  
  const filteredClients = clients.filter(client => 
    client.full_name.toLowerCase().includes(searchValue.toLowerCase())
  );
  
  const filteredContacts = contacts.filter(contact => 
    contact.full_name.toLowerCase().includes(searchValue.toLowerCase())
  );
  
  const selectedOption = allOptions.find(option => option.id === value);

  const handleRefresh = () => {
    fetchClientsAndContacts();
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white border-gray-300 text-gray-900 hover:bg-gray-50 overflow-hidden"
          >
            {selectedOption ? (
              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="truncate">{selectedOption.full_name}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                  {selectedOption.type}
                </span>
              </div>
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 bg-white border-gray-300" align="start">
          <Command className="bg-white">
            <CommandInput
              placeholder="Search clients and contacts..."
              value={searchValue}
              onValueChange={setSearchValue}
              className="text-gray-900"
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="text-gray-500 py-6">
                <p>No clients or contacts found.</p>
              </CommandEmpty>
              
              {filteredClients.length > 0 && (
                <CommandGroup heading="Clients" className="text-gray-700">
                  {filteredClients.map((client) => (
                    <CommandItem
                      key={client.id}
                      value={client.full_name}
                      onSelect={() => {
                        onValueChange(client.id);
                        setOpen(false);
                      }}
                      className="flex items-center gap-2 text-gray-900 cursor-pointer"
                    >
                      <User className="h-4 w-4 text-blue-500" />
                      <span className="flex-1">{client.full_name}</span>
                      <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        Client
                      </span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === client.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {filteredContacts.length > 0 && (
                <CommandGroup heading="Contacts" className="text-gray-700">
                  {filteredContacts.map((contact) => (
                    <CommandItem
                      key={contact.id}
                      value={contact.full_name}
                      onSelect={() => {
                        onValueChange(contact.id);
                        setOpen(false);
                      }}
                      className="flex items-center gap-2 text-gray-900 cursor-pointer"
                    >
                      <User className="h-4 w-4 text-green-500" />
                      <span className="flex-1">{contact.full_name}</span>
                      <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        Contact
                      </span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === contact.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {showAddButton && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddClientDialog(true)}
          className="mt-2 w-full flex items-center gap-2 text-slate-600 border-dashed border-slate-300 hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" />
          Add New Client
        </Button>
      )}

      <AddClientDialog
        open={showAddClientDialog}
        onOpenChange={setShowAddClientDialog}
        onSuccess={(clientId?: string) => {
          handleRefresh();
          if (clientId && onClientAdded) {
            onClientAdded(clientId);
          }
          setShowAddClientDialog(false);
        }}
      />
    </>
  );
};
