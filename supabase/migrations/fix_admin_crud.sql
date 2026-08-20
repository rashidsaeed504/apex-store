-- ====================================================================
-- APEX STORE — Fix Admin CRUD & RLS Policies Migration
-- Execute directly in Supabase SQL Editor (https://app.supabase.com)
-- ====================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to prevent 42710 ("policy already exists") errors
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
DROP POLICY IF EXISTS "Public Insert Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Read Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Insert Customers" ON public.customers;
DROP POLICY IF EXISTS "Public Manage Wishlists" ON public.wishlists;

DROP POLICY IF EXISTS "Admin Full Categories" ON public.categories;
DROP POLICY IF EXISTS "Admin Full Products" ON public.products;
DROP POLICY IF EXISTS "Admin Full Customers" ON public.customers;
DROP POLICY IF EXISTS "Admin Full Orders" ON public.orders;
DROP POLICY IF EXISTS "Admin Full Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Admin Full Users" ON public.admin_users;

DROP POLICY IF EXISTS "Allow Read Categories" ON public.categories;
DROP POLICY IF EXISTS "Allow Insert Categories" ON public.categories;
DROP POLICY IF EXISTS "Allow Update Categories" ON public.categories;
DROP POLICY IF EXISTS "Allow Delete Categories" ON public.categories;

DROP POLICY IF EXISTS "Allow Read Products" ON public.products;
DROP POLICY IF EXISTS "Allow Insert Products" ON public.products;
DROP POLICY IF EXISTS "Allow Update Products" ON public.products;
DROP POLICY IF EXISTS "Allow Delete Products" ON public.products;

DROP POLICY IF EXISTS "Allow Read Orders" ON public.orders;
DROP POLICY IF EXISTS "Allow Insert Orders" ON public.orders;
DROP POLICY IF EXISTS "Allow Update Orders" ON public.orders;

DROP POLICY IF EXISTS "Allow Read Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Allow Insert Order Items" ON public.order_items;

DROP POLICY IF EXISTS "Allow Read Customers" ON public.customers;
DROP POLICY IF EXISTS "Allow Insert Customers" ON public.customers;
DROP POLICY IF EXISTS "Allow Update Customers" ON public.customers;

DROP POLICY IF EXISTS "Allow Manage Wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Allow Read Admin Users" ON public.admin_users;

-- 3. Products RLS Policies (Storefront Read & Admin Write WITH CHECK)
CREATE POLICY "Allow Read Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow Insert Products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Update Products" ON public.products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow Delete Products" ON public.products FOR DELETE USING (true);

-- 4. Categories RLS Policies
CREATE POLICY "Allow Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow Insert Categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Update Categories" ON public.categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow Delete Categories" ON public.categories FOR DELETE USING (true);

-- 5. Orders, Customers & Wishlists Policies
CREATE POLICY "Allow Read Orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Update Orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow Read Order Items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Allow Insert Order Items" ON public.order_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow Read Customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow Insert Customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Update Customers" ON public.customers FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow Manage Wishlists" ON public.wishlists FOR ALL USING (true);
CREATE POLICY "Allow Read Admin Users" ON public.admin_users FOR SELECT USING (true);

-- 6. Storage Bucket Configuration for Product Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Product Storage" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Product Storage" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Product Storage" ON storage.objects;

CREATE POLICY "Public Read Product Storage" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Public Upload Product Storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Public Delete Product Storage" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');
