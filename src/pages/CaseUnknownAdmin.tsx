import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search, AlertTriangle, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { FetchCaseDetailsDialog } from '@/components/cases/FetchCaseDetailsDialog';
import { resolveLegalkartSearchType } from '@/lib/legalkartSearchType';

interface UnknownCase {
  id: string;
  case_title: string;
  cnr_number: string | null;
  reference_number: string | null;
  registration_number: string | null;
  filing_number: string | null;
  petitioner: string | null;
  respondent: string | null;
  court_name: string | null;
  court_type: string | null;
  status: string | null;
  fetch_status: string | null;
  fetch_message: string | null;
  last_fetched_at: string | null;
  created_at: string;
}

const CaseUnknownAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [fetchDialogCaseId, setFetchDialogCaseId] = useState<string | null>(null);

  const { data: cases, isLoading } = useQuery({
    queryKey: ['case-unknown-admin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: tm } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!tm) throw new Error('No firm found');

      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title, cnr_number, reference_number, registration_number, filing_number, petitioner, respondent, court_name, court_type, status, fetch_status, fetch_message, last_fetched_at, created_at')
        .eq('firm_id', tm.firm_id)
        .eq('case_title', 'Case Unknown')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as UnknownCase[];
    },
  });

  const filtered = (cases || []).filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [c.reference_number, c.registration_number, c.cnr_number, c.petitioner, c.respondent, c.filing_number]
      .some(f => f?.toLowerCase().includes(q));
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: text });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Case Unknown — Admin View</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `${cases?.length || 0} cases with title "Case Unknown"`}
          </p>
        </div>
      </div>

      {/* Stats */}
      {!isLoading && cases && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{cases.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{cases.filter(c => c.cnr_number).length}</p>
            <p className="text-xs text-muted-foreground">With CNR</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{cases.filter(c => !c.cnr_number).length}</p>
            <p className="text-xs text-muted-foreground">No CNR</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{cases.filter(c => c.fetch_status === 'failed').length}</p>
            <p className="text-xs text-muted-foreground">Fetch Failed</p>
          </CardContent></Card>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by reference, registration, CNR, or party name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>CNR</TableHead>
                    <TableHead>Petitioner</TableHead>
                    <TableHead>Respondent</TableHead>
                    <TableHead>Court</TableHead>
                    <TableHead>Fetch Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
                        No matching cases found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((c, i) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {c.reference_number || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {c.registration_number ? (
                            <div className="flex items-center gap-1">
                              <span className="truncate max-w-[150px]">{c.registration_number}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(c.registration_number!)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {c.cnr_number ? (
                            <div className="flex items-center gap-1">
                              <span>{c.cnr_number}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(c.cnr_number!)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : <Badge variant="outline" className="text-xs">No CNR</Badge>}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-sm">{c.petitioner || '—'}</TableCell>
                        <TableCell className="max-w-[180px] truncate text-sm">{c.respondent || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.court_name || c.court_type || '—'}</TableCell>
                        <TableCell>
                          {c.fetch_status === 'failed' ? (
                            <Badge variant="error" className="text-xs">Failed</Badge>
                          ) : c.fetch_status === 'success' || c.fetch_status === 'completed' ? (
                            <Badge variant="success" className="text-xs">Success</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">{c.fetch_status || 'Not fetched'}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Fetch Case Details" onClick={() => setFetchDialogCaseId(c.id)}>
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="View Case" onClick={() => navigate(`/cases/${c.id}`)}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error details */}
      {!isLoading && filtered.some(c => c.fetch_message) && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Fetch Error Details</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {filtered.filter(c => c.fetch_message).map(c => (
              <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 text-sm">
                <span className="font-mono text-xs text-muted-foreground shrink-0">{c.reference_number || c.cnr_number || c.id.slice(0, 8)}</span>
                <span className="text-destructive">{c.fetch_message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {fetchDialogCaseId && (
        <FetchCaseDetailsDialog
          open={!!fetchDialogCaseId}
          onClose={() => setFetchDialogCaseId(null)}
          caseId={fetchDialogCaseId}
          onFetchTriggered={async () => {
            // After CNR is saved, trigger the actual fetch
            try {
              const { data: caseData } = await supabase
                .from('cases')
                .select('cnr_number, court_type, firm_id')
                .eq('id', fetchDialogCaseId)
                .single();

              if (caseData?.cnr_number) {
                const searchType = resolveLegalkartSearchType({
                  cnr: caseData.cnr_number,
                  courtType: caseData.court_type,
                  fallback: 'district_court',
                });

                toast({ title: 'Fetching case details...', description: `CNR: ${caseData.cnr_number}` });

                const { data, error } = await supabase.functions.invoke('legalkart-api', {
                  body: {
                    action: 'search',
                    cnr: caseData.cnr_number,
                    searchType,
                    caseId: fetchDialogCaseId,
                    firmId: caseData.firm_id,
                  },
                });

                if (error) throw error;
                toast({ title: 'Case fetched successfully', description: data?.case_title || 'Details updated' });
              }
            } catch (err: any) {
              console.error('Fetch error:', err);
              toast({ title: 'Fetch failed', description: err.message, variant: 'destructive' });
            } finally {
              setFetchDialogCaseId(null);
              queryClient.invalidateQueries({ queryKey: ['case-unknown-admin'] });
            }
          }}
        />
      )}
    </div>
  );
};

export default CaseUnknownAdmin;
