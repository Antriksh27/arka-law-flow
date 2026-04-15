
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/legalkart-api";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

async function testGhcOnGeneralHc() {
    console.log("Testing GHC CNR on general high_court endpoint...");
    const payload = {
        action: 'search',
        searchType: 'high_court', // Specifically using general high_court
        cnr: 'GJHC240530532018'
    };

    try {
        const response = await fetch(supabaseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}

testGhcOnGeneralHc();
