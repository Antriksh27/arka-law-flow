
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFirms() {
  return useQuery({
    queryKey: ["firms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("law_firms").select("*");
      if (error) {
        console.error("Error fetching firms:", error);
        throw error;
      }
      return data;
    },
  });
}
