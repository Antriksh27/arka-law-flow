import { supabase } from '@/integrations/supabase/client';

export async function fetchLegalkartCaseId(caseId: string): Promise<string | null> {
  try {
    // Try via direct case link
    const { data: byCase } = await (supabase as any)
      .from('legalkart_cases')
      .select('id')
      .eq('case_id', caseId)
      .maybeSingle();
    if (byCase?.id) return byCase.id as string;

    // Fallback: resolve by CNR number on cases table
    const { data: caseRow } = await (supabase as any)
      .from('cases')
      .select('cnr_number')
      .eq('id', caseId)
      .maybeSingle();

    const cnr: string | undefined = caseRow?.cnr_number;
    if (!cnr) return null;

    const { data: byCnr } = await (supabase as any)
      .from('legalkart_cases')
      .select('id')
      .eq('cnr_number', cnr)
      .maybeSingle();

    return (byCnr?.id as string) ?? null;
  } catch {
    return null;
  }
}
