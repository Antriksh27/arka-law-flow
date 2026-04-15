const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

(async () => {
    const { data: cases } = await s.from('cases').select('id, case_number, court_type, updated_at').order('updated_at', { ascending: false }).limit(3);
    cases.forEach(c => console.log('CASE:', c.updated_at, '|', c.case_number));

    const id = cases[0].id;
    const { data: o } = await s.from('case_orders').select('order_date, judge, order_number, order_details').eq('case_id', id);
    const { data: h } = await s.from('case_hearings').select('hearing_date, judge, purpose_of_hearing').eq('case_id', id).limit(3);

    console.log('ORDERS COUNT:', o?.length);
    (o || []).slice(0, 5).forEach((row, i) => {
        console.log(`O${i}: date=${row.order_date} | judge=${row.judge?.substring(0, 40)} | num=${row.order_number} | details=${row.order_details?.substring(0, 30)}`);
    });

    console.log('HEARINGS COUNT:', h?.length);
    (h || []).slice(0, 3).forEach((row, i) => {
        console.log(`H${i}: date=${row.hearing_date} | judge=${row.judge?.substring(0, 40)} | purpose=${row.purpose_of_hearing?.substring(0, 30)}`);
    });
})();
