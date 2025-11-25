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
  iaDocuments: any[];
  courtFees: any[];
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
  console.log('📦 Raw Data Keys:', Object.keys(rawData));
  
  // Handle both structures: direct data or nested in .data
  const data = rawData.data || rawData;
  
  // Access case_details (lowercase) or "Case Details" (capitalized)
  const caseDetails = data.case_details || data["Case Details"] || {};
  console.log('📦 Case Details Keys:', Object.keys(caseDetails));
  
  // Extract root-level fields (lowercase from API)
  const petitioner = data.petitioner || data.Petitioner || "";
  const respondent = data.respondent || data.Respondent || "";
  const diaryNumber = data.diary_number || data["Diary Number"] || null;
  const status = data.status || data.Status || caseDetails["Status/Stage"] || "PENDING";
  const category = caseDetails.Category || caseDetails["Category"] || data.category || null;
  
  // Extract case numbers
  const caseNumbers = data.case_numbers || data["Case Numbers"] || [];
  const caseNumberStr = Array.isArray(caseNumbers) && caseNumbers.length > 0
    ? caseNumbers[0]?.number || caseNumbers[0]?.Number
    : caseDetails["Case Number"]?.split(' Registered')[0] || null;
  
  const registeredOn = Array.isArray(caseNumbers) && caseNumbers.length > 0
    ? caseNumbers[0]?.registered_on || caseNumbers[0]?.["Registered On"]
    : data["Registered On"] || null;
  
  // Parse bench composition from nested case_details
  const presentListed = caseDetails["Present/Last Listed On"] || "";
  const benchMatch = presentListed.match(/\[(.*?)\]/);
  const benchComposition = benchMatch 
    ? benchMatch[1].split(/,?\s*and\s*/).map((s: string) => s.trim())
    : [];
  
  // Parse CNR from case_details
  const cnrNumber = caseDetails["CNR Number"] || data.cnr_number || null;
  
  // Parse diary info
  const diaryInfo = caseDetails["Diary Info"] || "";
  const diaryFiledOnMatch = diaryInfo.match(/Filed on\s+(\S+)/);
  const diaryFiledOn = diaryFiledOnMatch ? parseDate(diaryFiledOnMatch[1]) : parseDate(registeredOn);
  
  const sectionMatch = diaryInfo.match(/SECTION:\s*([^\]]+)/);
  const diarySection = sectionMatch ? sectionMatch[1].trim() : null;
  
  const statusMatch = diaryInfo.match(/\]\s+(\w+)$/);
  const diaryStatus = statusMatch ? statusMatch[1] : status;
  
  // Build SC case
  const scCase: ParsedSupremeCourtCase = {
    caseTitle: caseDetails["Case Title"] || `${petitioner} vs. ${respondent}`,
    caseNumber: caseNumberStr,
    filingNumber: null,
    registrationNumber: caseNumberStr,
    filingDate: diaryFiledOn,
    registrationDate: parseDate(registeredOn),
    cnrNumber: cnrNumber,
    stageOfCase: caseDetails["Status/Stage"] || status,
    nextHearingDate: null,
    firstHearingDate: null,
    coram: benchComposition.join(', '),
    benchType: null,
    judicialBranch: null,
    state: null,
    district: null,
    category: category,
    subCategory: null,
    caseType: null,
    courtNumberAndJudge: null,
    diaryNumber: diaryNumber,
    diaryFiledOn: diaryFiledOn,
    diarySection: diarySection,
    diaryStatus: diaryStatus,
    presentLastListedOn: presentListed ? parseDate(presentListed.split('[')[0].trim()) : null,
    benchComposition,
    caseStatusDetail: caseDetails["Status/Stage"] || status,
    categoryCode: category,
    verificationDate: null,
  };
  
  // Parse parties from case_details
  const petitionersList = caseDetails["Petitioner(s)"] || caseDetails["Petitioner(S)"] || "";
  const respondentsList = caseDetails["Respondent(s)"] || caseDetails["Respondent(S)"] || "";
  
  const petitioners = parsePartyList(petitionersList);
  const respondents = parsePartyList(respondentsList);
  
  // If no detailed party list, create from root fields
  if (petitioners.length === 0 && petitioner) {
    petitioners.push({
      name: petitioner,
      advocate: caseDetails["Petitioner Advocate(s)"] || caseDetails["Petitioner Advocate(S)"] || null
    });
  }
  
  if (respondents.length === 0 && respondent) {
    respondents.push({
      name: respondent,
      advocate: caseDetails["Respondent Advocate(s)"] || caseDetails["Respondent Advocate(S)"] || null
    });
  }
  
  // Parse Earlier Court Details - handle both array and object structures
  const earlierCourtsRaw = caseDetails["Earlier Court Details"] || [];
  const earlierCourtDetails = (Array.isArray(earlierCourtsRaw) ? earlierCourtsRaw : []).map((court: any) => ({
    srNo: court["S.No."] || court.sr_no || null,
    courtType: court.Court || court.court || null,
    agencyState: court["Agency State"] || court.agency_state || null,
    agencyCode: court["Agency Code"] || court.agency_code || null,
    caseNo: court["Case No."] || court.case_no || null,
    orderDate: parseDate(court["Order Date"] || court.order_date),
    cnrNo: court["CNR No. / Designation"] || court.cnr_no || null,
    designation: court["CNR No. / Designation"] || court.designation || null,
    judge1: court["Judge1 / Judge2 / Judge3"] || court.judge1 || null,
    judge2: court.judge2 || null,
    judge3: court.judge3 || null,
    policeStation: court["Police Station"] || court.police_station || null,
    crimeNo: (court["Crime No./ Year"] || court.crime_no || "").split('/')[0] || null,
    crimeYear: (court["Crime No./ Year"] || court.crime_year || "").split('/')[1] ? parseInt((court["Crime No./ Year"] || "").split('/')[1]) : null,
    judgmentChallenged: court["Judgment Challenged"] === "Yes" || court.judgment_challenged === true,
    judgmentType: (court["Judgment Type"] !== "-" && court["Judgment Type"]) ? court["Judgment Type"] : (court.judgment_type || null),
    judgmentCoveredIn: court["Judgment Covered In"] || court.judgment_covered_in || null,
  }));
  
  // Parse Tagged Matters
  const taggedMattersRaw = caseDetails["Tagged Matters"] || [];
  const taggedMatters = (Array.isArray(taggedMattersRaw) ? taggedMattersRaw : []).map((tm: any) => ({
    type: tm.Type || tm.type || null,
    caseNumber: tm["Case Number"] || tm.case_number || null,
    registeredOn: (tm["Case Number"] || tm.case_number || "").match(/\(([^)]+)\)/)?.[1] || null,
    petitionerVsRespondent: tm["Petitioner Vs. Respondent"] || tm.petitioner_vs_respondent || null,
    listStatus: tm.List || tm.list || null,
    status: tm.Status || tm.status || null,
    statInfo: tm["Stat. Info."] || tm.stat_info || null,
    iaInfo: tm.IA || tm.ia || null,
    entryDate: parseDate(tm["Entry Date"] || tm.entry_date),
  }));
  
  // Parse Listing Dates
  const listingDatesRaw = caseDetails["Listing Dates"] || [];
  const listingDates = (Array.isArray(listingDatesRaw) ? listingDatesRaw : []).map((ld: any) => ({
    clDate: parseDate(ld["CL Date"] || ld.cl_date),
    miscOrRegular: ld["Misc./Regular"] || ld.misc_regular || null,
    stage: ld.Stage || ld.stage || null,
    purpose: ld.Purpose || ld.purpose || null,
    judges: (ld.Judges || ld.judges) ? (ld.Judges || ld.judges).split(',').map((s: string) => s.trim()) : [],
    remarks: ld.Remarks || ld.remarks || null,
    listedStatus: ld.Listed || ld.listed || null,
  }));
  
  // Parse Notices
  const noticesRaw = caseDetails["Notices"] || [];
  const notices = (Array.isArray(noticesRaw) ? noticesRaw : []).map((n: any) => ({
    srNo: n["Serial Number"] || n.serial_number || null,
    processId: n["Process Id"] || n.process_id || null,
    noticeType: n["Notice Type"] || n.notice_type || null,
    name: n.Name || n.name || null,
    state: (n["State / District"] || n.state_district || "").split('/')[0]?.trim() || null,
    district: (n["State / District"] || n.state_district || "").split('/')[1]?.trim() || null,
    station: n.Station || n.station || null,
    issueDate: parseDate(n["Issue Date"] || n.issue_date),
    returnableDate: parseDate(n["Returnable Date"] || n.returnable_date),
    dispatchDate: n["Dispatch Date"] || n.dispatch_date || null,
  }));
  
  // Parse Defects
  const defectsRaw = caseDetails["Defects"] || [];
  const defects = (Array.isArray(defectsRaw) ? defectsRaw : []).map((d: any) => ({
    srNo: d["S.No."] || d.sr_no || null,
    defaultType: d.Default || d.default || null,
    remarks: d.Remarks || d.remarks || null,
    notificationDate: parseDate(d["Notification Date"] || d.notification_date),
    removedOnDate: parseDate(d["Removed On Date"] || d.removed_on_date),
  }));
  
  // Parse Judgement Orders
  const judgementOrdersRaw = caseDetails["Judgement Orders"] || [];
  const judgementOrders = (Array.isArray(judgementOrdersRaw) ? judgementOrdersRaw : []).map((jo: any) => ({
    date: parseDate(jo.Date || jo.date),
    url: jo.Url || jo.url || null,
    type: jo.Type || jo.type || null,
  }));
  
  // Parse Office Reports
  const officeReportsRaw = caseDetails["Office Report"] || [];
  const officeReports = (Array.isArray(officeReportsRaw) ? officeReportsRaw : []).map((or: any) => ({
    srNo: or["Serial Number"] || or.serial_number || null,
    processId: or["Process Id"] || or.process_id || null,
    orderDate: parseDate(or["Order Date"]?.Text || or.order_date?.text || or.order_date),
    htmlUrl: or["Pdf Url"] || or.pdf_url || null,
    receivingDate: or["Receiving Date"] || or.receiving_date || null,
  }));
  
  // Parse Similarities
  const similarities = caseDetails["Similarities"] || caseDetails.similarities || [];
  
  // Parse IA Documents
  const iaDocumentsRaw = caseDetails["interlocutory_application_documents"] || 
                         caseDetails.interlocutory_application_documents || [];
  const iaDocuments = (Array.isArray(iaDocumentsRaw) ? iaDocumentsRaw : []).map((ia: any) => ({
    iaNumber: ia.ia_number || ia["IA Number"] || null,
    documentType: ia.document_type || ia["Document Type"] || null,
    filedBy: ia.filed_by || ia["Filed By"] || null,
    filingDate: parseDate(ia.filing_date || ia["Filing Date"]),
    documentUrl: ia.document_url || ia["Document URL"] || null,
    status: ia.status || ia.Status || null,
  }));

  // Parse Court Fees
  const courtFeesRaw = caseDetails["court_fees"] || caseDetails.court_fees || [];
  const courtFees = (Array.isArray(courtFeesRaw) ? courtFeesRaw : []).map((cf: any) => ({
    feeType: cf.fee_type || cf["Fee Type"] || null,
    amount: cf.amount || cf.Amount || null,
    paidDate: parseDate(cf.paid_date || cf["Paid Date"]),
    challanNumber: cf.challan_number || cf["Challan Number"] || null,
  }));
  
  console.log('✅ Supreme Court data parsed');
  console.log(`   - Petitioners: ${petitioners.length}`);
  console.log(`   - Respondents: ${respondents.length}`);
  console.log(`   - Earlier Courts: ${earlierCourtDetails.length}`);
  console.log(`   - Tagged Matters: ${taggedMatters.length}`);
  console.log(`   - Listing Dates: ${listingDates.length}`);
  console.log(`   - Notices: ${notices.length}`);
  console.log(`   - Defects: ${defects.length}`);
  console.log(`   - Judgement Orders: ${judgementOrders.length}`);
  console.log(`   - Office Reports: ${officeReports.length}`);
  console.log(`   - IA Documents: ${iaDocuments.length}`);
  console.log(`   - Court Fees: ${courtFees.length}`);
  
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
    iaDocuments,
    courtFees,
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
