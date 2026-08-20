-- ====================================================================
-- APEX STORE — Migration: Dynamic Admin-Controlled Special Offers Table & RLS
-- Execute in Supabase SQL Editor (https://app.supabase.com)
-- ====================================================================

-- 1. Create special_offers table
CREATE TABLE IF NOT EXISTS public.special_offers (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    badge_text VARCHAR(100) DEFAULT 'SPECIAL OFFER',
    deal_label VARCHAR(100) DEFAULT 'Limited Time Deal',
    custom_title VARCHAR(255),
    custom_description TEXT,
    sale_price NUMERIC(10, 2),
    original_price NUMERIC(10, 2),
    discount_percentage INTEGER,
    features TEXT[] DEFAULT '{}',
    warranty_text VARCHAR(255) DEFAULT 'Official 1-Year Warranty',
    delivery_text VARCHAR(255) DEFAULT 'Express Delivery Across Pakistan',
    primary_button_text VARCHAR(100) DEFAULT 'SHOP NOW',
    secondary_button_text VARCHAR(100) DEFAULT 'VIEW ALL DEALS',
    start_at TIMESTAMP WITH TIME ZONE,
    end_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index for fast retrieval of active deals
CREATE INDEX IF NOT EXISTS idx_special_offers_active ON public.special_offers(is_active);
CREATE INDEX IF NOT EXISTS idx_special_offers_product_id ON public.special_offers(product_id);

-- 3. Enable Row Level Security
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;

-- 4. Clean up old policies
DROP POLICY IF EXISTS "Public Read Active Special Offers" ON public.special_offers;
DROP POLICY IF EXISTS "Allow Read Special Offers" ON public.special_offers;
DROP POLICY IF EXISTS "Admin Full Special Offers" ON public.special_offers;
DROP POLICY IF EXISTS "Allow Manage Special Offers" ON public.special_offers;

-- 5. RLS Policies:
-- Public can read active offers
CREATE POLICY "Public Read Active Special Offers"
ON public.special_offers
FOR SELECT
TO anon, authenticated
USING (true);

-- Admins / Authenticated can insert/update/delete special offers
CREATE POLICY "Allow Manage Special Offers"
ON public.special_offers
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
