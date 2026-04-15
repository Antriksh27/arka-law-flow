/**
 * eCourtsIndia API Data Mapper
 * Maps eCourtsIndia v4.0 API responses to existing DB schema
 */

// Date format from eCourtsIndia is already YYYY-MM-DD — just validate
export function normalizeDate(val: unknown): string | null {
  if (val == null) return null;
  const s = typeof val === 'string' ? val.trim() : String(val).trim();
  if (!s || s === '-' || s === 'null' || s === 'undefined') return null;
  // ISO date
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // ISO datetime
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
  // DD/MM/YYYY or DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  // Fallback
  const d = new Date(s);
  return !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null;
}

export interface MappedCaseData {
  // Case-level fields for the `cases` table
  case_title: string | null;
  case_number: string | null;
  case_type: string | null;
  status: string | null;
  stage: string | null;
  cnr_number: string | null;
  filing_number: string | null;
  registration_number: string | null;
  filing_date: string | null;
  registration_date: string | null;
  first_hearing_date: string | null;
  next_hearing_date: string | null;
  decision_date: string | null;
  disposal_date: string | null;
  court: string | null;
  court_name: string | null;
  court_type: string | null;
  district: string | null;
  state: string | null;
  bench_type: string | null;
  coram: string | null;
  petitioner: string | null;
  respondent: string | null;
  petitioner_advocate: string | null;
  respondent_advocate: string | null;
  vs: string | null;
  advocate_name: string | null;
  category: string | null;
  under_act: string | null;
  under_section: string | null;
  priority: string;
  description: string | null;
  // Metadata
  fetched_data: any;
  is_auto_fetched: boolean;
  fetch_status: string;
  fetch_message: string;
  last_fetched_at: string;
}

/**
 * Map eCourtsIndia case detail response to CRM `cases` table fields
 */
export function mapEcourtsCaseToCRM(apiResponse: any): MappedCaseData {
  const data = apiResponse?.data ?? apiResponse ?? {};
  const cc = data.courtCaseData ?? {};
  const entity = data.entityInfo ?? {};
  const caseAi = data.caseAiAnalysis ?? {};

  // Party arrays are plain string arrays
  const petitioners: string[] = cc.petitioners ?? [];
  const respondents: string[] = cc.respondents ?? [];
  const petAdvocates: string[] = cc.petitionerAdvocates ?? [];
  const resAdvocates: string[] = cc.respondentAdvocates ?? [];

  const petitioner = petitioners[0] ?? null;
  const respondent = respondents[0] ?? null;
  const petAdvocate = petAdvocates[0] ?? null;
  const resAdvocate = resAdvocates[0] ?? null;

  // Build case title: "Petitioner vs Respondent"
  const caseTitle = petitioner && respondent
    ? `${petitioner} Vs ${respondent}`
    : cc.caseNumber || cc.cnr || null;

  // Map caseStatus to DB status enum
  const rawStatus = (cc.caseStatus ?? '').toLowerCase();
  let status: string = 'pending';
  if (rawStatus === 'disposed' || rawStatus === 'dismissed' || rawStatus === 'withdrawn' || rawStatus === 'decided') {
    status = 'disposed';
  } else if (rawStatus === 'pending' || rawStatus === 'listed') {
    status = 'pending';
  }

  // Map case type
  const rawCaseType = (cc.caseType ?? cc.caseTypeRaw ?? '').toLowerCase();
  let caseType = 'civil';
  if (rawCaseType.includes('criminal') || rawCaseType.includes('crl') || rawCaseType.includes('bail')) {
    caseType = 'criminal';
  } else if (rawCaseType.includes('family')) {
    caseType = 'family';
  } else if (rawCaseType) {
    caseType = 'other';
  }

  // Priority from AI analysis or type
  let priority = 'low';
  if (caseType === 'criminal') priority = 'high';
  else if (cc.orderCount > 0 || cc.iaCount > 0) priority = 'medium';

  return {
    case_title: caseTitle,
    case_number: cc.caseNumber ?? null,
    case_type: caseType,
    status,
    stage: cc.purpose ?? cc.caseStatus ?? null,
    cnr_number: cc.cnr ?? null,
    filing_number: cc.filingNumber ?? null,
    registration_number: cc.registrationNumber ?? null,
    filing_date: normalizeDate(cc.filingDate),
    registration_date: normalizeDate(cc.registrationDate),
    first_hearing_date: normalizeDate(cc.firstHearingDate),
    next_hearing_date: normalizeDate(cc.nextHearingDate),
    decision_date: normalizeDate(cc.decisionDate),
    disposal_date: normalizeDate(cc.decisionDate), // eCourtsIndia uses decisionDate for disposal
    court: cc.courtName ?? null,
    court_name: cc.courtName ?? null,
    court_type: cc.judicialSection ?? null,
    district: cc.district ?? null,
    state: cc.state ?? null,
    bench_type: cc.benchName ?? null,
    coram: (cc.judges ?? []).join(', ') || null,
    petitioner,
    respondent,
    petitioner_advocate: petAdvocate,
    respondent_advocate: resAdvocate,
    vs: petitioner && respondent ? `${petitioner} vs ${respondent}` : null,
    advocate_name: petAdvocate,
    category: cc.caseCategoryFacetPath ?? null,
    under_act: cc.actsAndSections ?? null,
    under_section: cc.sections || null,
    priority,
    description: caseAi?.caseSummary ?? null,
    fetched_data: apiResponse,
    is_auto_fetched: true,
    fetch_status: 'success',
    fetch_message: `Fetched from eCourtsIndia API on ${new Date().toISOString()}`,
    last_fetched_at: new Date().toISOString(),
  };
}

/**
 * Extract hearing history from eCourtsIndia case detail
 */
