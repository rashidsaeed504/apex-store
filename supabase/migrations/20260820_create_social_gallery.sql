-- ====================================================================
-- APEX STORE — Migration: Social Media Gallery Table & RLS Policies
-- Run directly in Supabase SQL Editor (https://app.supabase.com)
-- ====================================================================

-- 1. Social Gallery Table
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

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.social_gallery ENABLE ROW LEVEL SECURITY;

-- 3. Public Read Policy (Allow any customer on any device to view active social gallery images)
DROP POLICY IF EXISTS "Public Read Social Gallery" ON public.social_gallery;
CREATE POLICY "Public Read Social Gallery" ON public.social_gallery FOR SELECT USING (true);

-- 4. Management Policy (Allow Admin / authenticated & storefront synchronization)
DROP POLICY IF EXISTS "Allow Manage Social Gallery" ON public.social_gallery;
CREATE POLICY "Allow Manage Social Gallery" ON public.social_gallery FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. Insert Initial Seed Images if table is empty
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
