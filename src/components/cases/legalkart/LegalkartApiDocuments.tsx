import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, ExternalLink, Loader2 } from 'lucide-react';
import IframeViewer from '@/components/documents/IframeViewer';

interface LegalkartApiDocumentsProps {
  caseId: string;
}

export const LegalkartApiDocuments: React.FC<LegalkartApiDocumentsProps> = ({ caseId }) => {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // 1) Get CNR for this case
  const { data: caseRow } = useQuery({
    queryKey: ['case-cnr', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('cnr_number, court_type')
        .eq('id', caseId)
        .maybeSingle();
      if (error) throw error;
      return data as { cnr_number?: string | null; court_type?: string | null } | null;
    },
  });

  // 2) Call Legalkart edge function (includes JWT automatically)
  const { data: lkResult, isLoading, isError, refetch } = useQuery({
    queryKey: ['lk-api-docs', caseId, caseRow?.cnr_number],
    enabled: !!caseRow?.cnr_number,
    queryFn: async () => {
      const searchType = (caseRow?.court_type?.includes('supreme') && 'supreme_court')
        || (caseRow?.court_type?.includes('high') && 'high_court')
        || 'district_court';

      // Normalize CNR: remove hyphens and spaces
      const normalizedCnr = caseRow?.cnr_number?.replace(/[-\s]/g, '') || '';

      const { data, error } = await supabase.functions.invoke('legalkart-api', {
        body: { action: 'search', cnr: normalizedCnr, searchType, caseId },
      });
      if (error) throw error;
      return data as any;
    },
  });

  // 3) Extract documents array (handles both shapes)
  const documents = useMemo(() => {
    const raw = (lkResult as any)?.data ?? lkResult;
    const docs = raw?.data?.documents ?? raw?.documents ?? [];
    if (!Array.isArray(docs)) return [] as any[];
    return docs.map((d: any, idx: number) => ({
      url: d?.url || d?.document_url || d?.link || null,
      label: d?.label || d?.document_filed || d?.type || d?.name || `Document ${idx + 1}`,
      date: d?.date || d?.date_of_receiving || d?.order_date || null,
    })).filter((d: any) => !!d.url);
  }, [lkResult]);

  const openViewer = (url: string) => {
    setViewerUrl(url);
    setViewerOpen(true);
  };

  if (!caseRow?.cnr_number) {
    return (
      <div className="text-sm text-muted-foreground py-6 text-center">
        No CNR number on this case. Add CNR to fetch Legalkart documents.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Legalkart Documents (API)</h3>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Refreshing</>) : 'Refresh'}
        </Button>
      </div>

      {isError && (
        <div className="text-sm text-destructive">Failed to fetch from Legalkart API.</div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading from Legalkart…
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <FileText className="mx-auto h-8 w-8 mb-2" />
          No documents returned by Legalkart for the given CNR.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-40">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc, i) => (
                <TableRow key={`${doc.url}-${i}`}>
                  <TableCell className="font-medium">{doc.label}</TableCell>
                  <TableCell>{doc.date || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => openViewer(doc.url!)}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open
                      </Button>
                      <a
                        className="inline-flex items-center px-3 py-2 text-sm border rounded-md hover:bg-accent"
                        href={doc.url!}
                        target="_blank"
                        rel="noreferrer"
                      >
                        New tab
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <IframeViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        title="Legalkart Document"
        url={viewerUrl}
      />
    </div>
  );
};

export default LegalkartApiDocuments;
