import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { staticDataQueryConfig } from "@/lib/queryConfig";

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("joined_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    ...staticDataQueryConfig,
  });
}
