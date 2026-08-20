import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xexotpveumenvjlknvcg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhleG90cHZldW1lbnZqbGtudmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjUzNTMsImV4cCI6MjEwMjA0MTM1M30.0BteTinzZ8nv7q4elhx_8xeUoLFUTdgWuI50OKlwBMU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const initialCategories = [
  {
    id: 1,
    name: 'HEADSETS',
    slug: 'headsets',
    description: 'High-performance wireless earbuds, noise-cancelling headphones & AirPods.',
    short_description: 'Earbuds, AirPods & Headphones.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
    is_active: true,
  },
  {
    id: 2,
    name: 'SMART WATCHES',
    slug: 'smart-watches',
    description: 'High-tech smartwatches, fitness trackers & classic timepieces.',
    short_description: 'Smartwatches, fitness & classic.',
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&h=600&fit=crop',
    is_active: true,
  },
  {
    id: 3,
    name: 'CREATOR KIT',
    slug: 'creator-kit',
    description: 'Professional microphones, video lighting, stands & creator equipment.',
    short_description: 'Mics, lighting & video gear.',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=800&h=600&fit=crop',
    is_active: true,
  },
  {
    id: 4,
    name: 'ACCESSORIES',
    slug: 'accessories',
    description: 'Chargers, cables, power banks, adapters & mobile accessories.',
    short_description: 'Chargers, cables & power banks.',
    image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800&h=600&fit=crop',
    is_active: true,
  },
];

async function seedCategories() {
  console.log('Seeding initial 4 Main Categories into Supabase...');
  for (const cat of initialCategories) {
    const { data, error } = await supabase.from('categories').upsert([cat], { onConflict: 'id' }).select();
    if (error) {
      console.error(`Failed to seed ${cat.name}:`, error);
    } else {
      console.log(`Seeded category ${cat.name}:`, data?.[0]?.name);
    }
  }
}

seedCategories();
