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

  lines.forEach(line => {
    if (line.includes('Section:')) {
      section = line.replace('Section:', '').trim();
    } else if (line.includes('Filed on:')) {
      filedOn = line.replace('Filed on:', '').trim();
    } else if (line.includes('Verified on:')) {
      verifiedOn = line.replace('Verified on:', '').trim();
    }
  });

  return { number, section, filedOn, verifiedOn };
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
 * Parse petitioners/respondents array
 */
export function parseParties(partiesText?: string): Array<{ name: string; advocates?: string }> {
  if (!partiesText) return [];

  const lines = partiesText.split('\n').filter(l => l.trim());
  const parties: Array<{ name: string; advocates?: string }> = [];
  
  let currentParty: { name: string; advocates?: string } | null = null;

  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (/^\d+\./.test(trimmed)) {
      // This is a party name line (starts with number)
      if (currentParty) parties.push(currentParty);
      currentParty = { name: trimmed.replace(/^\d+\.\s*/, '') };
    } else if (trimmed.startsWith('Adv:') || trimmed.startsWith('Advocate:')) {
      // This is an advocate line
      if (currentParty) {
        const advText = trimmed.replace(/^(Adv:|Advocate:)\s*/i, '');
        currentParty.advocates = parseAdvocates(advText);
      }
    }
  });

  if (currentParty) parties.push(currentParty);

  return parties;
}

/**
 * Parse bench composition from text
 */
export function parseBenchComposition(benchText?: string): string[] {
  if (!benchText) return [];
  
  return benchText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.toLowerCase().includes('justice'));
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
  const benchComposition = parseBenchComposition(lastListedText.split('Before :')[1]);

  // Parse parties
  const petitioners = parseParties(caseDetails['Petitioner(s)']);
  const respondents = parseParties(caseDetails['Respondent(s)']);

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
    lastListedOn: lastListedText.split('Before :')[0]?.trim(),
    benchComposition,
    petitioners,
    respondents,
  };
}
