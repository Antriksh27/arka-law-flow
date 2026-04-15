
// Mock function to test mapping logic
function mapLegalkartDataToCRM(data: any, searchType: string = 'unknown'): any {
    if (!data || typeof data !== 'object') {
        return null;
    }

    console.log(`Mapping ${searchType} data based on provided sample structure`);

    const mappedData: any = {
        fetched_data: data,
        is_auto_fetched: true,
        fetch_status: 'success',
        fetch_message: `Data fetched from ${searchType} on ${new Date().toISOString()}`,
        last_fetched_at: new Date().toISOString(),
    };

    // Helper date parser
    const parseDate = (dateStr: string | null | undefined): string | null => {
        if (!dateStr || dateStr === '-' || dateStr === 'null') return null;
        try {
            const raw = dateStr.toString().trim();
            // DD/MM/YYYY
            if (raw.includes('/')) {
                const [day, month, year] = raw.split('/');
                if (year && month && day) return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            return raw;
        } catch {
            return null;
        }
    };

    // ---------------------------------------------------------------------------
    // GUJARAT HIGH COURT MAPPING LOGIC
    // ---------------------------------------------------------------------------

    // Check for GHC keys (Title Case with spaces as per user sample)
    const header = data['Case Header'] || data.case_header;
    const parties = data['Parties'] || data.parties;

    if (header) {
        console.log('🏛️ Detected Gujarat High Court data structure');

        const meta = data['Case Meta'] || data.case_meta || {};
        const disposal = data['Disposal Details'] || data.disposal_details || {};
        // parties define above

        mappedData.case_title = header['Case Title'] || header.case_title || null;
        mappedData.cnr_number = header['Cnr No'] || header.cnr_no || null;
        mappedData.status = header['Status'] || header.status || null;

        // Parse Case Number from Title: "CIVIL REVISION APPLICATION - No. 132 of 2020"
        if (mappedData.case_title) {
            const titleParts = mappedData.case_title.split(' - ');
            if (titleParts.length > 1) {
                mappedData.case_number = titleParts[1]; // No. 132 of 2020
                mappedData.case_type = titleParts[0];   // CIVIL REVISION APPLICATION
            }
        }

        // Dates
        mappedData.filing_date = parseDate(meta['Presented On'] || meta.presented_on);
        mappedData.registration_date = parseDate(meta['Registered On'] || meta.registered_on);
        mappedData.disposal_date = parseDate(disposal['Disposal Date'] || disposal.disposal_date);

        // Court Info
        mappedData.court = 'Gujarat High Court';
        mappedData.court_type = 'high_court';
        mappedData.state = 'Gujarat';
        mappedData.district = meta['District'] || meta.district || null;
        mappedData.bench_type = meta['Bench Category'] || meta.bench_category || null;
        mappedData.coram = disposal['Decided By'] || disposal.decided_by || null;

        // Additional Fields
        mappedData.stage = meta['Purpose Of Listing'] || meta.purpose_of_listing || null;
        mappedData.under_act = meta['Act'] || meta.act || null; // This might need parsing if it's long

        // Parties
        if (parties) {
            const petitioners = parties['Petitioners'] || parties.petitioners || [];
            const respondents = parties['Respondents'] || parties.respondents || [];

            if (Array.isArray(petitioners) && petitioners.length > 0) {
                mappedData.petitioner = petitioners.map((p: any) => p['Name'] || p.name).join(', ');
                mappedData.petitioner_advocate = petitioners.map((p: any) => p['Advocate On Record'] || p.advocate_on_record).filter(Boolean).join('; ');
            }

            if (Array.isArray(respondents) && respondents.length > 0) {
                mappedData.respondent = respondents.map((r: any) => r['Name'] || r.name).join(', ');
                mappedData.respondent_advocate = respondents.map((r: any) => r['Advocate On Record'] || r.advocate_on_record).filter(Boolean).join('; ');
            }
        }

        // History / Orders if available
        const proceedings = data['Court Proceedings'] || data.court_proceedings || [];
        if (Array.isArray(proceedings) && proceedings.length > 0) {
            // We can map these to hearings if needed, but for CRM basic fields:
            const lastProceeding = proceedings[proceedings.length - 1];
            if (lastProceeding) {
                mappedData.next_hearing_date = parseDate(lastProceeding['Notified Date']); // Or maybe this is past date?
                mappedData.stage = lastProceeding['Stage'] || mappedData.stage;
                if (!mappedData.coram) {
                    mappedData.coram = lastProceeding['Coram'];
                }
            }
        }

        return mappedData;
    }

    // Fallback / Standard mapping...
    return { error: "Not GHC structure" };
}

// Run test
import { readFileSync } from 'fs';
try {
    const rawData = readFileSync('./ghc_sample_response.json', 'utf-8');
    const data = JSON.parse(rawData);
    const result = mapLegalkartDataToCRM(data, 'gujarat_high_court');
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    console.error("Error reading or parsing sample:", error);
}
