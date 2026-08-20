import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xexotpveumenvjlknvcg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhleG90cHZldW1lbnZqbGtudmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjUzNTMsImV4cCI6MjEwMjA0MTM1M30.0BteTinzZ8nv7q4elhx_8xeUoLFUTdgWuI50OKlwBMU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('--- Probing Supabase Hero / Banner tables ---');

async function testTables() {
  console.time('banners query');
  const { data: bannersData, error: bannersErr } = await supabase.from('banners').select('*');
  console.timeEnd('banners query');
  console.log('banners table:', bannersErr ? `Error: ${bannersErr.message}` : `Found ${bannersData?.length} rows`);
  if (bannersData?.length) console.log('Sample banner:', bannersData[0]);

  console.time('hero_slides query');
  const { data: heroData, error: heroErr } = await supabase.from('hero_slides').select('*');
  console.timeEnd('hero_slides query');
  console.log('hero_slides table:', heroErr ? `Error: ${heroErr.message}` : `Found ${heroData?.length} rows`);
  if (heroData?.length) console.log('Sample hero_slide:', heroData[0]);
}

testTables();
