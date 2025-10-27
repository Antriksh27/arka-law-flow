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
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { firmId } = useAuth();
  const { data: casesData } = useCasesFetchStatus(1, 100);

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

      // Check the actual response data for success/failure
      const responseData = response.data;
      
      if (responseData?.status === 'failed' || responseData?.error) {
        toast({
          title: "Fetch failed",
          description: responseData?.error || responseData?.message || "Failed to fetch case details from API",
          variant: "destructive",
        });
      } else if (responseData?.status === 'success' || responseData?.data) {
        toast({
          title: "✓ Fetch successful",
          description: `Case details fetched successfully for ${cnrNumber}`,
        });
      } else {
        toast({
          title: "Fetch completed",
          description: "Case fetch processed. Check status for details.",
        });
      }

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
    if (!firmId) return;
    
    setIsFetchingCase(true);
    setShouldCancelFetch(false);

    try {
      // Fetch ALL unfetched cases from database, not just current page
      const { data: allUnfetchedCases, error } = await supabase
        .from("cases")
        .select("id, case_title, cnr_number, court_type, firm_id")
        .not("cnr_number", "is", null)
        .eq("firm_id", firmId)
        .or("fetch_status.is.null,fetch_status.eq.not_fetched")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!allUnfetchedCases || allUnfetchedCases.length === 0) {
        toast({ title: "No unfetched cases", description: "All cases have been fetched" });
        setIsFetchingCase(false);
        return;
      }

      let processed = 0;
      let succeeded = 0;
      let failed = 0;
      
      for (let i = 0; i < allUnfetchedCases.length; i++) {
        if (shouldCancelFetch) {
          toast({ 
            title: "Fetch cancelled", 
            description: `Stopped at ${i} of ${allUnfetchedCases.length}. Success: ${succeeded}, Failed: ${failed}` 
          });
          break;
        }

        const caseItem = allUnfetchedCases[i];
        toast({
          title: "Fetching cases...",
          description: `Processing ${i + 1} of ${allUnfetchedCases.length} | Success: ${succeeded} | Failed: ${failed}`,
        });

        try {
          const searchType = mapCourtTypeToSearchType(caseItem.court_type || "");
          const response = await supabase.functions.invoke("legalkart-api", {
            body: { action: "search", cnr: caseItem.cnr_number, searchType, caseId: caseItem.id, firmId: caseItem.firm_id },
          });
          
          // Check if the fetch actually succeeded
          if (response.data?.status === 'success' || response.data?.data) {
            succeeded++;
          } else {
            failed++;
          }
          processed++;
        } catch (error) {
          console.error(`Failed to fetch case ${caseItem.id}:`, error);
          failed++;
          processed++;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      queryClient.invalidateQueries({ queryKey: ["cases-fetch-status"] });
      if (!shouldCancelFetch) {
        toast({ 
          title: "✓ Bulk fetch complete", 
          description: `Processed ${processed} of ${allUnfetchedCases.length} cases. Success: ${succeeded}, Failed: ${failed}` 
        });
      }
    } catch (error: any) {
      toast({ 
        title: "Error fetching cases", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setIsFetchingCase(false);
      setShouldCancelFetch(false);
    }
  };

  const handleFetchAllFailed = async () => {
    if (!firmId) return;
    
    setIsFetchingCase(true);
    setShouldCancelFetch(false);

    try {
      // Fetch ALL failed cases from database (failed status AND no data)
      const { data: allFailedCases, error } = await supabase
        .from("cases")
        .select("id, case_title, cnr_number, court_type, firm_id")
        .not("cnr_number", "is", null)
        .eq("firm_id", firmId)
        .eq("fetch_status", "failed")
        .is("petitioner_advocate", null)
        .is("respondent_advocate", null)
        .is("fetched_data", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!allFailedCases || allFailedCases.length === 0) {
        toast({ title: "No failed cases", description: "No cases with failed status found" });
        setIsFetchingCase(false);
        return;
      }

      let processed = 0;
      let succeeded = 0;
      let failed = 0;
      
      for (let i = 0; i < allFailedCases.length; i++) {
        if (shouldCancelFetch) {
          toast({ 
            title: "Fetch cancelled", 
            description: `Stopped at ${i} of ${allFailedCases.length}. Success: ${succeeded}, Failed: ${failed}` 
          });
          break;
        }

        const caseItem = allFailedCases[i];
        toast({
          title: "Re-fetching failed cases...",
          description: `Processing ${i + 1} of ${allFailedCases.length} | Success: ${succeeded} | Failed: ${failed}`,
        });

        try {
          const searchType = mapCourtTypeToSearchType(caseItem.court_type || "");
          const response = await supabase.functions.invoke("legalkart-api", {
            body: { action: "search", cnr: caseItem.cnr_number, searchType, caseId: caseItem.id, firmId: caseItem.firm_id },
          });
          
          // Check if the fetch actually succeeded
          if (response.data?.status === 'success' || response.data?.data) {
            succeeded++;
          } else {
            failed++;
          }
          processed++;
        } catch (error) {
          console.error(`Failed to fetch case ${caseItem.id}:`, error);
          failed++;
          processed++;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      queryClient.invalidateQueries({ queryKey: ["cases-fetch-status"] });
      if (!shouldCancelFetch) {
        toast({ 
          title: "✓ Re-fetch complete", 
          description: `Processed ${processed} of ${allFailedCases.length} cases. Success: ${succeeded}, Failed: ${failed}` 
        });
      }
    } catch (error: any) {
      toast({ 
        title: "Error re-fetching cases", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setIsFetchingCase(false);
      setShouldCancelFetch(false);
    }
  };

  const handleCancelFetch = () => {
    setShouldCancelFetch(true);
  };

  const handleFetchSelected = async () => {
    const selectedCasesList = casesData?.cases.filter((c) => selectedCases.has(c.id)) || [];
    if (selectedCasesList.length === 0) return;

    setIsFetchingCase(true);
    setShouldCancelFetch(false);

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < selectedCasesList.length; i++) {
      if (shouldCancelFetch) {
        toast({ 
          title: "Fetch cancelled", 
          description: `Stopped at ${i} of ${selectedCasesList.length}. Success: ${succeeded}, Failed: ${failed}` 
        });
        break;
      }

      const caseItem = selectedCasesList[i];
      toast({
        title: "Fetching selected cases...",
        description: `Processing ${i + 1} of ${selectedCasesList.length} | Success: ${succeeded} | Failed: ${failed}`,
      });

      try {
        const searchType = mapCourtTypeToSearchType(caseItem.court_type || "");
        const response = await supabase.functions.invoke("legalkart-api", {
          body: { action: "search", cnr: caseItem.cnr_number, searchType, caseId: caseItem.id, firmId: caseItem.firm_id },
        });
        
        if (response.data?.status === 'success' || response.data?.data) {
          succeeded++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsFetchingCase(false);
    setShouldCancelFetch(false);
    setSelectedCases(new Set());
    queryClient.invalidateQueries({ queryKey: ["cases-fetch-status"] });
    if (!shouldCancelFetch) {
      toast({ 
        title: "✓ Selected cases fetch complete",
        description: `Success: ${succeeded}, Failed: ${failed}`
      });
    }
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
            {selectedCases.size > 0 && (
              <Button onClick={handleFetchSelected} disabled={isFetchingCase}>
                {isFetchingCase ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Fetch Selected ({selectedCases.size})
              </Button>
            )}
            <Button onClick={handleFetchAllUnfetched} disabled={isFetchingCase || !casesData?.counts.not_fetched}>
              {isFetchingCase ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Fetch All Unfetched ({casesData?.counts.not_fetched || 0})
            </Button>
            <Button onClick={handleFetchAllFailed} disabled={isFetchingCase || !casesData?.counts.failed} variant="outline">
              {isFetchingCase ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Re-fetch Failed ({casesData?.counts.failed || 0})
            </Button>
          </div>
        </div>

        <CasesFetchList 
          onFetchCase={handleFetchCase} 
          isFetching={isFetchingCase}
          selectedCases={selectedCases}
          onSelectedCasesChange={setSelectedCases}
        />
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
