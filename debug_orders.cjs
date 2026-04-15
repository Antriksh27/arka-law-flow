const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

function parseDate(dateStr) {
    if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return null;
    const cleanDate = dateStr.toString().trim();
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(cleanDate)) {
        const [day, month, year] = cleanDate.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanDate)) {
        const [day, month, year] = cleanDate.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return null;
}

function parseOrders(ordersData) {
    if (!ordersData) return [];
    const ordersArray = Array.isArray(ordersData) ? ordersData : [ordersData];

    return ordersArray.map(o => {
        const ghcOrderDate = o['Order Date'];
        const ghcJudge = o['Judge Name'];
        const ghcPdf = o['Download Pdf'] || o.Judgement || o.judgement;
        const ghcOrderNo = o['S.No.'];
        const ghcDetails = o['Case Details'] || o['Case details'];

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

        // Header row check - using RAW fields on the object
        const rawJudgeValue = (o.judge || '').toLowerCase().trim();
        const rawDateValue = (o.hearing_date || o.order_date || '').toLowerCase().trim();
        const isHeaderRow = rawJudgeValue === 'order on' ||
            rawDateValue === 'order date' ||
            rawJudgeValue === 'judge' ||
            rawJudgeValue === 'sr.no.' ||
            rawJudgeValue === 's.no.';

        if (isHeaderRow) {
            console.log('  SKIPPED (header row): judge=', o.judge, 'hearing_date=', o.hearing_date);
            return null;
        }

        const isBase64 = typeof finalPdf === 'string' && (finalPdf.startsWith('JVBERi') || finalPdf.length > 500);
        return {
            orderDate: parseDate(finalOrderDate),
            judge: finalJudge || null,
            orderNumber: finalOrderNo || null,
            orderDetails: finalDetails || null,
            pdfUrl: isBase64 ? null : (finalPdf || null),
            pdfBase64: isBase64 ? '[BASE64]' : null
        };
    }).filter(o => !!o && !!(o.orderDate || o.judge || o.pdfUrl || o.pdfBase64));
}

async function main() {
    const { data, error } = await supabase
        .from('cases')
        .select('id, case_number, fetched_data')
        .eq('id', '388c16a4-e9c2-429f-a4e1-ce1f4f67b40e')
        .single();

    if (error) { console.error('DB Error:', error); return; }

    const fd = data.fetched_data;
    let rd = fd?.['API Details'] ?? fd?.data ?? fd ?? {};
    if (Array.isArray(rd)) rd = rd[0] || {};

    console.log('rd top keys:', Object.keys(rd));

    const ordersData = rd.order_details || rd.orders || rd['Available Orders'];
    console.log('\nRaw order count:', ordersData?.length);
    if (ordersData) {
        console.log('\n--- RAW ORDERS (first 4) ---');
        ordersData.slice(0, 4).forEach((o, i) => {
            console.log(`\nOrder #${i + 1} keys:`, Object.keys(o));
            console.log(`Order #${i + 1} values:`, JSON.stringify(o, null, 2));
        });
    }

    console.log('\n--- PARSED ORDERS ---');
    const parsed = parseOrders(ordersData);
    console.log('Parsed count:', parsed.length);
    parsed.slice(0, 5).forEach((o, i) => console.log(`Parsed #${i + 1}:`, JSON.stringify(o)));
}

main().catch(console.error);
