
const supabaseUrl = "https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/legalkart-api";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

async function testGhc(caseMode) {
    console.log(`\n--- Testing GHC with caseMode: ${caseMode} ---`);
    const payload = {
        action: 'search',
        searchType: 'high_court', // Should be remapped to gujarat_high_court
        cnr: 'GJHC240132232020',
        caseMode: caseMode,
        firmId: '26643440-425b-4654-9343-7f311df92953'
    };

    try {
        const response = await fetch(supabaseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("Status:", response.status);
        if (data.success) {
            console.log("✅ Success!");
            console.log("Title:", data.data?.['Case Header']?.['Case Title']);
        } else {
            console.log("❌ Failed:", data.error || data.message);
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

async function runTests() {
    await testGhc('CNR');
    await testGhc('CNR Number');
}

runTests();
