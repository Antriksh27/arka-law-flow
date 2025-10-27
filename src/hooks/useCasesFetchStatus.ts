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

export const useCasesFetchStatus = (page: number = 1, pageSize: number = 100, statusFilter: 'all' | 'not_fetched' | 'success' | 'failed' | 'pending' = 'all') => {
  return useQuery({
    queryKey: ["cases-fetch-status", page, pageSize, statusFilter],
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

      // Get counts for each status - mutually exclusive and data-first
      // Not fetched: never attempted OR no data exists
      const { count: notFetchedCount } = await supabase
        .from("cases")
        .select("id", { count: 'exact', head: true })
        .not("cnr_number", "is", null)
        .eq("firm_id", teamMember.firm_id)
        .is("last_fetched_at", null)
        .is("petitioner_advocate", null)
        .is("respondent_advocate", null)
        .is("fetched_data", null)
        .or("fetch_status.is.null,fetch_status.eq.not_fetched");

      // Success: has any fetched data OR marked as success/completed
      const { count: successCount } = await supabase
        .from("cases")
        .select("id", { count: 'exact', head: true })
        .not("cnr_number", "is", null)
        .eq("firm_id", teamMember.firm_id)
        .or("fetch_status.eq.success,fetch_status.eq.completed,petitioner_advocate.not.is.null,respondent_advocate.not.is.null,fetched_data.not.is.null");

      // Failed: marked as failed AND no data exists
      const { count: failedCount } = await supabase
        .from("cases")
        .select("id", { count: 'exact', head: true })
        .not("cnr_number", "is", null)
        .eq("firm_id", teamMember.firm_id)
        .eq("fetch_status", "failed")
        .is("petitioner_advocate", null)
        .is("respondent_advocate", null)
        .is("fetched_data", null);

      const { count: pendingCount } = await supabase
        .from("cases")
        .select("id", { count: 'exact', head: true })
        .not("cnr_number", "is", null)
        .eq("firm_id", teamMember.firm_id)
        .eq("fetch_status", "pending");

      // Fetch paginated cases with optional server-side status filtering
      const offset = (page - 1) * pageSize;

      // Compute filtered total when a status filter is applied
      let filteredTotal = totalCount || 0;
      if (statusFilter !== 'all') {
        let countQuery = supabase
          .from("cases")
          .select("id", { count: 'exact', head: true })
          .not("cnr_number", "is", null)
          .eq("firm_id", teamMember.firm_id);
        if (statusFilter === 'not_fetched') {
          countQuery = countQuery
            .is("last_fetched_at", null)
            .is("petitioner_advocate", null)
            .is("respondent_advocate", null)
            .is("fetched_data", null)
            .or("fetch_status.is.null,fetch_status.eq.not_fetched");
        } else if (statusFilter === 'success') {
          countQuery = countQuery
            .or("fetch_status.eq.success,fetch_status.eq.completed,petitioner_advocate.not.is.null,respondent_advocate.not.is.null,fetched_data.not.is.null");
        } else if (statusFilter === 'failed') {
          countQuery = countQuery
            .eq("fetch_status", "failed")
            .is("petitioner_advocate", null)
            .is("respondent_advocate", null)
            .is("fetched_data", null);
        } else if (statusFilter === 'pending') {
          countQuery = countQuery.eq("fetch_status", "pending");
        }
        const { count: fCount } = await countQuery;
        filteredTotal = fCount || 0;
      }

      // Build cases query
      let casesQuery = supabase
        .from("cases")
        .select("id, case_title, cnr_number, court_name, court_type, case_number, created_at, client_id, firm_id, fetch_status, last_fetched_at, fetch_message, fetched_data, petitioner_advocate, respondent_advocate")
        .not("cnr_number", "is", null)
        .eq("firm_id", teamMember.firm_id);

      if (statusFilter === 'not_fetched') {
        casesQuery = casesQuery
          .is("last_fetched_at", null)
          .is("petitioner_advocate", null)
          .is("respondent_advocate", null)
          .is("fetched_data", null)
          .or("fetch_status.is.null,fetch_status.eq.not_fetched");
      } else if (statusFilter === 'success') {
        casesQuery = casesQuery
          .or("fetch_status.eq.success,fetch_status.eq.completed,petitioner_advocate.not.is.null,respondent_advocate.not.is.null,fetched_data.not.is.null");
      } else if (statusFilter === 'failed') {
        casesQuery = casesQuery
          .eq("fetch_status", "failed")
          .is("petitioner_advocate", null)
          .is("respondent_advocate", null)
          .is("fetched_data", null);
      } else if (statusFilter === 'pending') {
        casesQuery = casesQuery.eq("fetch_status", "pending");
      }

      const { data: cases, error: casesError } = await casesQuery
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (casesError) throw casesError;

      if (!cases || cases.length === 0) {
        return {
          cases: [],
          counts: { not_fetched: notFetchedCount || 0, success: successCount || 0, failed: failedCount || 0, pending: pendingCount || 0, total: totalCount || 0 },
          pagination: {
            page,
            pageSize,
            totalPages: Math.ceil((filteredTotal || 0) / pageSize),
            totalCount: filteredTotal || 0
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

      // Derive status directly from cases - data presence wins
      const casesWithStatus: CaseWithFetchStatus[] = cases.map((c: any) => {
        const raw = (c.fetch_status || '').toLowerCase();
        const hasData = Boolean(c.petitioner_advocate || c.respondent_advocate || c.fetched_data);
        let status: CaseWithFetchStatus['fetch_status'] = 'not_fetched';
        
        // Priority order: pending > success (data-first) > failed > not_fetched
        if (raw === 'pending') {
          status = 'pending';
        } else if (hasData || raw === 'success' || raw === 'completed') {
          // Data presence always means success, even if status says failed
          status = 'success';
        } else if (raw === 'failed') {
          // Only failed if explicitly marked AND no data
          status = 'failed';
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
          totalPages: Math.ceil((filteredTotal || 0) / pageSize),
          totalCount: filteredTotal || 0
        }
      };
    },
  });
};