export function extractHearings(apiResponse: any, caseId: string): any[] {
  const cc = apiResponse?.data?.courtCaseData ?? {};
  const hearings = cc.historyOfCaseHearings ?? cc.hearings ?? cc.hearingHistory ?? [];
  if (!Array.isArray(hearings)) return [];

  return hearings.map((h: any) => ({
    case_id: caseId,
    hearing_date: normalizeDate(h.hearingDate ?? h.date),
    judge: h.judge ?? (h.judges ?? []).join(', ') ?? null,
    purpose_of_hearing: h.purpose ?? h.purposeOfHearing ?? null,
    business_on_date: h.businessOnDate ?? null,
    cause_list_type: h.causeListType ?? null,
  })).filter((h: any) => h.hearing_date);
}

/**
 * Extract orders from eCourtsIndia case detail
 */
export function extractOrders(apiResponse: any, caseId: string): any[] {
  const cc = apiResponse?.data?.courtCaseData ?? {};
  const judgmentOrders = cc.judgmentOrders ?? [];
  const interimOrders = cc.interimOrders ?? [];
  const allOrders = [...judgmentOrders, ...interimOrders];

  // Also pull from files for AI analysis
  const files = apiResponse?.data?.files?.files ?? [];

  return allOrders.map((o: any) => {
    // Find matching file for AI analysis
    const matchingFile = files.find((f: any) =>
      f.pdfFile?.includes(o.orderUrl) || o.orderUrl?.includes(f.pdfFile)
    );

    return {
      case_id: caseId,
      judge: o.judge ?? (o.judges ?? []).join(', ') ?? null,
      hearing_date: normalizeDate(o.hearingDate ?? o.date),
      order_date: normalizeDate(o.orderDate ?? o.date),
      order_number: o.orderUrl ?? null,
      bench: o.bench ?? null,
      order_details: o.purpose ?? o.orderDetails ?? null,
      summary: matchingFile?.aiAnalysis?.intelligent_insights_analytics
        ?.order_significance_and_impact_assessment?.ai_generated_executive_summary ?? null,
      order_link: o.orderUrl ?? null,
      pdf_base64: null, // eCourtsIndia doesn't return inline base64 for orders
    };
  }).filter((o: any) => o.hearing_date || o.order_date);
}

/**
 * Extract documents from eCourtsIndia case detail
 */
export function extractDocuments(apiResponse: any, caseId: string): any[] {
  const cc = apiResponse?.data?.courtCaseData ?? {};
  const documents = cc.documents ?? [];
  if (!Array.isArray(documents)) return [];

  return documents.map((d: any, idx: number) => ({
    case_id: caseId,
    sr_no: d.srNo ?? String(idx + 1),
    document_filed: d.documentFiled ?? d.documentType ?? null,
    filed_by: d.filedBy ?? null,
    advocate: d.advocate ?? null,
    document_no: d.documentNo ?? null,
    date_of_receiving: normalizeDate(d.dateOfReceiving ?? d.filedDate),
    document_type: d.documentType ?? null,
    document_url: d.documentUrl ?? null,
    pdf_base64: null,
  }));
}

/**
 * Extract petitioners from eCourtsIndia case detail
 */
export function extractPetitioners(apiResponse: any, caseId: string): any[] {
  const cc = apiResponse?.data?.courtCaseData ?? {};
  const petitioners: string[] = cc.petitioners ?? [];
  const advocates: string[] = cc.petitionerAdvocates ?? [];

  return petitioners.map((name: string, idx: number) => ({
    case_id: caseId,
    petitioner_name: name,
    advocate_name: advocates[idx] ?? advocates[0] ?? null,
  })).filter((p: any) => p.petitioner_name);
}

/**
 * Extract respondents from eCourtsIndia case detail
 */
export function extractRespondents(apiResponse: any, caseId: string): any[] {
  const cc = apiResponse?.data?.courtCaseData ?? {};
  const respondents: string[] = cc.respondents ?? [];
  const advocates: string[] = cc.respondentAdvocates ?? [];

  return respondents.map((name: string, idx: number) => ({
    case_id: caseId,
    respondent_name: name,
    advocate_name: advocates[idx] ?? advocates[0] ?? null,
  })).filter((r: any) => r.respondent_name);
}

/**
 * Extract IA details from eCourtsIndia case detail
 */
export function extractIADetails(apiResponse: any, caseId: string): any[] {
  const cc = apiResponse?.data?.courtCaseData ?? {};
  const iaDetails = cc.iaDetails ?? cc.interlocutoryApplications ?? [];
  if (!Array.isArray(iaDetails)) return [];

  return iaDetails.map((ia: any) => ({
    case_id: caseId,
    ia_number: ia.iaNumber ?? ia.iaNo ?? null,
    party: ia.party ?? ia.filedBy ?? null,
    date_of_filing: normalizeDate(ia.filingDate ?? ia.dateOfFiling),
    next_date: normalizeDate(ia.nextDate),
    ia_status: ia.status ?? ia.iaStatus ?? 'Pending',
  })).filter((ia: any) => ia.ia_number);
}

/**
 * Extract objections from eCourtsIndia case detail
 */
export function extractObjections(apiResponse: any, caseId: string): any[] {
  const cc = apiResponse?.data?.courtCaseData ?? {};
  const objections = cc.objections ?? [];
  if (!Array.isArray(objections)) return [];

  return objections.map((o: any) => ({
    case_id: caseId,
    sr_no: o.srNo ?? null,
    objection: o.objection ?? null,
    receipt_date: normalizeDate(o.receiptDate),
    scrutiny_date: normalizeDate(o.scrutinyDate),
    compliance_date: normalizeDate(o.complianceDate),
  }));
}
