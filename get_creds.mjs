
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function getCreds() {
    console.log("Getting Legalkart credentials...");
    try {
        const { data, error } = await supabase
            .from('firms')
            .select('id, legalkart_user_id, legalkart_hash_key')
            .not('legalkart_user_id', 'is', null)
            .limit(1);

        if (error) {
            console.error("Error reading firms:", error);
            return;
        }

        console.log("Credentials:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Script error:", error);
    }
}

getCreds();
