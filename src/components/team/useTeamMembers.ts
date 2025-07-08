
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      console.log('Fetching team members...');
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("joined_at", { ascending: false });
      
      console.log('Team members query result:', { data, error });
      
      if (error) {
        console.error('Team members query error:', error);
        throw error;
      }
      return data;
    },
  });
}
