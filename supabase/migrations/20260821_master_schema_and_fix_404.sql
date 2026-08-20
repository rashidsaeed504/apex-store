-- ====================================================================
-- APEX STORE — MASTER DATABASE MIGRATION & POSTGREST 404 FIX
-- Run this directly in Supabase SQL Editor (https://app.supabase.com)
-- Project: https://xexotpveumenvjlknvcg.supabase.co
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. HERO SLIDER TABLE (public.hero_slides)
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 2. PROMOTIONAL BANNERS TABLE (public.banners)
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 3. SOCIAL MEDIA GALLERY TABLE (public.social_gallery)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_gallery (
    id SERIAL PRIMARY KEY,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255) DEFAULT 'APEX Store Social Post',
    caption TEXT,
    link_url VARCHAR(255) DEFAULT 'https://www.instagram.com/apexstor.pk/',
    platform VARCHAR(50) DEFAULT 'Instagram',
    sort_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 4. SPECIAL OFFERS TABLE (public.special_offers)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.special_offers (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
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

-- --------------------------------------------------------------------
-- 5. PRODUCT REVIEWS TABLE (public.reviews)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID,
    author_name VARCHAR(150) NOT NULL,
    author_email VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    title VARCHAR(255),
    status VARCHAR(50) DEFAULT 'approved',
    is_verified_purchase BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 6. RETURN & REFUND POLICY SETTINGS (public.return_settings)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.return_settings (
    id SERIAL PRIMARY KEY,
    enabled BOOLEAN DEFAULT true,
    return_window_days INTEGER DEFAULT 7,
    allow_exchanges BOOLEAN DEFAULT true,
    require_receipt BOOLEAN DEFAULT false,
    require_original_packaging BOOLEAN DEFAULT true,
    require_images BOOLEAN DEFAULT true,
    max_images INTEGER DEFAULT 4,
    return_fee_type VARCHAR(50) DEFAULT 'free',
    return_fee_amount NUMERIC(10, 2) DEFAULT 0,
    return_reasons JSONB DEFAULT '[
        {"id": "defective", "label": "Product is defective / not functioning", "is_active": true},
        {"id": "damaged", "label": "Item arrived damaged / broken packaging", "is_active": true},
        {"id": "wrong_item", "label": "Received incorrect product / wrong variant", "is_active": true},
        {"id": "not_as_described", "label": "Item does not match website description", "is_active": true},
        {"id": "size_color", "label": "Color / Variant exchange request", "is_active": true},
        {"id": "performance", "label": "Quality / Performance not meeting expectations", "is_active": true}
    ]'::jsonb,
    auto_approve_exchanges BOOLEAN DEFAULT false,
    pickup_couriers JSONB DEFAULT '["Trax Logistics", "TCS Express", "Leopards Courier", "Call Courier", "M&P"]'::jsonb,
    custom_policy_text TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 7. CUSTOMER RETURNS & REFUNDS TABLE (public.returns)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.returns (
    id SERIAL PRIMARY KEY,
    return_number VARCHAR(100) UNIQUE NOT NULL,
    order_id INTEGER,
    order_number VARCHAR(100) NOT NULL,
    customer_id UUID,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    type VARCHAR(50) DEFAULT 'refund',
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    evidence_urls JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'requested',
    packaging_available BOOLEAN DEFAULT true,
    pickup_address TEXT,
    pickup_city VARCHAR(100),
    pickup_date DATE,
    courier_name VARCHAR(100),
    tracking_number VARCHAR(100),
    pickup_notes TEXT,
    refund_amount NUMERIC(10, 2) DEFAULT 0,
    deductions NUMERIC(10, 2) DEFAULT 0,
    deduction_reason TEXT,
    final_refund_amount NUMERIC(10, 2) DEFAULT 0,
    refund_method VARCHAR(50) DEFAULT 'original_payment',
    restock_items BOOLEAN DEFAULT true,
    admin_notes TEXT,
    status_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 8. COMPATIBILITY COLUMNS FOR ORDERS & PRODUCTS
-- --------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_order_token VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_special_offer BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10, 2);

-- --------------------------------------------------------------------
-- 9. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- --------------------------------------------------------------------
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 10. PUBLIC READ POLICIES (Allow storefront users to query content)
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Public Read Hero Slides" ON public.hero_slides;
CREATE POLICY "Public Read Hero Slides" ON public.hero_slides FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Banners" ON public.banners;
CREATE POLICY "Public Read Banners" ON public.banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Social Gallery" ON public.social_gallery;
CREATE POLICY "Public Read Social Gallery" ON public.social_gallery FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Special Offers" ON public.special_offers;
CREATE POLICY "Public Read Special Offers" ON public.special_offers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Reviews" ON public.reviews;
CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Return Settings" ON public.return_settings;
CREATE POLICY "Public Read Return Settings" ON public.return_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Returns" ON public.returns;
CREATE POLICY "Public Read Returns" ON public.returns FOR SELECT USING (true);

-- --------------------------------------------------------------------
-- 11. MANAGEMENT POLICIES (Allow Admin / authenticated & anon full CRUD)
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow Manage Hero Slides" ON public.hero_slides;
CREATE POLICY "Allow Manage Hero Slides" ON public.hero_slides FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Manage Banners" ON public.banners;
CREATE POLICY "Allow Manage Banners" ON public.banners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Manage Social Gallery" ON public.social_gallery;
CREATE POLICY "Allow Manage Social Gallery" ON public.social_gallery FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Manage Special Offers" ON public.special_offers;
CREATE POLICY "Allow Manage Special Offers" ON public.special_offers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Manage Reviews" ON public.reviews;
CREATE POLICY "Allow Manage Reviews" ON public.reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Manage Return Settings" ON public.return_settings;
CREATE POLICY "Allow Manage Return Settings" ON public.return_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Manage Returns" ON public.returns;
CREATE POLICY "Allow Manage Returns" ON public.returns FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------
-- 12. INITIAL SEED DATA
-- --------------------------------------------------------------------

-- Seed Hero Slides
INSERT INTO public.hero_slides (id, badge, title, highlight_text, description, primary_button_text, primary_button_link, secondary_button_text, secondary_button_link, desktop_image_url, mobile_image_url, features, promotional_badge, is_active, sort_order, autoplay_duration)
SELECT 
    1, 
    'NEXT-GEN GAMING AUDIO', 
    'BX-608 WIRELESS GAMING EARBUDS', 
    'WITH APEX ULTRA LOW LATENCY', 
    'Engineered for competitive esports with 45ms ultra-low latency, dynamic RGB gaming chassis, dual ENC noise-canceling microphones, and 36-hour extended battery life.', 
    'SHOP NOW', 
    '/shop', 
    'EXPLORE DEALS', 
    '/deals', 
    'https://i.pinimg.com/736x/87/3e/60/873e6066bb1b22f18075278e9111b505.jpg', 
    'https://i.pinimg.com/736x/87/3e/60/873e6066bb1b22f18075278e9111b505.jpg', 
    '["100% Original Guarantee", "Free Delivery in Pakistan", "7-Day Return Policy", "24/7 Priority Support"]'::jsonb, 
    'FLAGSHIP', 
    true, 
    1, 
    6000
WHERE NOT EXISTS (SELECT 1 FROM public.hero_slides WHERE id = 1);

INSERT INTO public.hero_slides (id, badge, title, highlight_text, description, primary_button_text, primary_button_link, secondary_button_text, secondary_button_link, desktop_image_url, mobile_image_url, features, promotional_badge, is_active, sort_order, autoplay_duration)
SELECT 
    2, 
    'PREMIUM ACTIVE NOISE CANCELLATION', 
    'APEX PRO WIRELESS HEADPHONES', 
    'STUDIO GRADE ACOUSTIC PRECISION', 
    'Immerse in pure sonic clarity with 40mm titanium diaphragm drivers, hybrid 42dB active noise cancellation, and ultra-plush memory foam earcups.', 
    'EXPLORE HEADPHONES', 
    '/shop', 
    'VIEW REVIEWS', 
    '/about', 
    'https://i.pinimg.com/736x/59/db/4f/59db4f2dd6a94b124931caa92eb9a72f.jpg', 
    'https://i.pinimg.com/736x/59/db/4f/59db4f2dd6a94b124931caa92eb9a72f.jpg', 
    '["Hi-Res Audio Certified", "Hybrid Active Noise Cancellation", "50-Hour Playtime", "Official 1-Year Warranty"]'::jsonb, 
    'BEST SELLER', 
    true, 
    2, 
    6000
WHERE NOT EXISTS (SELECT 1 FROM public.hero_slides WHERE id = 2);

-- Seed Banners
INSERT INTO public.banners (id, title, subtitle, badge_text, image_url, button_text, button_url, open_in_new_tab, display_order, is_active)
SELECT 
    1, 
    'SUMMER CYBER SALE — UP TO 50% OFF', 
    'Upgrade your gaming and everyday audio setup with authentic APEX hardware. Limited quantities available nationwide.', 
    'LIMITED TIME EVENT', 
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1600&auto=format&fit=crop&q=80', 
    'SHOP SALE NOW', 
    '/shop', 
    false, 
    1, 
    true
WHERE NOT EXISTS (SELECT 1 FROM public.banners WHERE id = 1);

-- Seed Social Gallery
INSERT INTO public.social_gallery (id, image_url, alt_text, caption, link_url, platform, sort_order, is_active)
SELECT 1, 'https://i.pinimg.com/736x/4e/b7/89/4eb789b7c3517d3b6919af5f298b19d9.jpg', 'APEX Titanium Series Setup', 'Cyberpunk audio setup with APEX flagship gear.', 'https://www.instagram.com/apexstor.pk/', 'Instagram', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.social_gallery WHERE id = 1);

INSERT INTO public.social_gallery (id, image_url, alt_text, caption, link_url, platform, sort_order, is_active)
SELECT 2, 'https://i.pinimg.com/736x/87/3e/60/873e6066bb1b22f18075278e9111b505.jpg', 'APEX Smart Watch Pro Edition', 'Precision titanium on your wrist.', 'https://www.instagram.com/apexstor.pk/', 'Instagram', 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.social_gallery WHERE id = 2);

