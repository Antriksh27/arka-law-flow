const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const CASE_ID = 'a169e234-e8e3-4faf-bedd-5ce4da386eac';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

(async () => {
    // 1. Get case data
    const { data: caseData, error: caseErr } = await supabase.from('cases').select('*').eq('id', CASE_ID).single();
    if (caseErr || !caseData) { console.error('Case not found:', caseErr); return; }

    console.log('Case:', caseData.case_number, '| CNR:', caseData.cnr_number);
    console.log('Reg No:', caseData.registration_number, '| Filing No:', caseData.filing_number);
    console.log('Court type:', caseData.court_type);

    // 2. Get firm_id from team_members
    const { data: team } = await supabase.from('team_members').select('firm_id').limit(1).single();
    if (!team) { console.error('No team member found'); return; }
    console.log('Firm ID:', team.firm_id);

    // 3. Parse case number for GHC (X-OBJ/26562/2018)
    const caseNum = caseData.registration_number || caseData.case_number || '';
    console.log('Parsing case number:', caseNum);

    // Parse X-OBJ/26562/2018 format
    const parts = caseNum.trim().replace(/\/+/g, '/').split('/');
    let caseType = null, caseNo = null, caseYear = null;
    for (let i = parts.length - 1; i >= 0; i--) {
        if (/^\d{4}$/.test(parts[i])) {
            caseYear = parts[i];
            if (i > 0 && /^\d+$/.test(parts[i - 1])) caseNo = parts[i - 1];
            break;
        }
    }
    for (const p of parts) {
        if (!/^\d+$/.test(p)) { caseType = p.toUpperCase(); break; }
    }

    console.log('Parsed → type:', caseType, '| no:', caseNo, '| year:', caseYear);

    if (!caseType || !caseNo || !caseYear) {
        console.error('Could not parse GHC case number. Available fields:');
        console.log('  cases.case_number:', caseData.case_number);
        console.log('  cases.registration_number:', caseData.registration_number);
        console.log('  cases.filing_number:', caseData.filing_number);
        return;
    }

    // 4. Call the Edge Function
    console.log('\n📡 Calling legalkart-api with GHC registration params...');
    const payload = {
        action: 'search',
        cnr: caseData.cnr_number,
        searchType: 'gujarat_high_court',
        caseMode: 'REGISTRATION',
        caseType,
        caseNo,
        caseYear,
        caseId: CASE_ID,
        firmId: team.firm_id
    };
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const { data: result, error: fnErr } = await supabase.functions.invoke('legalkart-api', { body: payload });

    if (fnErr) {
        console.error('Edge function error:', fnErr);
        if (fnErr.context?.json) {
            try { const j = await fnErr.context.json(); console.error('Details:', JSON.stringify(j)); } catch (e) { }
        }
        return;
    }

    console.log('\n✅ Result:', JSON.stringify(result, null, 2));

    // 5. Check DB
    const { data: orders } = await supabase.from('case_orders').select('order_date, judge, order_number').eq('case_id', CASE_ID).limit(5);
    const { data: hearings } = await supabase.from('case_hearings').select('hearing_date, judge').eq('case_id', CASE_ID).limit(3);
    const { data: lkCase } = await supabase.from('legalkart_cases').select('id, registration_number, filing_number').eq('case_id', CASE_ID).maybeSingle();

    console.log('\n📊 DB Check:');
    console.log('legalkart_cases row:', lkCase);
    console.log('Orders count:', orders?.length, orders?.slice(0, 3));
    console.log('Hearings count:', hearings?.length, hearings?.slice(0, 2));
})();
