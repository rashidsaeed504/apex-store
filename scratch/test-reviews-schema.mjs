import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xexotpveumenvjlknvcg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhleG90cHZldW1lbnZqbGtudmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjUzNTMsImV4cCI6MjEwMjA0MTM1M30.0BteTinzZ8nv7q4elhx_8xeUoLFUTdgWuI50OKlwBMU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectReviewsTable() {
  console.log('--- Probing Supabase reviews table ---');
  const { data, error } = await supabase.from('reviews').select('*').limit(5);
  if (error) {
    console.log('reviews query error:', error.code, error.message);
  } else {
    console.log('✅ reviews table exists! Row count:', data.length);
    if (data.length > 0) {
      console.log('Sample review row keys:', Object.keys(data[0]));
      console.log('Sample review:', data[0]);
    }
  }
}

inspectReviewsTable();
