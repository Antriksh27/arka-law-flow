
const supabaseUrl = "https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/legalkart-api";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

// CNR for CRA/132/2020: GJHC240132232020

async function fetchCase() {
    console.log("Fetching case CRA/132/2020 (CNR: GJHC240132232020) from GHC...");

    try {
        const payload = {
            searchType: 'gujarat_high_court',
            caseMode: 'CNR Number',
            cnr: 'GJHC240132232020'
        };

        const response = await fetch(supabaseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
            return;
        }

        const json = await response.json();

        console.log("\n--- API Response Structure ---");
        // The API returns { data: mappedData } or similar structure
        console.log(JSON.stringify(json, null, 2));

    } catch (error) {
        console.error("Fetch error:", error);
    }
}

fetchCase();
