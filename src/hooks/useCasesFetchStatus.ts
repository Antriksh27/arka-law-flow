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

export const useCasesFetchStatus = (page: number = 1, pageSize: number = 100) => {
  return useQuery({
    queryKey: ["cases-fetch-status", page, pageSize],
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

      // Get total count and status counts across all cases
      const { count: totalCount } = await supabase
        .from("cases")
        .select("*", { count: 'exact', head: true })
        .not("cnr_number", "is", null)
        .eq("firm_id", teamMember.firm_id);

      // Get counts for each status - mutually exclusive
      const { count: notFetchedCount } = await supabase
        .from("cases")
        .select("*", { count: 'exact', head: true })
        .not("cnr_number", "is", null)
        .eq("firm_id", teamMember.firm_id)
        .or("fetch_status.is.null,fetch_status.eq.not_fetched");

      const { count: successCount } = await supabase
        .from("cases")
        .select("*", { count: 'exact', head: true })
        .not("cnr_number", "is", null)
        .eq("firm_id", teamMember.firm_id)
        .or("fetch_status.eq.success,fetch_status.eq.completed");

      const { count: failedCount } = await supabase
        .from("cases")
        .select("*", { count: 'exact', head: true })
        .not("cnr_number", "is", null)
        .eq("firm_id", teamMember.firm_id)
        .eq("fetch_status", "failed");

      const { count: pendingCount } = await supabase
        .from("cases")
        .select("*", { count: 'exact', head: true })
        .not("cnr_number", "is", null)
        .eq("firm_id", teamMember.firm_id)
        .eq("fetch_status", "pending");

      // Fetch paginated cases with CNR numbers
      const offset = (page - 1) * pageSize;
      const { data: cases, error: casesError } = await supabase
        .from("cases")
        .select("id, case_title, cnr_number, court_name, court_type, case_number, created_at, client_id, firm_id, fetch_status, last_fetched_at, fetch_message, fetched_data")
        .not("cnr_number", "is", null)
        .eq("firm_id", teamMember.firm_id)
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (casesError) throw casesError;

      if (!cases || cases.length === 0) {
        return {
          cases: [],
          counts: { not_fetched: 0, success: 0, failed: 0, pending: 0, total: totalCount || 0 },
          pagination: {
            page,
            pageSize,
            totalPages: Math.ceil((totalCount || 0) / pageSize),
            totalCount: totalCount || 0
          }
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
        else if (raw === 'success' || raw === 'completed') status = 'success';

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
        not_fetched: notFetchedCount || 0,
        success: successCount || 0,
        failed: failedCount || 0,
        pending: pendingCount || 0,
        total: totalCount || 0,
      };

      return { 
        cases: casesWithStatus, 
        counts,
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil((totalCount || 0) / pageSize),
          totalCount: totalCount || 0
        }
      };
    },
  });
};
