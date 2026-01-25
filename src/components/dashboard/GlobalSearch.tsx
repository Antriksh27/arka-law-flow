import { useState, useEffect, useRef } from 'react';
import { Search, FileText, Users, Briefcase, CheckSquare, Loader2, X, File } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { bg, border, text } from '@/lib/colors';

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({ clients: [], cases: [], contacts: [], tasks: [], documents: [] });
  const navigate = useNavigate();
  const { firmId } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const searchAllModules = async () => {
      if (!query || query.length < 2 || !firmId) {
        setResults({ clients: [], cases: [], contacts: [], tasks: [], documents: [] });
        if (query.length === 0) setOpen(false);
        return;
      }

      setLoading(true);
      setOpen(true);
      
      try {
        const searchTerm = `%${query}%`;
        const [clientsRes, casesRes, contactsRes, tasksRes, documentsRes] = await Promise.all([
          supabase
            .from('clients')
            .select('id, full_name, email, phone')
            .eq('firm_id', firmId)
            .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
            .limit(5),
          supabase
            .from('cases')
            .select('id, case_title, case_number, cnr_number, registration_number, filing_number, reference_number, petitioner, respondent')
            .eq('firm_id', firmId)
            .or(`case_title.ilike.${searchTerm},case_number.ilike.${searchTerm},cnr_number.ilike.${searchTerm},registration_number.ilike.${searchTerm},filing_number.ilike.${searchTerm},reference_number.ilike.${searchTerm},petitioner.ilike.${searchTerm},respondent.ilike.${searchTerm}`)
            .limit(5),
          supabase
            .from('contacts')
            .select('id, name, phone, email')
            .eq('firm_id', firmId)
            .or(`name.ilike.${searchTerm},phone.ilike.${searchTerm},email.ilike.${searchTerm}`)
            .limit(5),
          supabase
            .from('tasks')
            .select('id, title, status')
            .eq('firm_id', firmId)
            .ilike('title', searchTerm)
            .limit(5),
          supabase
            .from('documents')
            .select('id, file_name, document_type, case_id')
            .eq('firm_id', firmId)
            .or(`file_name.ilike.${searchTerm},document_type.ilike.${searchTerm}`)
            .limit(5),
        ]);

        setResults({
          clients: clientsRes.data || [],
          cases: casesRes.data || [],
          contacts: contactsRes.data || [],
          tasks: tasksRes.data || [],
          documents: documentsRes.data || [],
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

  const handleSelect = (type: string, id: string, caseId?: string) => {
    setOpen(false);
    setQuery('');
    if (type === 'client') navigate(`/client-info/${id}`);
    if (type === 'case') navigate(`/cases/${id}`);
    if (type === 'contact') navigate(`/contacts`);
    if (type === 'task') navigate(`/tasks`);
    if (type === 'document') {
      if (caseId) {
        navigate(`/cases/${caseId}?tab=documents`);
      } else {
        navigate(`/documents`);
      }
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults({ clients: [], cases: [], contacts: [], tasks: [], documents: [] });
    setOpen(false);
  };

  const totalResults = results.clients.length + results.cases.length + results.contacts.length + results.tasks.length + results.documents.length;

  return (
    <div className="w-full max-w-2xl relative">
      <div className="relative">
        <Search className={`absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 ${text.light}`} />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search clients, cases, contacts, tasks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className={`w-full pl-10 md:pl-12 pr-10 py-2.5 md:py-3 bg-white ${border.default} rounded-xl shadow-sm hover:border-primary focus:border-primary transition-colors text-sm md:text-base`}
        />
        {query && (
          <button
            onClick={clearSearch}
            className={`absolute right-3 md:right-4 top-1/2 -translate-y-1/2 ${text.light} hover:${text.secondary}`}
          >
            <X className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        )}
        {loading && (
          <div className="absolute right-10 md:right-12 top-1/2 -translate-y-1/2">
            <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin text-primary" />
          </div>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className={`absolute top-full left-0 right-0 mt-2 bg-white ${border.default} rounded-xl shadow-lg z-50 max-h-[60vh] md:max-h-96 overflow-y-auto`}>
          {!loading && totalResults === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          )}

          {results.clients.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                Clients
              </div>
              {results.clients.map((client: any) => (
                <button
                  key={client.id}
                  onClick={() => handleSelect('client', client.id)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg ${bg.hover} text-left transition-colors`}
                >
                  <Users className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{client.full_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{client.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.cases.length > 0 && (
            <div className={`p-2 border-t ${border.light}`}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                Cases
              </div>
              {results.cases.map((caseItem: any) => {
                const q = query.toLowerCase();
                let matchedField = caseItem.case_number || '';
                if (caseItem.cnr_number?.toLowerCase().includes(q)) {
                  matchedField = `CNR: ${caseItem.cnr_number}`;
                } else if (caseItem.registration_number?.toLowerCase().includes(q)) {
                  matchedField = `Reg: ${caseItem.registration_number}`;
                } else if (caseItem.filing_number?.toLowerCase().includes(q)) {
                  matchedField = `Filing: ${caseItem.filing_number}`;
                } else if (caseItem.reference_number?.toLowerCase().includes(q)) {
                  matchedField = `Ref: ${caseItem.reference_number}`;
                } else if (caseItem.petitioner?.toLowerCase().includes(q)) {
                  matchedField = `Petitioner: ${caseItem.petitioner}`;
                } else if (caseItem.respondent?.toLowerCase().includes(q)) {
                  matchedField = `Respondent: ${caseItem.respondent}`;
                }

                return (
                  <button
                    key={caseItem.id}
                    onClick={() => handleSelect('case', caseItem.id)}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg ${bg.hover} text-left transition-colors`}
                  >
                    <Briefcase className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{caseItem.case_title}</div>
                      <div className="text-xs text-muted-foreground truncate">{matchedField}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {results.contacts.length > 0 && (
            <div className={`p-2 border-t ${border.light}`}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                Contacts
              </div>
              {results.contacts.map((contact: any) => (
                <button
                  key={contact.id}
                  onClick={() => handleSelect('contact', contact.id)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg ${bg.hover} text-left transition-colors`}
                >
                  <Users className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{contact.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{contact.phone}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.tasks.length > 0 && (
            <div className={`p-2 border-t ${border.light}`}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                Tasks
              </div>
              {results.tasks.map((task: any) => (
                <button
                  key={task.id}
                  onClick={() => handleSelect('task', task.id)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg ${bg.hover} text-left transition-colors`}
                >
                  <CheckSquare className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{task.title}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.documents.length > 0 && (
            <div className={`p-2 border-t ${border.light}`}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                Documents
              </div>
              {results.documents.map((doc: any) => (
                <button
                  key={doc.id}
                  onClick={() => handleSelect('document', doc.id, doc.case_id)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg ${bg.hover} text-left transition-colors`}
                >
                  <File className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{doc.file_name}</div>
                    {doc.document_type && (
                      <div className="text-xs text-muted-foreground truncate">{doc.document_type}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
