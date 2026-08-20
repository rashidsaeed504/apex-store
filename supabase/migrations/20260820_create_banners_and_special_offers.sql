-- ====================================================================
-- APEX STORE — Migration: Global Banners, Hero Slides & Special Offers
-- Run directly in Supabase SQL Editor (https://app.supabase.com)
-- ====================================================================

-- 1. Banners Table (Full-Width & Promotional Homepage Banners)
CREATE TABLE IF NOT EXISTS public.banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    badge_text VARCHAR(100),
    image_url TEXT,
    button_text VARCHAR(100) DEFAULT 'SHOP NOW',
    button_url VARCHAR(255) DEFAULT '/shop',
    open_in_new_tab BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Hero Slides Table (Homepage Hero Slider)
CREATE TABLE IF NOT EXISTS public.hero_slides (
    id SERIAL PRIMARY KEY,
    badge VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    highlight_text VARCHAR(255),
    description TEXT,
    primary_button_text VARCHAR(100) DEFAULT 'SHOP NOW',
    primary_button_link VARCHAR(255) DEFAULT '/shop',
    secondary_button_text VARCHAR(100) DEFAULT 'EXPLORE DEALS',
    secondary_button_link VARCHAR(255) DEFAULT '/deals',
    desktop_image_url TEXT,
    mobile_image_url TEXT,
    features JSONB DEFAULT '["100% Original", "Free Delivery", "7 Days Return", "24/7 Support"]'::jsonb,
    promotional_badge VARCHAR(100) DEFAULT 'FLAGSHIP',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 1,
    autoplay_duration INTEGER DEFAULT 6000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Special Offers Table (Homepage Dynamic Deal Section)
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
    features JSONB DEFAULT '[]'::jsonb,
    warranty_text VARCHAR(255) DEFAULT 'Official 1-Year Warranty',
    delivery_text VARCHAR(255) DEFAULT 'Express Delivery Across Pakistan',
    primary_button_text VARCHAR(100) DEFAULT 'SHOP NOW',
    secondary_button_text VARCHAR(100) DEFAULT 'VIEW ALL DEALS',
    start_at TIMESTAMP WITH TIME ZONE,
    end_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;

-- 5. Public Read Policies (Allow any customer on any device to view active content)
DROP POLICY IF EXISTS "Public Read Banners" ON public.banners;
CREATE POLICY "Public Read Banners" ON public.banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Hero Slides" ON public.hero_slides;
CREATE POLICY "Public Read Hero Slides" ON public.hero_slides FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Special Offers" ON public.special_offers;
CREATE POLICY "Public Read Special Offers" ON public.special_offers FOR SELECT USING (true);

-- 6. Management Policies (Allow Admin / authenticated & storefront synchronization)
DROP POLICY IF EXISTS "Allow Manage Banners" ON public.banners;
CREATE POLICY "Allow Manage Banners" ON public.banners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Manage Hero Slides" ON public.hero_slides;
CREATE POLICY "Allow Manage Hero Slides" ON public.hero_slides FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Manage Special Offers" ON public.special_offers;
CREATE POLICY "Allow Manage Special Offers" ON public.special_offers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
