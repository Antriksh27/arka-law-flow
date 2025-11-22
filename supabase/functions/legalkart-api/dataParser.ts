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
  firstHearingDate: string | null;
  coram: string | null;
  benchType: string | null;
  judicialBranch: string | null;
  state: string | null;
  district: string | null;
  category: string | null;
  subCategory: string | null;
  caseType: string | null;
  courtNumberAndJudge: string | null;
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

export interface ParsedActsAndSections {
  underAct: string | null;
  underSection: string | null;
}

export interface ParsedCaseData {
  case: ParsedCase;
  petitioners: ParsedParty[];
  respondents: ParsedParty[];
  iaDetails: ParsedIADetail[];
  actsAndSections: ParsedActsAndSections[];
}

// Supreme Court specific interfaces
export interface ParsedSupremeCourtCase extends ParsedCase {
  caseTitle: string;
  caseNumber: string | null;
  diaryNumber: string | null;
  diaryFiledOn: string | null;
  diarySection: string | null;
  diaryStatus: string | null;
  presentLastListedOn: string | null;
  benchComposition: string[];
  caseStatusDetail: string | null;
  categoryCode: string | null;
  verificationDate: string | null;
}

export interface ParsedEarlierCourtDetail {
  srNo: number | null;
  courtType: string | null;
  agencyState: string | null;
  agencyCode: string | null;
  caseNo: string | null;
  orderDate: string | null;
  cnrNo: string | null;
  designation: string | null;
  judge1: string | null;
  judge2: string | null;
  judge3: string | null;
  policeStation: string | null;
  crimeNo: string | null;
  crimeYear: number | null;
  judgmentChallenged: boolean;
  judgmentType: string | null;
  judgmentCoveredIn: string | null;
}

export interface ParsedTaggedMatter {
  type: string | null;
  caseNumber: string | null;
  registeredOn: string | null;
  petitionerVsRespondent: string | null;
  listStatus: string | null;
  status: string | null;
  statInfo: string | null;
  iaInfo: string | null;
  entryDate: string | null;
}

export interface ParsedListingDate {
  clDate: string | null;
  miscOrRegular: string | null;
  stage: string | null;
  purpose: string | null;
  judges: string[];
  remarks: string | null;
  listedStatus: string | null;
}

export interface ParsedNotice {
  srNo: number | null;
  processId: string | null;
  noticeType: string | null;
  name: string | null;
  state: string | null;
  district: string | null;
  station: string | null;
  issueDate: string | null;
  returnableDate: string | null;
  dispatchDate: string | null;
}

export interface ParsedDefect {
  srNo: number | null;
  defaultType: string | null;
  remarks: string | null;
  notificationDate: string | null;
  removedOnDate: string | null;
}

export interface ParsedJudgementOrder {
  date: string | null;
  url: string | null;
  type: string | null;
}

export interface ParsedOfficeReport {
  srNo: number | null;
  processId: string | null;
  orderDate: string | null;
  htmlUrl: string | null;
  receivingDate: string | null;
}

export interface ParsedSupremeCourtData {
  case: ParsedSupremeCourtCase;
  petitioners: ParsedParty[];
  respondents: ParsedParty[];
  earlierCourtDetails: ParsedEarlierCourtDetail[];
  taggedMatters: ParsedTaggedMatter[];
  listingDates: ParsedListingDate[];
  notices: ParsedNotice[];
  defects: ParsedDefect[];
  judgementOrders: ParsedJudgementOrder[];
  officeReports: ParsedOfficeReport[];
  similarities: any[];
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
      
      // Split by "Advocate-" or "Advocate -" or "Advocate:" (case insensitive)
      const advocatePattern = /Advocate\s*[-:]\s*/i;
      const parts = cleaned.split(advocatePattern);
      
      // Clean the name: remove '(' and any text after it, trim whitespace
      let name = parts[0]?.trim() || '';
      name = name.split('(')[0].trim(); // Remove anything after '(' including the '(' itself
      
      // Clean the advocate name
      let advocate = parts[1]?.trim() || null;
      if (advocate) {
        advocate = advocate.split('(')[0].trim(); // Remove anything after '(' from advocate name too
      }
      
