
import fs from 'fs';

// Helper to normalize dates (simplified version for testing)
const normalizeDate = (val: any): string | null => {
  if (!val) return null;
  const s = String(val).trim();
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  return s;
};

async function testRelationalMapping() {
  const rawData = JSON.parse(fs.readFileSync('ghc_sample_response.json', 'utf8'));
  const rd = rawData.data || rawData;

  const isGHC = rd['Case Header'] !== undefined;
  let petitioners: any[] = [];
  let respondents: any[] = [];
  let hearings: any[] = [];
  let orders: any[] = [];

  if (isGHC) {
    console.log('🏛️ Detected Gujarat High Court structure');
    const parties = rd['Parties'] || {};
    const ghcPetitioners = Array.isArray(parties.Petitioners) ? parties.Petitioners : [];
    const ghcRespondents = Array.isArray(parties.Respondents) ? parties.Respondents : [];
    
    petitioners = ghcPetitioners.map((p: any) => ({ 
      name: p.Name || p['Full Name'], 
      advocate: p['Advocate On Record'] || p['Advocate'] 
    }));
    respondents = ghcRespondents.map((r: any) => ({ 
      name: r.Name || r['Full Name'], 
      advocate: r['Advocate On Record'] || r['Advocate'] 
    }));
    
    const ghcHearings = Array.isArray(rd['Court Proceedings']) ? rd['Court Proceedings'] : [];
    hearings = ghcHearings.map((h: any) => ({
      date: normalizeDate(h['Notified Date'] || h['Hearing Date']),
      judge: h['Coram'] || h['Judge'],
      purpose: h['Purpose'],
      stage: h['Stage']
    }));

    const ghcOrders = Array.isArray(rd['Available Orders']) ? rd['Available Orders'] : [];
    orders = ghcOrders.map((o: any) => ({
      date: normalizeDate(o['Order Date']),
      judge: o['Judge Name'] || o['Judge'],
      pdf_url: o['PDF Link'],
      details: o['Order Type'] || 'Order'
    }));
  }

  console.log('\n--- Petitioners ---');
  console.log(JSON.stringify(petitioners, null, 2));
  
  console.log('\n--- Respondents ---');
  console.log(JSON.stringify(respondents, null, 2));

  console.log('\n--- Hearings (Sample) ---');
  console.log(JSON.stringify(hearings.slice(0, 2), null, 2));

  console.log('\n--- Orders (Sample) ---');
  console.log(JSON.stringify(orders.slice(0, 2), null, 2));
}

testRelationalMapping();