INSERT INTO public.social_gallery (id, image_url, alt_text, caption, link_url, platform, sort_order, is_active)
SELECT 3, 'https://i.pinimg.com/736x/dc/d1/83/dcd18343dc89c7f845a52db0f38d90c5.jpg', 'APEX Zero Latency Gaming Gear', 'Built for competitive champions.', 'https://www.instagram.com/apexstor.pk/', 'Instagram', 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.social_gallery WHERE id = 3);

INSERT INTO public.social_gallery (id, image_url, alt_text, caption, link_url, platform, sort_order, is_active)
SELECT 4, 'https://i.pinimg.com/736x/59/db/4f/59db4f2dd6a94b124931caa92eb9a72f.jpg', 'APEX Wireless ANC Acoustics', 'Hear every detail in crystal fidelity.', 'https://www.instagram.com/apexstor.pk/', 'Instagram', 4, true
WHERE NOT EXISTS (SELECT 1 FROM public.social_gallery WHERE id = 4);

INSERT INTO public.social_gallery (id, image_url, alt_text, caption, link_url, platform, sort_order, is_active)
SELECT 5, 'https://i.pinimg.com/736x/f4/ff/52/f4ff5250e2a14179e4647e51a6f4320c.jpg', 'APEX RGB Battle Station', 'Level up your gaming experience.', 'https://www.instagram.com/apexstor.pk/', 'Instagram', 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.social_gallery WHERE id = 5);

INSERT INTO public.social_gallery (id, image_url, alt_text, caption, link_url, platform, sort_order, is_active)
SELECT 6, 'https://i.pinimg.com/736x/a0/a1/82/a0a182afc8d3c2206866d3eb91bbb096.jpg', 'APEX Lifestyle & EDC Accessories', 'Minimalist black aesthetic EDC gear.', 'https://www.instagram.com/apexstor.pk/', 'Instagram', 6, true
WHERE NOT EXISTS (SELECT 1 FROM public.social_gallery WHERE id = 6);

-- Seed Return Settings
INSERT INTO public.return_settings (id, enabled, return_window_days, allow_exchanges, require_original_packaging, require_images, max_images, return_fee_type, return_fee_amount)
SELECT 1, true, 7, true, true, true, 4, 'free', 0
WHERE NOT EXISTS (SELECT 1 FROM public.return_settings WHERE id = 1);

-- --------------------------------------------------------------------
-- NOTIFY POSTGREST SCHEMA RELOAD
-- --------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