      return {
        name,
        advocate
      };
    }).filter(party => {
      // Only return entries with valid names (not empty, not just numbers, not just whitespace)
      if (!party.name || party.name.trim() === '') return false;
      
      // Filter out entries that are just numbers (like "3", "5", "0", "5.9")
      if (/^[\d\.\s]+$/.test(party.name)) return false;
      
      // Filter out entries that are too short (less than 3 characters after trimming)
      if (party.name.length < 3) return false;
      
      return true;
    });
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
 * Parse Acts and Sections from district court data
 */
export function parseActsAndSections(actsData: any): ParsedActsAndSections[] {
  if (!actsData) return [];
  
  const actsArray = Array.isArray(actsData) ? actsData : [actsData];
  
  return actsArray.map(act => ({
    underAct: act.under_act || act.act || null,
    underSection: act.under_section || act.section || null
  })).filter(act => act.underAct || act.underSection);
}

/**
 * Main parser function
 * Transforms raw E-Courts API JSON into standardized structure
 */
export function parseECourtsData(rawData: any): ParsedCaseData {
  console.log('🤖 AI Data Parser: Starting parse...');
  
  // Extract nested data structures - support both eCourts and LegalKart formats
  // District courts use data.case_details, data.case_status_details, etc.
  const rd = rawData?.data ?? rawData ?? {};
  const caseInfo = rd.case_info || rd.case_details || rawData.case_info || rawData.case_details || {};
  const caseStatus = rd.case_status || rd.case_status_details || rawData.case_status || rawData.case_status_details || {};
  const categoryInfo = rd.category_info || rawData.category_info || {};
  const iaDetails = rd.ia_details || rawData.ia_details;
  const actsAndSectionsData = rd.acts_and_sections_details || rawData.acts_and_sections_details;
  
  // Parse case information with district court specific fields
  const parsedCase: ParsedCase = {
    filingNumber: caseInfo.filing_number || rd.filing_number || null,
    registrationNumber: caseInfo.registration_number || rd.registration_number || null,
    filingDate: parseDate(caseInfo.filing_date || rd.filing_date),
    registrationDate: parseDate(caseInfo.registration_date || rd.registration_date),
    cnrNumber: caseInfo.cnr_number || rd.cnr_number || rawData.cnr_number || null,
    stageOfCase: caseStatus.case_stage || caseStatus.stage_of_case || caseInfo.stage_of_case || null,
    nextHearingDate: parseDate(caseStatus.next_hearing_date || caseInfo.next_hearing_date || rd.next_hearing_date),
    firstHearingDate: parseDate(caseStatus.first_hearing_date || caseInfo.first_hearing_date || rd.first_hearing_date),
    coram: caseStatus.coram || caseInfo.coram || rd.coram || null,
    benchType: caseStatus.bench_type || caseInfo.bench_type || rd.bench_type || null,
    judicialBranch: caseStatus.judicial_branch || caseInfo.judicial_branch || rd.judicial_branch || null,
    state: caseStatus.state || caseInfo.state || rd.state || null,
    district: caseStatus.district || caseInfo.district || rd.district || null,
    category: categoryInfo.category || rd.category || null,
    subCategory: categoryInfo.sub_category || rd.sub_category || null,
    caseType: caseInfo.case_type || rd.case_type || null,
    courtNumberAndJudge: caseStatus.court_number_and_judge || null
  };
  
  // Parse parties - support both eCourts and LegalKart formats
  // District courts use data.petitioner_and_respondent_details
  const petitionerAndRespondentDetails = rd.petitioner_and_respondent_details || rawData.petitioner_and_respondent_details || {};
  
  const petitioners = parsePartyList(
    petitionerAndRespondentDetails.petitioner_and_advocate ||
    rd.petitioner_and_advocate || 
    rawData.petitioner_and_advocate
  );
  
  const respondents = parsePartyList(
    petitionerAndRespondentDetails.respondent_and_advocate ||
    rd.respondent_and_advocate || 
    rawData.respondent_and_advocate
  );
  
  // Parse IA details
  const parsedIADetails = parseIADetails(iaDetails);
  
  // Parse acts and sections
  const parsedActsAndSections = parseActsAndSections(actsAndSectionsData);
  
  const result: ParsedCaseData = {
    case: parsedCase,
    petitioners,
    respondents,
    iaDetails: parsedIADetails.length > 0 ? parsedIADetails : [],
    actsAndSections: parsedActsAndSections
  };
  
  console.log('✅ AI Data Parser: Parse complete');
  console.log(`   - Petitioners: ${petitioners.length}`);
  console.log(`   - Respondents: ${respondents.length}`);
  console.log(`   - IA Details: ${parsedIADetails.length}`);
  console.log(`   - Acts & Sections: ${parsedActsAndSections.length}`);
  
  return result;
}

