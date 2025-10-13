import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CaseWithFetchStatus {
  id: string;
  case_title: string;
  cnr_number: string;
  court_name: string | null;
  court_type: string | null;
  case_number: string | null;
  created_at: string;
  client_id: string | null;
  client_name: string | null;
  firm_id: string;
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

      const { data: teamMember, error: teamError } = await supabase
        .from("team_members")
        .select("firm_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (teamError) throw teamError;
      if (!teamMember) throw new Error("No firm found");

      // Limit to 100 cases to prevent timeout - add pagination if needed
      const { data: cases, error: casesError } = await supabase
        .from("cases")
        .select("id, case_title, cnr_number, court_name, court_type, case_number, created_at, client_id, firm_id, clients(full_name)")
        .not("cnr_number", "is", null)
        .eq("firm_id", teamMember.firm_id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (casesError) throw casesError;

      if (!cases || cases.length === 0) {
        return {
          cases: [],
          counts: { not_fetched: 0, success: 0, failed: 0, pending: 0, total: 0 },
        };
      }

      // Fetch latest search for each case efficiently
      const { data: searches } = await supabase
        .from("legalkart_case_searches")
        .select("case_id, created_at, error_message, response_data")
        .in("case_id", cases.map(c => c.id))
        .order("created_at", { ascending: false });

      // Map latest search per case
      const latestSearchMap = new Map();
      searches?.forEach(s => {
        if (!latestSearchMap.has(s.case_id)) latestSearchMap.set(s.case_id, s);
      });

      const casesWithStatus: CaseWithFetchStatus[] = cases.map((c: any) => {
        const search = latestSearchMap.get(c.id);
        let status: CaseWithFetchStatus["fetch_status"] = "not_fetched";
        
        if (search) {
          if (search.error_message) status = "failed";
          else if (search.response_data) status = "success";
        }

        return {
          id: c.id,
          case_title: c.case_title,
          cnr_number: c.cnr_number,
          court_name: c.court_name,
          court_type: c.court_type,
          case_number: c.case_number,
          created_at: c.created_at,
          client_id: c.client_id,
          client_name: c.clients?.full_name || null,
          firm_id: c.firm_id,
          fetch_status: status,
          last_fetched_at: search?.created_at || null,
          error_message: search?.error_message || null,
        };
      });

      const counts: StatusCounts = {
        not_fetched: casesWithStatus.filter(c => c.fetch_status === "not_fetched").length,
        success: casesWithStatus.filter(c => c.fetch_status === "success").length,
        failed: casesWithStatus.filter(c => c.fetch_status === "failed").length,
        pending: casesWithStatus.filter(c => c.fetch_status === "pending").length,
        total: casesWithStatus.length,
      };

      return { cases: casesWithStatus, counts };
    },
  });
};
