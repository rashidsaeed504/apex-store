-- ====================================================================
-- APEX STORE — Migration: 002_create_reviews_table.sql
-- Customer Reviews & Ratings System with Row Level Security (RLS)
-- ====================================================================

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

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_email ON public.reviews(customer_email);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policy: Anyone can view APPROVED reviews
CREATE POLICY "Allow public read access to approved reviews" 
ON public.reviews FOR SELECT 
USING (status = 'approved');

-- 2. Public Insert Policy: Anyone can submit a review with status = 'pending'
CREATE POLICY "Allow public insert for pending reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (status = 'pending');

-- 3. Authenticated Admin Policy: Admins can view, update, and delete all reviews
CREATE POLICY "Allow full review access to authenticated admins" 
ON public.reviews FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);
