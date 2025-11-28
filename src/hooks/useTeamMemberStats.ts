import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTeamMemberStats(memberId: string) {
  return useQuery({
    queryKey: ["team-member-stats", memberId],
    queryFn: async () => {
      if (!memberId) return null;

      // Get active (pending) case count for this team member
      const { data: casesData, error: casesError } = await supabase
        .from("cases")
        .select("id", { count: 'exact' })
        .or(`assigned_to.eq.${memberId},created_by.eq.${memberId}`)
        .eq('status', 'pending');

      if (casesError) throw casesError;

      // Get task count for this team member  
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("id", { count: 'exact' })
        .or(`assigned_to.eq.${memberId},created_by.eq.${memberId}`);

      if (tasksError) throw tasksError;

      // Get recent active (pending) cases for this team member
      const { data: recentCases, error: recentCasesError } = await supabase
        .from("cases")
        .select("id, case_title, status")
        .or(`assigned_to.eq.${memberId},created_by.eq.${memberId}`)
        .eq('status', 'pending')
        .order("updated_at", { ascending: false })
        .limit(3);

      if (recentCasesError) throw recentCasesError;

      return {
        caseCount: casesData?.length || 0,
        taskCount: tasksData?.length || 0,
        recentCases: recentCases || [],
      };
    },
    enabled: !!memberId,
  });
}