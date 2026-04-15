
const supabaseUrl = "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

async function testSearch() {
    console.log("Testing search with MISSING CNR (should fail Zod)...");
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/legalkart-api`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey
            },
            body: JSON.stringify({
                action: 'search',
                searchType: 'high_court',
                firmId: '26643440-425b-4654-9343-7f311df92953'
            })
        });

        const data = await response.json();
        console.log("Response status:", response.status);
        console.log("Response data:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testSearch();
