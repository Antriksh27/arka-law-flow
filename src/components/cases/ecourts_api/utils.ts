import { supabase } from '@/integrations/supabase/client';

export async function fetchLegalkartCaseId(caseId: string): Promise<string | null> {
  try {
    console.log('Fetching Legalkart case ID for case:', caseId);
    
    // Get CNR from cases table
    const { data: caseRow, error: caseError } = await supabase
      .from('cases')
      .select('cnr_number')
      .eq('id', caseId)
      .maybeSingle();

    if (caseError) {
      console.error('Error fetching case:', caseError);
      return null;
    }

    const cnr: string | undefined = caseRow?.cnr_number;
    console.log('Found CNR:', cnr);
    
    if (!cnr) {
      console.log('No CNR found for case');
      return null;
    }

    // Normalize CNR (remove hyphens/spaces) to match stored format
    const normalizedCnr = cnr.replace(/[-\s]/g, '');
    console.log('Normalized CNR:', normalizedCnr);

    // Find legalkart_cases record by CNR
    const { data: lkCase, error: lkError } = await supabase
      .from('legalkart_cases')
      .select('id')
      .eq('cnr_number', normalizedCnr)
      .maybeSingle();

    if (lkError) {
      console.error('Error fetching legalkart case:', lkError);
      return null;
    }

    console.log('Found Legalkart case ID:', lkCase?.id);
    return lkCase?.id ?? null;
  } catch (error) {
    console.error('Exception in fetchLegalkartCaseId:', error);
    return null;
  }
}
