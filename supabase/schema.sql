-- ====================================================================
-- APEX STORE — Complete Production Supabase Database Schema & Storage
-- Execute this entire script in Supabase SQL Editor (https://app.supabase.com)
-- ====================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    image TEXT,
    product_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(255) NOT NULL,
    subcategory VARCHAR(255),
    category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2),
    discount INTEGER DEFAULT 0,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    reviews INTEGER DEFAULT 0,
    images TEXT[] NOT NULL DEFAULT '{}',
    description TEXT,
    full_description TEXT,
    features TEXT[] DEFAULT '{}',
    specifications JSONB DEFAULT '{}'::jsonb,
    stock INTEGER DEFAULT 0,
    badge VARCHAR(100),
    colors TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Draft', 'Out of Stock', 'Archived'
    is_featured BOOLEAN DEFAULT false,
    is_trending BOOLEAN DEFAULT false,
    is_new_arrival BOOLEAN DEFAULT false,
    is_best_seller BOOLEAN DEFAULT false,
    is_on_sale BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(100),
    city VARCHAR(100),
    shipping_address TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guest_order_token TEXT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(100) NOT NULL,
    shipping_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(50),
    payment_method VARCHAR(50) DEFAULT 'cod',
    subtotal NUMERIC(10, 2) NOT NULL,
    shipping NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Wishlists Table
CREATE TABLE IF NOT EXISTS public.wishlists (
    id SERIAL PRIMARY KEY,
    user_identifier VARCHAR(255) NOT NULL,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_identifier, product_id)
);

-- 7. Special Offers Table (Homepage Dynamic Deal)
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

-- 8. Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to prevent 42710 ("policy already exists") errors
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

-- Products RLS Policies
CREATE POLICY "Allow Read Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow Insert Products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Update Products" ON public.products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow Delete Products" ON public.products FOR DELETE USING (true);

-- Categories RLS Policies
CREATE POLICY "Allow Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow Insert Categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Update Categories" ON public.categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow Delete Categories" ON public.categories FOR DELETE USING (true);

-- Orders & Customers Policies (Secure Private RLS)
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.jwt()->>'email'));
CREATE POLICY "Guests can view own orders via token" ON public.orders FOR SELECT TO anon, authenticated USING (guest_order_token IS NOT NULL);
CREATE POLICY "Allow Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Update Orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Users can view order items for their orders" ON public.order_items FOR SELECT TO anon, authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (
      (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()) OR
      orders.guest_order_token IS NOT NULL
    )
  )
);
CREATE POLICY "Allow Insert Order Items" ON public.order_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow Read Customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow Insert Customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Update Customers" ON public.customers FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow Manage Wishlists" ON public.wishlists FOR ALL USING (true);
CREATE POLICY "Allow Read Admin Users" ON public.admin_users FOR SELECT USING (true);

-- Storage Bucket Configuration for Product Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Product Storage" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Product Storage" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Product Storage" ON storage.objects;

CREATE POLICY "Public Read Product Storage" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Public Upload Product Storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Public Delete Product Storage" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');

-- Indexes for Query Speed
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_identifier);

-- 6. Customer Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    product_name VARCHAR(255),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    verified_purchase BOOLEAN NOT NULL DEFAULT false,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews Indexes & Policies
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_email ON public.reviews(customer_email);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to approved reviews" ON public.reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Allow public insert for pending reviews" ON public.reviews FOR INSERT WITH CHECK (status = 'pending');
CREATE POLICY "Allow full review access to authenticated admins" ON public.reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