/**
 * Parse Supreme Court case data
 */
export function parseSupremeCourtData(rawData: any): ParsedSupremeCourtData {
  console.log('🏛️ Parsing Supreme Court data...');
  
  const caseDetails = rawData["Case Details"] || {};
  const diaryInfo = caseDetails["Diary Info"] || "";
  
  // Parse Diary Number
  const diaryMatch = diaryInfo.match(/Diary No\.\s*-\s*(\S+)/);
  const diaryNumber = diaryMatch ? diaryMatch[1] : null;
  
  // Parse Filed On
  const filedOnMatch = diaryInfo.match(/Filed on\s+(\S+)/);
  const diaryFiledOn = filedOnMatch ? parseDate(filedOnMatch[1]) : null;
  
  // Parse Section
  const sectionMatch = diaryInfo.match(/SECTION:\s*([^\]]+)/);
  const diarySection = sectionMatch ? sectionMatch[1].trim() : null;
  
  // Parse Status
  const statusMatch = diaryInfo.match(/\]\s+(\w+)$/);
  const diaryStatus = statusMatch ? statusMatch[1] : null;
  
  // Parse Bench Composition
  const presentListed = rawData["Present/Last Listed On"] || "";
  const benchMatch = presentListed.match(/\[(.*?)\]/);
  const benchComposition = benchMatch 
    ? benchMatch[1].split(/,?\s*and\s*/).map((s: string) => s.trim())
    : [];
  
  // Parse Present Last Listed date
  const dateMatch = presentListed.match(/^(\d{2}-\d{2}-\d{4})/);
  const presentLastListedOn = dateMatch ? parseDate(dateMatch[1]) : null;
  
  const categoryCode = rawData["Category"] || null;
  
  // Parse Verification Date
  const regInfo = caseDetails["Case Number"] || "";
  const verificationMatch = regInfo.match(/Verified On\s+(\S+)/);
  const verificationDate = verificationMatch ? parseDate(verificationMatch[1]) : null;
  
  // Build SC case
  const scCase: ParsedSupremeCourtCase = {
    caseTitle: `${rawData.Petitioner} vs. ${rawData.Respondent}`,
    caseNumber: rawData["Case Numbers"]?.Number || null,
    filingNumber: null,
    registrationNumber: rawData["Case Numbers"]?.Number || null,
    filingDate: parseDate(diaryFiledOn),
    registrationDate: parseDate(rawData["Registered On"]),
    cnrNumber: caseDetails["CNR Number"] || null,
    stageOfCase: rawData["Status/Stage"] || null,
    nextHearingDate: null,
    firstHearingDate: null,
    coram: benchComposition.join(', '),
    benchType: null,
    judicialBranch: null,
    state: null,
    district: null,
    category: rawData["Category"] || null,
    subCategory: null,
    caseType: null,
    courtNumberAndJudge: null,
    diaryNumber,
    diaryFiledOn,
    diarySection,
    diaryStatus,
    presentLastListedOn,
    benchComposition,
    caseStatusDetail: rawData["Status/Stage"] || null,
    categoryCode,
    verificationDate,
  };
  
  // Parse parties
  const petitioners = parsePartyList(rawData["Petitioner(S)"] || "");
  const respondents = parsePartyList(rawData["Respondent(S)"] || "");
  
  // Parse Earlier Court Details
  const earlierCourts = caseDetails["Earlier Court Details"] || [];
  const earlierCourtDetails = earlierCourts.map((court: any) => ({
    srNo: court["S.No."] || null,
    courtType: court.Court || null,
    agencyState: court["Agency State"] || null,
    agencyCode: court["Agency Code"] || null,
    caseNo: court["Case No."] || null,
    orderDate: parseDate(court["Order Date"]),
    cnrNo: court["CNR No. / Designation"] || null,
    designation: court["CNR No. / Designation"] || null,
    judge1: court["Judge1 / Judge2 / Judge3"] || null,
    judge2: null,
    judge3: null,
    policeStation: court["Police Station"] || null,
    crimeNo: court["Crime No./ Year"]?.split('/')[0] || null,
    crimeYear: court["Crime No./ Year"]?.split('/')[1] ? parseInt(court["Crime No./ Year"].split('/')[1]) : null,
    judgmentChallenged: court["Judgment Challenged"] === "Yes",
    judgmentType: court["Judgment Type"] !== "-" ? court["Judgment Type"] : null,
    judgmentCoveredIn: court["Judgment Covered In"] || null,
  }));
  
  // Parse Tagged Matters
  const taggedMatters = (caseDetails["Tagged Matters"] || []).map((tm: any) => ({
    type: tm.Type || null,
    caseNumber: tm["Case Number"] || null,
    registeredOn: tm["Case Number"]?.match(/\(([^)]+)\)/)?.[1] || null,
    petitionerVsRespondent: tm["Petitioner Vs. Respondent"] || null,
    listStatus: tm.List || null,
    status: tm.Status || null,
    statInfo: tm["Stat. Info."] || null,
    iaInfo: tm.IA || null,
    entryDate: parseDate(tm["Entry Date"]),
  }));
  
  // Parse Listing Dates
  const listingDates = (caseDetails["Listing Dates"] || []).map((ld: any) => ({
    clDate: parseDate(ld["CL Date"]),
    miscOrRegular: ld["Misc./Regular"] || null,
    stage: ld.Stage || null,
    purpose: ld.Purpose || null,
    judges: ld.Judges ? ld.Judges.split(',').map((s: string) => s.trim()) : [],
    remarks: ld.Remarks || null,
    listedStatus: ld.Listed || null,
  }));
  
  // Parse Notices
  const notices = (caseDetails["Notices"] || []).map((n: any) => ({
    srNo: n["Serial Number"] || null,
    processId: n["Process Id"] || null,
    noticeType: n["Notice Type"] || null,
    name: n.Name || null,
    state: n["State / District"]?.split('/')[0]?.trim() || null,
    district: n["State / District"]?.split('/')[1]?.trim() || null,
    station: n.Station || null,
    issueDate: parseDate(n["Issue Date"]),
    returnableDate: parseDate(n["Returnable Date"]),
    dispatchDate: n["Dispatch Date"] || null,
  }));
  
  // Parse Defects
  const defects = (caseDetails["Defects"] || []).map((d: any) => ({
    srNo: d["S.No."] || null,
    defaultType: d.Default || null,
    remarks: d.Remarks || null,
    notificationDate: parseDate(d["Notification Date"]),
    removedOnDate: parseDate(d["Removed On Date"]),
  }));
  
  // Parse Judgement Orders
  const judgementOrders = (caseDetails["Judgement Orders"] || []).map((jo: any) => ({
    date: parseDate(jo.Date),
    url: jo.Url || null,
    type: jo.Type || null,
  }));
  
  // Parse Office Reports
  const officeReports = (caseDetails["Office Report"] || []).map((or: any) => ({
    srNo: or["Serial Number"] || null,
    processId: or["Process Id"] || null,
    orderDate: parseDate(or["Order Date"]?.Text),
    htmlUrl: or["Pdf Url"] || null,
    receivingDate: or["Receiving Date"] || null,
  }));
  
  // Parse Similarities
  const similarities = caseDetails["Similarities"] || [];
  
  console.log('✅ Supreme Court data parsed');
  console.log(`   - Petitioners: ${petitioners.length}`);
  console.log(`   - Respondents: ${respondents.length}`);
  console.log(`   - Earlier Courts: ${earlierCourtDetails.length}`);
  console.log(`   - Tagged Matters: ${taggedMatters.length}`);
  
  return {
    case: scCase,
    petitioners,
    respondents,
    earlierCourtDetails,
    taggedMatters,
    listingDates,
    notices,
    defects,
    judgementOrders,
    officeReports,
    similarities,
  };
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
