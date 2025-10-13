import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CaseWithFetchStatus {
  id: string;
  case_title: string;
  cnr_number: string;
  court_name: string | null;
  case_number: string | null;
  created_at: string;
  client_id: string | null;
  client_name: string | null;
  fetch_status: "not_fetched" | "success" | "failed" | "pending";
  last_fetched_at: string | null;
  error_message: string | null;
}

export interface StatusCounts {
  not_fetched: number;
  success: number;
  failed: number;
  pending: number;
  total: number;
}

export const useCasesFetchStatus = () => {
  return useQuery({
    queryKey: ["cases-fetch-status"],
    queryFn: async () => {
      // Get current user's firm
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: teamMember } = await supabase
        .from("team_members")
        .select("firm_id")
        .eq("user_id", user.id)
        .single();

      if (!teamMember) throw new Error("No firm found");

      // Fetch all cases with CNR numbers
      const { data: cases, error: casesError } = await supabase
        .from("cases")
        .select(`
          id,
          case_title,
          cnr_number,
          court_name,
          case_number,
          created_at,
          client_id,
          clients!inner(
            id,
            full_name
          )
        `)
        .not("cnr_number", "is", null)
        .eq("firm_id", teamMember.firm_id)
        .order("created_at", { ascending: false });

      if (casesError) throw casesError;

      if (!cases || cases.length === 0) {
        return {
          cases: [],
          counts: {
            not_fetched: 0,
            success: 0,
            failed: 0,
            pending: 0,
            total: 0,
          },
        };
      }

      // Get fetch history for all cases
      const caseIds = cases.map((c) => c.id);
      const { data: searches, error: searchesError } = await supabase
        .from("legalkart_case_searches")
        .select("case_id, created_at, error_message, response_data")
        .in("case_id", caseIds)
        .order("created_at", { ascending: false });

      if (searchesError) throw searchesError;

      // Build lookup map for latest search per case
      const latestSearchMap = new Map<string, any>();
      if (searches) {
        searches.forEach((search) => {
          if (!latestSearchMap.has(search.case_id)) {
            latestSearchMap.set(search.case_id, search);
          }
        });
      }

      // Build cases with fetch status
      const casesWithStatus: CaseWithFetchStatus[] = cases.map((caseItem: any) => {
        const latestSearch = latestSearchMap.get(caseItem.id);
        
        let fetchStatus: CaseWithFetchStatus["fetch_status"] = "not_fetched";
        let lastFetchedAt = null;
        let errorMessage = null;

        if (latestSearch) {
          lastFetchedAt = latestSearch.created_at;
          errorMessage = latestSearch.error_message;

          if (latestSearch.error_message) {
            fetchStatus = "failed";
          } else if (latestSearch.response_data) {
            fetchStatus = "success";
          }
        }

        return {
          id: caseItem.id,
          case_title: caseItem.case_title,
          cnr_number: caseItem.cnr_number,
          court_name: caseItem.court_name,
          case_number: caseItem.case_number,
          created_at: caseItem.created_at,
          client_id: caseItem.client_id,
          client_name: caseItem.clients?.full_name || null,
          fetch_status: fetchStatus,
          last_fetched_at: lastFetchedAt,
          error_message: errorMessage,
        };
      });

      // Calculate status counts
      const counts: StatusCounts = {
        not_fetched: casesWithStatus.filter((c) => c.fetch_status === "not_fetched").length,
        success: casesWithStatus.filter((c) => c.fetch_status === "success").length,
        failed: casesWithStatus.filter((c) => c.fetch_status === "failed").length,
        pending: casesWithStatus.filter((c) => c.fetch_status === "pending").length,
        total: casesWithStatus.length,
      };

      return {
        cases: casesWithStatus,
        counts,
      };
    },
  });
};
