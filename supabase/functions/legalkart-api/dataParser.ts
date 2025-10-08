/**
 * AI Data Parser for E-Courts API
 * Cleans and structures raw case JSON data into standardized format
 */

export interface ParsedCase {
  filingNumber: string | null;
  registrationNumber: string | null;
  filingDate: string | null;
  registrationDate: string | null;
  cnrNumber: string | null;
  stageOfCase: string | null;
  nextHearingDate: string | null;
  coram: string | null;
  benchType: string | null;
  judicialBranch: string | null;
  state: string | null;
  district: string | null;
  category: string | null;
  subCategory: string | null;
}

export interface ParsedParty {
  name: string;
  advocate: string | null;
}

export interface ParsedIADetail {
  iaNumber: string | null;
  party: string | null;
  dateOfFiling: string | null;
  nextDate: string | null;
  iaStatus: string | null;
}

export interface ParsedCaseData {
  case: ParsedCase;
  petitioners: ParsedParty[];
  respondents: ParsedParty[];
  iaDetails: ParsedIADetail[];
}

/**
 * Parse date from various formats to ISO YYYY-MM-DD
 * Handles: DD-MM-YYYY, DD/MM/YYYY, "7th November 2025"
 */
export function parseDate(dateStr: string | null | undefined): string | null {
  if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return null;
  
  try {
    const cleanDate = dateStr.toString().trim();
    
    // Handle DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(cleanDate)) {
      const [day, month, year] = cleanDate.split('-');
      return `${year}-${month}-${day}`;
    }
    
    // Handle DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDate)) {
      const [day, month, year] = cleanDate.split('/');
      return `${year}-${month}-${day}`;
    }
    
    // Handle "7th November 2025" or "07th November 2025"
    const monthMap: { [key: string]: string } = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04',
      'may': '05', 'june': '06', 'july': '07', 'august': '08',
      'september': '09', 'october': '10', 'november': '11', 'december': '12'
    };
    
    const ordinalRegex = /(\d{1,2})(st|nd|rd|th)\s+(\w+)\s+(\d{4})/i;
    const match = cleanDate.match(ordinalRegex);
    
    if (match) {
      const day = match[1].padStart(2, '0');
      const monthName = match[3].toLowerCase();
      const year = match[4];
      const month = monthMap[monthName];
      
      if (month) {
        return `${year}-${month}-${day}`;
      }
    }
    
    // Fallback: try ISO format or parse as Date
    if (cleanDate.includes('T') || /^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return new Date(cleanDate).toISOString().split('T')[0];
    }
    
    return null;
  } catch (error) {
    console.error('Date parsing error:', error, 'for input:', dateStr);
    return null;
  }
}

/**
 * Parse petitioner/respondent string into structured array
 * Format: "1) NAME Advocate- ADVOCATE_NAME 2) NAME2 Advocate- ADVOCATE_NAME2"
 */
export function parsePartyList(partyStr: string | null | undefined): ParsedParty[] {
  if (!partyStr) return [];
  
  try {
    // Split by number patterns like "1)", "2)", etc.
    const entries = partyStr.split(/(?=\d+\))/).filter(e => e.trim());
    
    return entries.map(entry => {
      // Remove leading number and parenthesis
      let cleaned = entry.replace(/^\d+\)\s*/, '').trim();
      
      // Split by "Advocate-" or "Advocate -" (case insensitive)
      const advocatePattern = /Advocate\s*-\s*/i;
      const parts = cleaned.split(advocatePattern);
      
      const name = parts[0]?.trim() || '';
      const advocate = parts[1]?.trim() || null;
      
      return {
        name,
        advocate
      };
    }).filter(party => party.name); // Only return entries with names
  } catch (error) {
    console.error('Party parsing error:', error, 'for input:', partyStr);
    return [];
  }
}

/**
 * Parse IA Details from API response
 */
export function parseIADetails(iaData: any): ParsedIADetail[] {
  if (!iaData) return [];
  
  // Handle single object or array
  const iaArray = Array.isArray(iaData) ? iaData : [iaData];
  
  return iaArray.map(ia => ({
    iaNumber: ia.ia_number || null,
    party: ia.party || null,
    dateOfFiling: parseDate(ia.date_of_filing),
    nextDate: parseDate(ia.next_date),
    iaStatus: ia.ia_status || ia.status || 'Pending'
  })).filter(ia => ia.iaNumber || ia.party); // Filter out completely empty entries
}

/**
 * Main parser function
 * Transforms raw E-Courts API JSON into standardized structure
 */
export function parseECourtsData(rawData: any): ParsedCaseData {
  console.log('🤖 AI Data Parser: Starting parse...');
  
  // Extract nested data structures
  const caseInfo = rawData.case_info || rawData.data?.case_info || {};
  const caseStatus = rawData.case_status || rawData.data?.case_status || {};
  const categoryInfo = rawData.category_info || rawData.data?.category_info || {};
  const iaDetails = rawData.ia_details || rawData.data?.ia_details;
  
  // Parse case information
  const parsedCase: ParsedCase = {
    filingNumber: caseInfo.filing_number || null,
    registrationNumber: caseInfo.registration_number || null,
    filingDate: parseDate(caseInfo.filing_date),
    registrationDate: parseDate(caseInfo.registration_date),
    cnrNumber: caseInfo.cnr_number || rawData.cnr_number || null,
    stageOfCase: caseInfo.stage_of_case || caseStatus.stage_of_case || null,
    nextHearingDate: parseDate(caseInfo.next_hearing_date || caseStatus.next_hearing_date),
    coram: caseInfo.coram || caseStatus.coram || null,
    benchType: caseInfo.bench_type || caseStatus.bench_type || null,
    judicialBranch: caseInfo.judicial_branch || caseStatus.judicial_branch || null,
    state: caseInfo.state || caseStatus.state || null,
    district: caseInfo.district || caseStatus.district || null,
    category: categoryInfo.category || null,
    subCategory: categoryInfo.sub_category || null
  };
  
  // Parse parties
  const petitioners = parsePartyList(
    rawData.petitioner_and_advocate || 
    rawData.data?.petitioner_and_advocate
  );
  
  const respondents = parsePartyList(
    rawData.respondent_and_advocate || 
    rawData.data?.respondent_and_advocate
  );
  
  // Parse IA details
  const parsedIADetails = parseIADetails(iaDetails);
  
  const result: ParsedCaseData = {
    case: parsedCase,
    petitioners,
    respondents,
    iaDetails: parsedIADetails.length > 0 ? parsedIADetails : []
  };
  
  console.log('✅ AI Data Parser: Parse complete');
  console.log(`   - Petitioners: ${petitioners.length}`);
  console.log(`   - Respondents: ${respondents.length}`);
  console.log(`   - IA Details: ${parsedIADetails.length}`);
  
  return result;
}

/**
 * Convert snake_case to camelCase for consistent JSON output
 */
export function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  
  if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  
  return obj;
}
