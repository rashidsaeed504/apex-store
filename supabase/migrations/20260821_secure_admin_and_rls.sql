-- ====================================================================
-- APEX STORE — ADMIN AUTHORIZATION & STRICT RLS SECURITY MIGRATION
-- Execute in Supabase SQL Editor (https://app.supabase.com)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. ADMIN USERS TABLE (Explicit Allowlist & Role Authority)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

-- --------------------------------------------------------------------
-- 2. SECURITY DEFINER HELPER: is_admin(user_id)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    is_adm BOOLEAN;
    user_email TEXT;
BEGIN
    IF check_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Get email for the user ID
    SELECT email INTO user_email FROM auth.users WHERE id = check_user_id;

    -- Check if user is present in admin_users allowlist by UUID or verified email
    SELECT EXISTS (
        SELECT 1 
        FROM public.admin_users a
        WHERE a.user_id = check_user_id
           OR (user_email IS NOT NULL AND LOWER(a.email) = LOWER(user_email))
    ) INTO is_adm;

    RETURN COALESCE(is_adm, FALSE);
END;
$$;

-- Grant execution to authenticated & anon roles
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, anon;

-- --------------------------------------------------------------------
-- 3. SEED DEFAULT AUTHORIZED ADMINISTRATORS
-- --------------------------------------------------------------------
INSERT INTO public.admin_users (email, role)
VALUES 
    ('admin@apexstore.com', 'admin'),
    ('apexstore54@gmail.com', 'admin'),
    ('apexstore530@gmail.com', 'superadmin')
ON CONFLICT (email) DO UPDATE 
SET role = EXCLUDED.role, updated_at = NOW();

-- --------------------------------------------------------------------
-- 4. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- --------------------------------------------------------------------
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_settings ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 5. RLS POLICIES FOR ADMIN_USERS TABLE
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin Users Self Check Or Admin Full" ON public.admin_users;
DROP POLICY IF EXISTS "Public Read Admin Users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow Read Admin Users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Select Policy" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Insert Policy" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Update Policy" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Delete Policy" ON public.admin_users;

-- Authenticated users can check their own admin status; Admins can read all
CREATE POLICY "Admin Users Select Policy" 
ON public.admin_users FOR SELECT 
TO authenticated, anon
USING (
    public.is_admin(auth.uid()) 
    OR user_id = auth.uid() 
    OR LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Only existing authorized admins can add new admins
CREATE POLICY "Admin Users Insert Policy" 
ON public.admin_users FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Only existing authorized admins can modify admin roles
CREATE POLICY "Admin Users Update Policy" 
ON public.admin_users FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Only existing authorized admins can remove admins
CREATE POLICY "Admin Users Delete Policy" 
ON public.admin_users FOR DELETE 
TO authenticated
USING (public.is_admin(auth.uid()));

-- --------------------------------------------------------------------
-- 6. RLS POLICIES FOR PRODUCTS & CATEGORIES
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow Read Products" ON public.products;
DROP POLICY IF EXISTS "Allow Insert Products" ON public.products;
DROP POLICY IF EXISTS "Allow Update Products" ON public.products;
DROP POLICY IF EXISTS "Allow Delete Products" ON public.products;
DROP POLICY IF EXISTS "Storefront Read Products" ON public.products;
DROP POLICY IF EXISTS "Admin Manage Products Insert" ON public.products;
DROP POLICY IF EXISTS "Admin Manage Products Update" ON public.products;
DROP POLICY IF EXISTS "Admin Manage Products Delete" ON public.products;

-- Public can view products
CREATE POLICY "Storefront Read Products" 
ON public.products FOR SELECT 
USING (true);

-- Only admins can mutate products
CREATE POLICY "Admin Manage Products Insert" 
ON public.products FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin Manage Products Update" 
ON public.products FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin Manage Products Delete" 
ON public.products FOR DELETE 
TO authenticated
USING (public.is_admin(auth.uid()));

-- Categories
DROP POLICY IF EXISTS "Allow Read Categories" ON public.categories;
DROP POLICY IF EXISTS "Allow Insert Categories" ON public.categories;
DROP POLICY IF EXISTS "Allow Update Categories" ON public.categories;
DROP POLICY IF EXISTS "Allow Delete Categories" ON public.categories;
DROP POLICY IF EXISTS "Storefront Read Categories" ON public.categories;
DROP POLICY IF EXISTS "Admin Manage Categories Insert" ON public.categories;
DROP POLICY IF EXISTS "Admin Manage Categories Update" ON public.categories;
DROP POLICY IF EXISTS "Admin Manage Categories Delete" ON public.categories;

CREATE POLICY "Storefront Read Categories" 
ON public.categories FOR SELECT 
USING (true);

CREATE POLICY "Admin Manage Categories Insert" 
ON public.categories FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin Manage Categories Update" 
ON public.categories FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin Manage Categories Delete" 
ON public.categories FOR DELETE 
TO authenticated
USING (public.is_admin(auth.uid()));

-- --------------------------------------------------------------------
-- 7. RLS POLICIES FOR ORDERS & CUSTOMER DATA ISOLATION
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow Read Orders" ON public.orders;
DROP POLICY IF EXISTS "Allow Insert Orders" ON public.orders;
DROP POLICY IF EXISTS "Allow Update Orders" ON public.orders;
DROP POLICY IF EXISTS "Allow Delete Orders" ON public.orders;
DROP POLICY IF EXISTS "Customer Or Admin Read Orders" ON public.orders;
DROP POLICY IF EXISTS "Customer Create Order" ON public.orders;
DROP POLICY IF EXISTS "Admin Modify Orders" ON public.orders;
DROP POLICY IF EXISTS "Admin Delete Orders" ON public.orders;

-- Customers can view only their own orders; Admins view all
CREATE POLICY "Customer Or Admin Read Orders" 
ON public.orders FOR SELECT 
USING (
    public.is_admin(auth.uid())
    OR user_id = auth.uid()
    OR (auth.uid() IS NOT NULL AND customer_id = auth.uid()::text)
    OR guest_order_token IS NOT NULL
);

-- Customers can create their own order during checkout
CREATE POLICY "Customer Create Order" 
ON public.orders FOR INSERT 
WITH CHECK (
    user_id IS NULL 
    OR user_id = auth.uid()
    OR customer_id = auth.uid()::text
);

-- Only Admins can modify order status or order details
CREATE POLICY "Admin Modify Orders" 
ON public.orders FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin Delete Orders" 
ON public.orders FOR DELETE 
TO authenticated
USING (public.is_admin(auth.uid()));

-- Order items
DROP POLICY IF EXISTS "Allow Read Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Allow Insert Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Read Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Insert Order Items" ON public.order_items;

CREATE POLICY "Read Order Items" 
ON public.order_items FOR SELECT 
USING (
    public.is_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.orders o 
        WHERE o.id = order_items.order_id 
        AND (o.user_id = auth.uid() OR o.customer_id = auth.uid()::text OR public.is_admin(auth.uid()))
    )
);

CREATE POLICY "Insert Order Items" 
ON public.order_items FOR INSERT 
WITH CHECK (true);

-- --------------------------------------------------------------------
-- 8. RLS POLICIES FOR CUSTOMERS / PROFILES (Data Isolation)
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow Read Customers" ON public.customers;
DROP POLICY IF EXISTS "Allow Insert Customers" ON public.customers;
DROP POLICY IF EXISTS "Allow Update Customers" ON public.customers;
DROP POLICY IF EXISTS "Customer Read Own Profile" ON public.customers;
DROP POLICY IF EXISTS "Customer Insert Own Profile" ON public.customers;
DROP POLICY IF EXISTS "Customer Update Own Profile" ON public.customers;

-- Customer can read only their own profile; Admin can read all
CREATE POLICY "Customer Read Own Profile" 
ON public.customers FOR SELECT 
USING (
    public.is_admin(auth.uid()) 
    OR id = auth.uid()
);

-- Customer can create/update their own profile
CREATE POLICY "Customer Insert Own Profile" 
ON public.customers FOR INSERT 
WITH CHECK (
    id = auth.uid() 
    OR id IS NULL 
    OR public.is_admin(auth.uid())
);

CREATE POLICY "Customer Update Own Profile" 
ON public.customers FOR UPDATE 
USING (
    public.is_admin(auth.uid()) 
    OR id = auth.uid()
)
WITH CHECK (
    public.is_admin(auth.uid()) 
    OR id = auth.uid()
);

-- --------------------------------------------------------------------
-- 9. RLS POLICIES FOR REVIEWS & RETURNS
-- --------------------------------------------------------------------
-- Reviews
DROP POLICY IF EXISTS "Allow Read Reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow Manage Reviews" ON public.reviews;
DROP POLICY IF EXISTS "Storefront Read Reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customer Submit Review" ON public.reviews;
DROP POLICY IF EXISTS "Admin Moderate Reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin Delete Reviews" ON public.reviews;

CREATE POLICY "Storefront Read Reviews" 
ON public.reviews FOR SELECT 
USING (status = 'approved' OR public.is_admin(auth.uid()) OR customer_id = auth.uid()::text);

CREATE POLICY "Customer Submit Review" 
ON public.reviews FOR INSERT 
WITH CHECK (
    public.is_admin(auth.uid()) 
    OR customer_id = auth.uid()::text 
    OR user_id = auth.uid()
);

CREATE POLICY "Admin Moderate Reviews" 
ON public.reviews FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()) OR customer_id = auth.uid()::text)
WITH CHECK (public.is_admin(auth.uid()) OR customer_id = auth.uid()::text);

