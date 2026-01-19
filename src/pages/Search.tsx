import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search as SearchIcon, 
  Briefcase, 
  Users, 
  FileText, 
  Calendar,
  ArrowRight,
  Clock,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';

interface SearchResult {
  id: string;
  type: 'case' | 'client' | 'document';
  title: string;
  subtitle?: string;
  status?: string;
  date?: string;
  meta?: string;
}

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { firmId } = useAuth();
  const isMobile = useIsMobile();
  
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'cases' | 'clients' | 'documents'>('all');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query) {
        setSearchParams({ q: query });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, setSearchParams]);

  // Search query
  const { data: results, isLoading } = useQuery({
    queryKey: ['global-search', debouncedQuery, firmId],
    queryFn: async () => {
      if (!debouncedQuery || !firmId || debouncedQuery.length < 2) {
        return { cases: [], clients: [], documents: [] };
      }

      const searchTerm = `%${debouncedQuery}%`;

      const [casesRes, clientsRes, documentsRes] = await Promise.all([
        supabase
          .from('cases')
          .select('id, case_title, case_number, cnr_number, status, next_hearing_date, clients(full_name)')
          .eq('firm_id', firmId)
          .or(`case_title.ilike.${searchTerm},case_number.ilike.${searchTerm},cnr_number.ilike.${searchTerm}`)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('clients')
          .select('id, full_name, email, phone, company_name, status, created_at')
          .eq('firm_id', firmId)
          .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},company_name.ilike.${searchTerm}`)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('documents')
          .select('id, file_name, file_type, created_at, cases(case_title)')
          .eq('firm_id', firmId)
          .ilike('file_name', searchTerm)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      return {
        cases: casesRes.data || [],
        clients: clientsRes.data || [],
        documents: documentsRes.data || [],
      };
    },
    enabled: !!firmId && debouncedQuery.length >= 2,
  });

  const formatResults = (): SearchResult[] => {
    if (!results) return [];

    const allResults: SearchResult[] = [];

    // Add cases
    results.cases.forEach((c: any) => {
      allResults.push({
        id: c.id,
        type: 'case',
        title: c.case_title,
        subtitle: c.case_number || c.cnr_number,
        status: c.status,
        date: c.next_hearing_date ? format(new Date(c.next_hearing_date), 'MMM d, yyyy') : undefined,
        meta: (c.clients as any)?.full_name,
      });
    });

    // Add clients
    results.clients.forEach((c: any) => {
      allResults.push({
        id: c.id,
        type: 'client',
        title: c.full_name,
        subtitle: c.email || c.phone,
        status: c.status,
        meta: c.company_name,
      });
    });

    // Add documents
    results.documents.forEach((d: any) => {
      allResults.push({
        id: d.id,
        type: 'document',
        title: d.file_name,
        subtitle: d.file_type,
        date: d.created_at ? format(new Date(d.created_at), 'MMM d, yyyy') : undefined,
        meta: (d.cases as any)?.case_title,
      });
    });

    return allResults;
  };

  const allResults = formatResults();
  const filteredResults = activeTab === 'all' 
    ? allResults 
    : allResults.filter(r => r.type === activeTab.slice(0, -1) as 'case' | 'client' | 'document');

  const counts = {
    all: allResults.length,
    cases: allResults.filter(r => r.type === 'case').length,
    clients: allResults.filter(r => r.type === 'client').length,
    documents: allResults.filter(r => r.type === 'document').length,
  };

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'case':
        navigate(`/cases/${result.id}`);
        break;
      case 'client':
        navigate(`/clients/${result.id}`);
        break;
      case 'document':
        navigate(`/documents?id=${result.id}`);
        break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'case':
        return <Briefcase className="w-5 h-5" />;
      case 'client':
        return <Users className="w-5 h-5" />;
      case 'document':
        return <FileText className="w-5 h-5" />;
      default:
        return <SearchIcon className="w-5 h-5" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'case':
        return 'bg-blue-100 text-blue-600';
      case 'client':
        return 'bg-purple-100 text-purple-600';
      case 'document':
        return 'bg-amber-100 text-amber-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-slate-100 text-slate-600';
    switch (status.toLowerCase()) {
      case 'active':
      case 'pending':
        return 'bg-green-100 text-green-700';
      case 'closed':
      case 'inactive':
        return 'bg-slate-100 text-slate-600';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {isMobile && <MobileHeader title="Search" showBack backTo="/" />}
      
      <div className={`${isMobile ? 'px-4 py-4' : 'max-w-4xl mx-auto px-6 py-8'}`}>
        {/* Search Input */}
        <div className="relative mb-6">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases, clients, documents..."
            className="pl-12 pr-4 py-3 text-base rounded-xl border-border"
            autoFocus
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
          <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-muted rounded-xl">
            <TabsTrigger value="all" className="rounded-lg py-2 text-sm">
              All {counts.all > 0 && <Badge variant="outline" className="ml-1.5 text-xs">{counts.all}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="cases" className="rounded-lg py-2 text-sm">
              Cases {counts.cases > 0 && <Badge variant="outline" className="ml-1.5 text-xs">{counts.cases}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="clients" className="rounded-lg py-2 text-sm">
              Clients {counts.clients > 0 && <Badge variant="outline" className="ml-1.5 text-xs">{counts.clients}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="documents" className="rounded-lg py-2 text-sm">
              Docs {counts.documents > 0 && <Badge variant="outline" className="ml-1.5 text-xs">{counts.documents}</Badge>}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Results */}
        <div className="space-y-2">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : debouncedQuery.length < 2 ? (
            // Prompt to search
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                <SearchIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Search your workspace</h3>
              <p className="text-sm text-muted-foreground">
                Enter at least 2 characters to search cases, clients, and documents
              </p>
            </div>
          ) : filteredResults.length === 0 ? (
            // No results
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                <SearchIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search terms or filters
              </p>
            </div>
          ) : (
            // Results list
            filteredResults.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/20 hover:shadow-sm transition-all text-left group"
              >
                <div className={`p-3 rounded-xl ${getIconBg(result.type)}`}>
                  {getIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground truncate">{result.title}</h4>
                    {result.status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(result.status)}`}>
                        {result.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {result.subtitle && <span className="truncate">{result.subtitle}</span>}
                    {result.meta && (
                      <>
                        <span>•</span>
                        <span className="truncate flex items-center gap-1">
                          {result.type === 'case' ? <Users className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                          {result.meta}
                        </span>
                      </>
                    )}
                    {result.date && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {result.date}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
