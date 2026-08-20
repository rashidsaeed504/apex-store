import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xexotpveumenvjlknvcg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhleG90cHZldW1lbnZqbGtudmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjUzNTMsImV4cCI6MjEwMjA0MTM1M30.0BteTinzZ8nv7q4elhx_8xeUoLFUTdgWuI50OKlwBMU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const candidateTables = [
  'products',
  'categories',
  'subcategories',
  'orders',
  'order_items',
  'profiles',
  'hero_slides',
  'banners',
  'hero_banners',
  'hero',
  'slides',
  'special_offers',
  'social_gallery',
  'site_settings',
  'app_settings',
  'cms',
  'cms_config'
];

async function checkAll() {
  console.log('--- Probing candidate tables on remote Supabase ---');
  for (const table of candidateTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      console.log(`✅ Table '${table}' exists! Sample row count query succeeded. Length:`, data?.length);
    } else {
      console.log(`❌ Table '${table}' returned: ${error.code} - ${error.message}`);
    }
  }
}

checkAll();
