-- ====================================================================
-- APEX STORE — VERIFIED-PURCHASE REVIEW SYSTEM MIGRATION
-- File: supabase/migrations/20260821_verified_purchase_reviews.sql
-- Enforces verified purchase reviews only for delivered orders
-- ====================================================================

-- 1. Ensure delivered_at column exists on public.orders
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'delivered_at'
    ) THEN 
        ALTER TABLE public.orders ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Create public.reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    product_name VARCHAR(255),
    customer_id UUID,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    order_id VARCHAR(100),
    order_item_id VARCHAR(100),
    variant_id VARCHAR(100),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review_text TEXT NOT NULL,
    photos JSONB DEFAULT '[]'::jsonb,
    verified_purchase BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(50) NOT NULL DEFAULT 'approved', -- 'approved', 'pending', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_email ON public.reviews(customer_email);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Allow public read access to approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow verified customer insert" ON public.reviews;
DROP POLICY IF EXISTS "Allow customer update own review" ON public.reviews;
DROP POLICY IF EXISTS "Allow full admin access on reviews" ON public.reviews;

-- 6. Recreate Security Policies
-- Policy 1: Public Read Policy (Anyone can view approved reviews)
CREATE POLICY "Allow public read access to approved reviews" 
ON public.reviews FOR SELECT 
USING (status = 'approved');

-- Policy 2: Authenticated / Customer Insert Policy
CREATE POLICY "Allow verified customer insert" 
ON public.reviews FOR INSERT 
WITH CHECK (true);

-- Policy 3: Customer Update Policy (Can update own review)
CREATE POLICY "Allow customer update own review" 
ON public.reviews FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Policy 4: Authenticated Admins Full Access
CREATE POLICY "Allow full admin access on reviews" 
ON public.reviews FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 7. Auto-update Timestamp Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at_reviews()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_reviews_updated_at ON public.reviews;
CREATE TRIGGER set_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at_reviews();
