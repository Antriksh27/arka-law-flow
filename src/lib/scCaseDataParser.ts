/**
 * Supreme Court Case Data Parser
 * Extracts and normalizes data from fetched_data.data structure
 */

export interface ParsedSCData {
  diaryNumber?: string;
  diarySection?: string;
  filedOn?: string;
  verifiedOn?: string;
  caseNumbers?: Array<{
    number: string;
    registered_on?: string;
  }>;
  petitioner?: string;
  respondent?: string;
  status?: string;
  cnrNumber?: string;
  category?: string;
  statusStage?: string;
  lastListedOn?: string;
  benchComposition?: string[];
  petitioners?: Array<{
    name: string;
    advocates?: string;
  }>;
  respondents?: Array<{
    name: string;
    advocates?: string;
  }>;
  earlierCourts?: any[];
  taggedMatters?: any[];
  listingDates?: any[];
  notices?: any[];
  defects?: any[];
  orders?: any[];
  officeReports?: any[];
  iaDocuments?: any[];
  courtFees?: any[];
  similarities?: any[];
}

/**
 * Parse diary number text to extract section, filed date, verified date
 */
export function parseDiaryNumber(diaryText?: string): {
  number: string;
  section?: string;
  filedOn?: string;
  verifiedOn?: string;
} {
  if (!diaryText) return { number: '' };

  const lines = diaryText.split('\n').filter(l => l.trim());
  const number = lines[0]?.trim() || '';
  
  let section: string | undefined;
  let filedOn: string | undefined;
  let verifiedOn: string | undefined;

  // Extract section from bracket format: [\nSECTION:\nIII-B\n]
  const sectionMatch = diaryText.match(/\[\s*SECTION:\s*([^\]]+)\]/i);
  if (sectionMatch) {
    section = sectionMatch[1].trim();
  }

  lines.forEach(line => {
    if (line.includes('Filed on:')) {
      filedOn = line.replace('Filed on:', '').trim();
    } else if (line.includes('Verified on:')) {
      verifiedOn = line.replace('Verified on:', '').trim();
    }
  });

  return { number, section, filedOn, verifiedOn };
}

/**
 * Parse bench composition from "Present/Last Listed On" field
 * Format: "02-03-2021 [\nJudge1\nJudge2\n]"
 */
export function parseBenchComposition(benchText?: string): string[] {
  if (!benchText) return [];
  
  // Extract judges from bracket format
  const bracketMatch = benchText.match(/\[([\s\S]*?)\]/);
  if (bracketMatch) {
    return bracketMatch[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.toLowerCase().includes('justice'));
  }
  
  return [];
}

/**
 * Parse advocate text to extract names with status indicators
 */
export function parseAdvocates(advocateText?: string): string {
  if (!advocateText) return '';
  
  // Clean up status indicators like (Dead), (Retired), (Elevated As Chief Justice)
  return advocateText
    .replace(/\(Dead\)/gi, '†')
    .replace(/\(Retired\)/gi, '(R)')
    .replace(/\(Elevated[^)]*\)/gi, '(E)');
}

/**
 * Parse petitioners/respondents array from text format: "1 NAME\n2 NAME"
 */
export function parseParties(partiesText?: string): Array<{ name: string; advocates?: string }> {
  if (!partiesText) return [];

  const lines = partiesText.split('\n').filter(l => l.trim());
  const parties: Array<{ name: string; advocates?: string }> = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    // Match pattern: "1 NAME" (number + space, no period)
    const match = trimmed.match(/^(\d+)\s+(.+)$/);
    if (match) {
      parties.push({ name: match[2].trim() });
    }
  });

  return parties;
}

/**
 * Main parser function - extracts all SC data from raw API response
 */
export function parseSupremeCourtData(rawData?: any): ParsedSCData {
  if (!rawData) return {};

  const apiData = rawData.data || rawData;
  const caseDetails = apiData.case_details || {};

  // Parse diary number details
  const diaryInfo = parseDiaryNumber(caseDetails['Diary Number']);

  // Parse bench from "Present/Last Listed On" field
  const lastListedText = caseDetails['Present/Last Listed On'] || '';
  const benchComposition = parseBenchComposition(lastListedText);

  // Parse parties - just names
  const petitioners = parseParties(caseDetails['Petitioner(s)']);
  const respondents = parseParties(caseDetails['Respondent(s)']);

  // Extract advocates separately
  const petitionerAdvocates = parseAdvocates(caseDetails['Petitioner Advocate(s)']);
  const respondentAdvocates = parseAdvocates(caseDetails['Respondent Advocate(s)']);

  // Attach advocates to first party if exists
  if (petitioners.length > 0 && petitionerAdvocates) {
    petitioners[0] = { ...petitioners[0], advocates: petitionerAdvocates };
  }
  if (respondents.length > 0 && respondentAdvocates) {
    respondents[0] = { ...respondents[0], advocates: respondentAdvocates };
  }

  return {
    diaryNumber: diaryInfo.number || apiData.diary_number,
    diarySection: diaryInfo.section,
    filedOn: diaryInfo.filedOn,
    verifiedOn: diaryInfo.verifiedOn,
    caseNumbers: apiData.case_numbers,
    petitioner: apiData.petitioner,
    respondent: apiData.respondent,
    status: apiData.status,
    cnrNumber: caseDetails['CNR Number'],
    category: caseDetails['Category'],
    statusStage: caseDetails['Status/Stage'],
    lastListedOn: lastListedText.split('[')[0]?.trim(),
    benchComposition,
    petitioners,
    respondents,
    // Nested data arrays from case_details
    earlierCourts: caseDetails['earlier_court_details'] || [],
    taggedMatters: caseDetails['tagged_matters'] || [],
    listingDates: caseDetails['listing_dates'] || [],
    notices: caseDetails['notices'] || [],
    defects: caseDetails['defects'] || [],
    orders: caseDetails['judgement_orders'] || [],
    officeReports: caseDetails['office_report'] || [],
    iaDocuments: caseDetails['interlocutory_application_documents'] || [],
    courtFees: caseDetails['court_fees'] || [],
    similarities: caseDetails['similarities'] || [],
  };
}
