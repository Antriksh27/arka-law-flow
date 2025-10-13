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

      // Fetch all cases with CNR numbers - no limit
      const { data: cases, error: casesError } = await supabase
        .from("cases")
        .select("id, case_title, cnr_number, court_name, court_type, case_number, created_at, client_id, firm_id, fetch_status, last_fetched_at, fetch_message, fetched_data")
        .not("cnr_number", "is", null)
        .eq("firm_id", teamMember.firm_id)
        .order("created_at", { ascending: false });

      if (casesError) throw casesError;

      if (!cases || cases.length === 0) {
        return {
          cases: [],
          counts: { not_fetched: 0, success: 0, failed: 0, pending: 0, total: 0 },
        };
      }

      // Fetch client names separately to avoid join overhead
      const clientIds = [...new Set(cases.map(c => c.client_id).filter(Boolean))];
      const { data: clients } = await supabase
        .from("clients")
        .select("id, full_name")
        .in("id", clientIds);
      
      const clientMap = new Map(clients?.map(c => [c.id, c.full_name]) || []);

      // Derive status directly from cases to avoid heavy joins
      const casesWithStatus: CaseWithFetchStatus[] = cases.map((c: any) => {
        const raw = (c.fetch_status || '').toLowerCase();
        let status: CaseWithFetchStatus['fetch_status'] = 'not_fetched';
        if (raw === 'pending') status = 'pending';
        else if (raw === 'failed') status = 'failed';
        else if (raw === 'success' || raw === 'completed' || c.fetched_data || c.last_fetched_at) status = 'success';

        return {
          id: c.id,
          case_title: c.case_title,
          cnr_number: c.cnr_number,
          court_name: c.court_name,
          court_type: c.court_type,
          case_number: c.case_number,
          created_at: c.created_at,
          client_id: c.client_id,
          client_name: c.client_id ? (clientMap.get(c.client_id) || null) : null,
          firm_id: c.firm_id,
          fetch_status: status,
          last_fetched_at: c.last_fetched_at || null,
          error_message: c.fetch_message || null,
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
