-- ====================================================================
-- APEX STORE — Subcategories & Product Sections Migration
-- Execute directly in Supabase SQL Editor (https://app.supabase.com)
-- ====================================================================

-- 1. Create subcategories table if it does not exist
CREATE TABLE IF NOT EXISTS public.subcategories (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES public.categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory_id INTEGER REFERENCES public.subcategories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory VARCHAR(255);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS full_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false;

-- 3. Enable RLS on subcategories table and set policies
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Read Subcategories" ON public.subcategories;
CREATE POLICY "Allow Read Subcategories" ON public.subcategories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Insert Subcategories" ON public.subcategories;
CREATE POLICY "Allow Insert Subcategories" ON public.subcategories FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Update Subcategories" ON public.subcategories;
CREATE POLICY "Allow Update Subcategories" ON public.subcategories FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow Delete Subcategories" ON public.subcategories;
CREATE POLICY "Allow Delete Subcategories" ON public.subcategories FOR DELETE USING (true);

-- 4. Sync SERIAL ID sequences for all tables
SELECT setval(pg_get_serial_sequence('public.products', 'id'), COALESCE((SELECT MAX(id) FROM public.products), 1));
SELECT setval(pg_get_serial_sequence('public.categories', 'id'), COALESCE((SELECT MAX(id) FROM public.categories), 1));
SELECT setval(pg_get_serial_sequence('public.subcategories', 'id'), COALESCE((SELECT MAX(id) FROM public.subcategories), 1));
