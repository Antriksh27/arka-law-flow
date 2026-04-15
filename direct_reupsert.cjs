const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CASE_ID = '388c16a4-e9c2-429f-a4e1-ce1f4f67b40e';

function parseDate(dateStr) {
    if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return null;
    const s = dateStr.toString().trim();
    // DD-MM-YYYY
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(s)) {
        const [d, m, y] = s.split('-');
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    // DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
        const [d, m, y] = s.split('/');
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    // ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    return null;
}

function parseOrders(ordersData) {
    if (!ordersData) return [];
    const arr = Array.isArray(ordersData) ? ordersData : [ordersData];
    return arr.map(o => {
        // GHC Title Case keys
        const ghcOrderDate = o['Order Date'];
        const ghcJudge = o['Judge Name'];
        const ghcPdf = o['Download Pdf'] || o.Judgement || o.judgement;
        const ghcOrderNo = o['S.No.'];
        const ghcDetails = o['Case Details'] || o['Case details'];

        // Standard LegalKart HC keys
        const hcOrderDate = !ghcOrderDate ? (o.hearing_date || o.order_date || o.date) : null;
        const hcJudge = !ghcJudge ? (o.business_on_date || o.judge_name || o.judge) : null;
        const hcOrderNo = !ghcOrderNo ? (o.cause_list_type || o.order_number || o.order_no) : null;
        const hcDetails = !ghcDetails ? (o.purpose_of_hearing || o.order_details || o.details) : null;
        const hcPdf = !ghcPdf ? (o.order_link || o.pdf_url || o.pdf_link) : null;

        const finalOrderDate = ghcOrderDate || hcOrderDate || null;
        const finalJudge = ghcJudge || hcJudge || null;
        const finalPdf = ghcPdf || hcPdf || null;
        const finalOrderNo = ghcOrderNo || hcOrderNo || null;
        const finalDetails = ghcDetails || hcDetails || null;

        // Skip header rows using raw fields
        const rawJudge = (o.judge || '').toLowerCase().trim();
        const rawDate = (o.hearing_date || o.order_date || '').toLowerCase().trim();
        const isHeader = rawJudge === 'order on' || rawDate === 'order date' ||
            rawJudge === 'judge' || rawJudge === 'sr.no.' || rawJudge === 's.no.';
        if (isHeader) { console.log('  Skip header row:', rawJudge); return null; }

        const isBase64 = typeof finalPdf === 'string' && (finalPdf.startsWith('JVBERi') || finalPdf.length > 500);
        return {
            orderDate: parseDate(finalOrderDate),
            judge: finalJudge || null,
            orderNumber: finalOrderNo || null,
            orderDetails: finalDetails || null,
            pdfUrl: isBase64 ? null : (finalPdf || null),
            pdfBase64: isBase64 ? finalPdf : null
        };
    }).filter(o => !!o && !!(o.orderDate || o.judge || o.pdfUrl || o.pdfBase64));
}

function parseHearings(hearingsData) {
    if (!hearingsData) return [];
    const arr = Array.isArray(hearingsData) ? hearingsData : [hearingsData];
    return arr.map(h => {
        const notifiedDate = h['Notified Date'];
        const stage = h['Stage'];
        const coram = h['Coram'];
        const courtCode = h['Court Code'] || h.court_code;
        const action = h['Action'] || h.outcome;
        const boardSrNo = h['Board Sr No'] || h.board_sr_no;

        const finalDate = notifiedDate || h.hearing_date || h.date;
        const finalPurpose = stage || h.purpose_of_hearing || h.purpose;
        const finalJudge = coram || h.judge_name || h.judge;
        const finalHearingType = h.cause_list_type || h.hearing_type || null;

        return {
            hearingDate: parseDate(finalDate),
            purpose: finalPurpose || null,
            judge: finalJudge || null,
            courtCode: courtCode || null,
            action: action || null,
            boardSrNo: boardSrNo || null,
            hearingType: finalHearingType
        };
    }).filter(h => h.hearingDate || h.purpose || h.judge);
}

async function main() {
    const { data: caseRow } = await supabase.from('cases').select('fetched_data').eq('id', CASE_ID).single();
    const fd = caseRow?.fetched_data;
    let rd = fd?.['API Details'] ?? fd?.data ?? fd ?? {};
    if (Array.isArray(rd)) rd = rd[0] || {};

    const ordersData = rd.order_details || rd.orders || rd['Available Orders'];
    const hearingsData = rd.case_history || rd.history_of_case_hearing || rd['Court Proceedings'] || rd.hearings;

    const parsedOrders = parseOrders(ordersData);
    const parsedHearings = parseHearings(hearingsData);

    console.log(`Parsed ${parsedOrders.length} orders, ${parsedHearings.length} hearings`);
    if (parsedOrders.length === 0 && parsedHearings.length === 0) {
        console.log('Nothing to insert!'); return;
    }

    // Delete old data
    console.log('Deleting old orders and hearings...');
    await supabase.from('case_orders').delete().eq('case_id', CASE_ID);
    await supabase.from('case_hearings').delete().eq('case_id', CASE_ID);

    // Insert orders
    if (parsedOrders.length > 0) {
        const { error } = await supabase.from('case_orders').insert(
            parsedOrders.map(o => ({
                case_id: CASE_ID,
                judge: o.judge,
                order_date: o.orderDate,
                order_number: o.orderNumber,
                order_details: o.orderDetails,
                order_link: o.pdfUrl,
                pdf_base64: o.pdfBase64,
            }))
        );
        if (error) console.error('Order insert error:', JSON.stringify(error));
        else console.log(`Inserted ${parsedOrders.length} orders`);
    }

    // Insert hearings
    if (parsedHearings.length > 0) {
        const { error } = await supabase.from('case_hearings').insert(
            parsedHearings.map(h => ({
                case_id: CASE_ID,
                hearing_date: h.hearingDate,
                judge: h.judge,
                purpose_of_hearing: h.purpose,
                outcome: h.action,
                notes: h.boardSrNo ? `Board Sr No: ${h.boardSrNo}` : null,
                bench_type: h.hearingType || null,
            }))
        );
        if (error) console.error('Hearing insert error:', JSON.stringify(error));
        else console.log(`Inserted ${parsedHearings.length} hearings`);
    }

    // Verify
    const { data: orders } = await supabase.from('case_orders').select('order_date, judge, order_number').eq('case_id', CASE_ID).limit(4);
    console.log('\nOrders now in DB:');
    orders?.forEach((o, i) => console.log(`  #${i + 1}:`, JSON.stringify(o)));
}

main().catch(console.error);
