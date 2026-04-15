require('dotenv').config();

const SUPABASE_URL = "https://hpcnipcbymruvsnqrmjx.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";
const FIRM_ID = "7d446806-0107-6201-9311-20a221234567"; // A dummy firm ID or the actual one

async function triggerRefresh() {
    const url = `${SUPABASE_URL}/functions/v1/ecourts-api`;
    const body = {
        action: 'case_refresh',
        cnr: 'GJHC240042732023',
        firmId: '0c722510-de15-46aa-ac46-2f0ca373c68a' // The actual firm ID for the case we found
    };

    console.log("Triggering refresh for GJHC240042732023...");
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
}

triggerRefresh();
