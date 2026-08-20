-- ====================================================================
-- APEX STORE — Add Missing Columns Migration
-- Execute directly in Supabase SQL Editor (https://app.supabase.com)
-- ====================================================================

-- 1. Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory VARCHAR(255);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS full_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false;

-- 2. Add missing columns to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
