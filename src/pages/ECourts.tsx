import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Eye, Download, Loader2, FileText, Calendar, Building2 } from "lucide-react";
import { format } from "date-fns";
import { LegalkartCaseSearch } from "@/components/cases/LegalkartCaseSearch";
import { CasesUploadSection } from "@/components/ecourts/CasesUploadSection";
import { CasesFetchList } from "@/components/ecourts/CasesFetchList";
import { useCasesFetchStatus } from "@/hooks/useCasesFetchStatus";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const ECourts = () => {
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [showJsonDialog, setShowJsonDialog] = useState(false);
  const [isFetchingCase, setIsFetchingCase] = useState(false);
  const [shouldCancelFetch, setShouldCancelFetch] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { firmId } = useAuth();
  const { data: casesData } = useCasesFetchStatus();

  const { data: legalkartCases, refetch } = useQuery({
    queryKey: ['legalkart-case-searches', firmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legalkart_case_searches')
        .select(`*, cases (id, case_title, case_number, court_name)`)
        .eq('firm_id', firmId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!firmId,
  });

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy hh:mm a');
    } catch {
      return '-';
    }
  };

  const mapCourtTypeToSearchType = (courtType: string): string => {
    const courtLower = courtType.toLowerCase();
    if (courtLower.includes("high")) return "high_court";
    if (courtLower.includes("district")) return "district_court";
    if (courtLower.includes("supreme")) return "supreme_court";
    return "high_court"; // fallback
  };

  const handleFetchCase = async (caseId: string, cnrNumber: string, courtType: string) => {
    setIsFetchingCase(true);
    const searchType = mapCourtTypeToSearchType(courtType);

    try {
      const response = await supabase.functions.invoke("legalkart-api", {
        body: { action: "search", cnr: cnrNumber, searchType, caseId },
      });

      if (response.error) throw response.error;

      toast({
        title: "Fetch successful",
        description: `Case details fetched successfully`,
      });

      queryClient.invalidateQueries({ queryKey: ["cases-fetch-status"] });
    } catch (error: any) {
      toast({
        title: "Fetch failed",
        description: error.message || "Failed to fetch case details",
        variant: "destructive",
      });
    } finally {
      setIsFetchingCase(false);
    }
  };

  const handleFetchAllUnfetched = async () => {
    const unfetchedCases = casesData?.cases.filter((c) => c.fetch_status === "not_fetched") || [];
    if (unfetchedCases.length === 0) return;

    setIsFetchingCase(true);
    setShouldCancelFetch(false);

    for (let i = 0; i < unfetchedCases.length; i++) {
      if (shouldCancelFetch) {
        toast({ title: "Fetch cancelled", description: `Stopped at ${i} of ${unfetchedCases.length}` });
        break;
      }

      const caseItem = unfetchedCases[i];
      toast({
        title: "Fetching cases...",
        description: `Processing ${i + 1} of ${unfetchedCases.length}`,
      });

      try {
        const searchType = mapCourtTypeToSearchType(caseItem.court_type || "");
        await supabase.functions.invoke("legalkart-api", {
          body: { action: "search", cnr: caseItem.cnr_number, searchType, caseId: caseItem.id, firmId: caseItem.firm_id },
        });
      } catch (error) {}

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsFetchingCase(false);
    setShouldCancelFetch(false);
    queryClient.invalidateQueries({ queryKey: ["cases-fetch-status"] });
    if (!shouldCancelFetch) {
      toast({ title: "Bulk fetch complete" });
    }
  };

  const handleCancelFetch = () => {
    setShouldCancelFetch(true);
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">eCourts Integration</h1>
        <p className="text-muted-foreground">Upload cases in bulk and fetch details from eCourts/LegalKart API.</p>
      </div>

      <CasesUploadSection onUploadComplete={() => queryClient.invalidateQueries({ queryKey: ["cases-fetch-status"] })} />

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Manage Case Fetches</h2>
          <div className="flex gap-2">
            {isFetchingCase && (
              <Button onClick={handleCancelFetch} variant="destructive" disabled={shouldCancelFetch}>
                {shouldCancelFetch ? "Cancelling..." : "Stop Fetch"}
              </Button>
            )}
            <Button onClick={handleFetchAllUnfetched} disabled={isFetchingCase || !casesData?.counts.not_fetched}>
              {isFetchingCase ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Fetch All Unfetched ({casesData?.counts.not_fetched || 0})
            </Button>
          </div>
        </div>

        <CasesFetchList onFetchCase={handleFetchCase} isFetching={isFetchingCase} />
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Manual Case Search</h2>
        <LegalkartCaseSearch onCaseDataFetched={() => { refetch(); queryClient.invalidateQueries({ queryKey: ["cases-fetch-status"] }); }} />
      </div>

      <Separator />

      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Search History</h2>
        {legalkartCases && legalkartCases.length > 0 ? (
          <div className="grid gap-4">
            {legalkartCases.map((item: any) => (
              <Card key={item.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{item.cases?.case_title || 'Case Search'}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><FileText className="h-4 w-4" />CNR: {item.cnr_number}</span>
                        {item.cases?.case_number && <span>Case No: {item.cases.case_number}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <Badge variant="outline" className="capitalize">{item.search_type?.replace('_', ' ')}</Badge>
                      <Badge variant={item.status === 'success' ? 'default' : 'error'} className="capitalize">{item.status}</Badge>
                      {item.cases?.court_name && <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{item.cases.court_name}</span>}
                    </div>
                    {item.error_message && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{item.error_message}</div>}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Searched: {formatDate(item.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {item.response_data && <Button variant="outline" size="sm" onClick={() => { setSelectedCase(item); setShowJsonDialog(true); }}><Eye className="h-4 w-4 mr-2" />View Response</Button>}
                    {item.case_id && <Button size="sm" onClick={() => navigate(`/cases/${item.case_id}`)}><FileText className="h-4 w-4 mr-2" />View Case</Button>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No search history yet</div>
        )}
      </Card>

      <Dialog open={showJsonDialog} onOpenChange={setShowJsonDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader><DialogTitle>Search Response Data</DialogTitle></DialogHeader>
          <div className="overflow-auto bg-muted/50 rounded-lg p-4">
            <pre className="text-xs">{JSON.stringify(selectedCase?.response_data, null, 2)}</pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ECourts;
