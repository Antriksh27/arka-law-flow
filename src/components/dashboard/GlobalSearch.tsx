import { useState, useEffect } from 'react';
import { Search, FileText, Users, Briefcase, CheckSquare, Loader2 } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({ clients: [], cases: [], contacts: [], tasks: [] });
  const navigate = useNavigate();
  const { firmId } = useAuth();

  useEffect(() => {
    const searchAllModules = async () => {
      if (!query || query.length < 2 || !firmId) {
        setResults({ clients: [], cases: [], contacts: [], tasks: [] });
        return;
      }

      setLoading(true);
      try {
        const [clientsRes, casesRes, contactsRes, tasksRes] = await Promise.all([
          supabase.from('clients').select('id, full_name, email').eq('firm_id', firmId).ilike('full_name', `%${query}%`).limit(5),
          supabase.from('cases').select('id, case_title, case_number').eq('firm_id', firmId).or(`case_title.ilike.%${query}%,case_number.ilike.%${query}%`).limit(5),
          supabase.from('contacts').select('id, name, phone').eq('firm_id', firmId).ilike('name', `%${query}%`).limit(5),
          supabase.from('tasks').select('id, title, status').eq('firm_id', firmId).ilike('title', `%${query}%`).limit(5),
        ]);

        setResults({
          clients: clientsRes.data || [],
          cases: casesRes.data || [],
          contacts: contactsRes.data || [],
          tasks: tasksRes.data || [],
        });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchAllModules, 300);
    return () => clearTimeout(debounce);
  }, [query, firmId]);

  const handleSelect = (type: string, id: string) => {
    setOpen(false);
    setQuery('');
    if (type === 'client') navigate(`/clients/${id}`);
    if (type === 'case') navigate(`/cases/${id}`);
    if (type === 'contact') navigate(`/contacts`);
    if (type === 'task') navigate(`/tasks`);
  };

  const totalResults = results.clients.length + results.cases.length + results.contacts.length + results.tasks.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full max-w-2xl flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-primary transition-colors">
          <Search className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">Search clients, cases, contacts, tasks...</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Type to search..." 
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            )}
            {!loading && query && totalResults === 0 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            {results.clients.length > 0 && (
              <CommandGroup heading="Clients">
                {results.clients.map((client: any) => (
                  <CommandItem key={client.id} onSelect={() => handleSelect('client', client.id)}>
                    <Users className="w-4 h-4 mr-2 text-primary" />
                    <div>
                      <div className="font-medium">{client.full_name}</div>
                      <div className="text-xs text-muted-foreground">{client.email}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.cases.length > 0 && (
              <CommandGroup heading="Cases">
                {results.cases.map((caseItem: any) => (
                  <CommandItem key={caseItem.id} onSelect={() => handleSelect('case', caseItem.id)}>
                    <Briefcase className="w-4 h-4 mr-2 text-primary" />
                    <div>
                      <div className="font-medium">{caseItem.case_title}</div>
                      <div className="text-xs text-muted-foreground">{caseItem.case_number}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.contacts.length > 0 && (
              <CommandGroup heading="Contacts">
                {results.contacts.map((contact: any) => (
                  <CommandItem key={contact.id} onSelect={() => handleSelect('contact', contact.id)}>
                    <Users className="w-4 h-4 mr-2 text-primary" />
                    <div>
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-xs text-muted-foreground">{contact.phone}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.tasks.length > 0 && (
              <CommandGroup heading="Tasks">
                {results.tasks.map((task: any) => (
                  <CommandItem key={task.id} onSelect={() => handleSelect('task', task.id)}>
                    <CheckSquare className="w-4 h-4 mr-2 text-primary" />
                    <div className="font-medium">{task.title}</div>
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