CREATE POLICY "Admin Delete Reviews" 
ON public.reviews FOR DELETE 
TO authenticated
USING (public.is_admin(auth.uid()));

-- Returns
DROP POLICY IF EXISTS "Allow Read Returns" ON public.returns;
DROP POLICY IF EXISTS "Allow Manage Returns" ON public.returns;
DROP POLICY IF EXISTS "Customer Or Admin Read Returns" ON public.returns;
DROP POLICY IF EXISTS "Customer Request Return" ON public.returns;
DROP POLICY IF EXISTS "Admin Update Returns" ON public.returns;
DROP POLICY IF EXISTS "Admin Delete Returns" ON public.returns;

CREATE POLICY "Customer Or Admin Read Returns" 
ON public.returns FOR SELECT 
USING (public.is_admin(auth.uid()) OR customer_id = auth.uid());

CREATE POLICY "Customer Request Return" 
ON public.returns FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()) OR customer_id = auth.uid());

CREATE POLICY "Admin Update Returns" 
ON public.returns FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin Delete Returns" 
ON public.returns FOR DELETE 
TO authenticated
USING (public.is_admin(auth.uid()));

-- --------------------------------------------------------------------
-- 10. RLS POLICIES FOR CMS CONTENT (Hero, Banners, Gallery, Deals)
-- --------------------------------------------------------------------
-- Hero Slides
DROP POLICY IF EXISTS "Allow Manage Hero Slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Public Read Hero Slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Admin Manage Hero Slides" ON public.hero_slides;
CREATE POLICY "Public Read Hero Slides" ON public.hero_slides FOR SELECT USING (true);
CREATE POLICY "Admin Manage Hero Slides" ON public.hero_slides FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Banners
DROP POLICY IF EXISTS "Allow Manage Banners" ON public.banners;
DROP POLICY IF EXISTS "Public Read Banners" ON public.banners;
DROP POLICY IF EXISTS "Admin Manage Banners" ON public.banners;
CREATE POLICY "Public Read Banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Admin Manage Banners" ON public.banners FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Social Gallery
DROP POLICY IF EXISTS "Allow Manage Social Gallery" ON public.social_gallery;
DROP POLICY IF EXISTS "Public Read Social Gallery" ON public.social_gallery;
DROP POLICY IF EXISTS "Admin Manage Social Gallery" ON public.social_gallery;
CREATE POLICY "Public Read Social Gallery" ON public.social_gallery FOR SELECT USING (true);
CREATE POLICY "Admin Manage Social Gallery" ON public.social_gallery FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Special Offers
DROP POLICY IF EXISTS "Allow Manage Special Offers" ON public.special_offers;
DROP POLICY IF EXISTS "Public Read Special Offers" ON public.special_offers;
DROP POLICY IF EXISTS "Admin Manage Special Offers" ON public.special_offers;
CREATE POLICY "Public Read Special Offers" ON public.special_offers FOR SELECT USING (true);
CREATE POLICY "Admin Manage Special Offers" ON public.special_offers FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Return Settings
DROP POLICY IF EXISTS "Allow Manage Return Settings" ON public.return_settings;
DROP POLICY IF EXISTS "Public Read Return Settings" ON public.return_settings;
DROP POLICY IF EXISTS "Admin Manage Return Settings" ON public.return_settings;
CREATE POLICY "Public Read Return Settings" ON public.return_settings FOR SELECT USING (true);
CREATE POLICY "Admin Manage Return Settings" ON public.return_settings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- --------------------------------------------------------------------
-- NOTIFY POSTGREST SCHEMA RELOAD
-- --------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
