
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function capture() {
    const { data, error } = await supabase
        .from('cases')
        .select('fetch_message')
        .eq('id', 'bd648976-44f3-4616-8974-bd3d87c5121b')
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        fs.writeFileSync('captured_error.txt', data.fetch_message || '');
        console.log("Captured full error to captured_error.txt");
    }
}

capture();
