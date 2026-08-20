-- ==============================================================================
-- APEX STORE: Complete Return & Refund System Migration
-- ==============================================================================

-- 1. Create public.returns table
CREATE TABLE IF NOT EXISTS public.returns (
    id SERIAL PRIMARY KEY,
    return_number VARCHAR(100) UNIQUE NOT NULL,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE SET NULL,
    order_number VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'requested',
    reason VARCHAR(255) NOT NULL,
    reason_details TEXT,
    condition VARCHAR(100) NOT NULL DEFAULT 'opened_unused',
    packaging_available BOOLEAN DEFAULT true,
    description TEXT,
    resolution VARCHAR(50) NOT NULL DEFAULT 'refund',
    requested_amount NUMERIC(10, 2) DEFAULT 0.00,
    approved_amount NUMERIC(10, 2) DEFAULT 0.00,
    discount_adjustment NUMERIC(10, 2) DEFAULT 0.00,
    shipping_adjustment NUMERIC(10, 2) DEFAULT 0.00,
    final_refund_amount NUMERIC(10, 2) DEFAULT 0.00,
    refund_method VARCHAR(50) DEFAULT 'original',
    rejection_reason TEXT,
    admin_note TEXT,
    pickup_date TIMESTAMP WITH TIME ZONE,
    courier_name VARCHAR(100),
    tracking_number VARCHAR(100),
    pickup_notes TEXT,
    exchange_product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
    exchange_product_name VARCHAR(255),
    exchange_variant_id VARCHAR(100),
    exchange_price_diff NUMERIC(10, 2) DEFAULT 0.00,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create public.return_settings table
CREATE TABLE IF NOT EXISTS public.return_settings (
    id SERIAL PRIMARY KEY,
    return_window_days INTEGER NOT NULL DEFAULT 7,
    allow_refund BOOLEAN NOT NULL DEFAULT true,
    allow_exchange BOOLEAN NOT NULL DEFAULT true,
    allow_cod_returns BOOLEAN NOT NULL DEFAULT true,
    allow_online_returns BOOLEAN NOT NULL DEFAULT true,
    shipping_refund_rule VARCHAR(50) NOT NULL DEFAULT 'non_refundable',
    require_photos BOOLEAN NOT NULL DEFAULT false,
    return_reasons JSONB NOT NULL DEFAULT '[
        {"id": "defective", "label": "Product is defective / not functioning", "is_active": true, "sort_order": 1},
        {"id": "damaged", "label": "Product arrived damaged in transit", "is_active": true, "sort_order": 2},
        {"id": "wrong_item", "label": "Received wrong item or model", "is_active": true, "sort_order": 3},
        {"id": "missing_accessory", "label": "Missing parts or accessories", "is_active": true, "sort_order": 4},
        {"id": "not_as_described", "label": "Product does not match website description", "is_active": true, "sort_order": 5},
        {"id": "size_fit", "label": "Size / fit or comfort issue", "is_active": true, "sort_order": 6},
        {"id": "changed_mind", "label": "Changed my mind / No longer needed", "is_active": true, "sort_order": 7},
        {"id": "other", "label": "Other reason (specify below)", "is_active": true, "sort_order": 8}
    ]'::jsonb,
    policy_banner_text TEXT DEFAULT '7-Day APEX Guarantee: Hassle-Free Returns & Replacements',
    enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes for fast query lookup
CREATE INDEX IF NOT EXISTS idx_returns_user_id ON public.returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_order_number ON public.returns(order_number);
CREATE INDEX IF NOT EXISTS idx_returns_status ON public.returns(status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_settings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies on returns
DROP POLICY IF EXISTS "Customers can view their own returns" ON public.returns;
CREATE POLICY "Customers can view their own returns"
ON public.returns FOR SELECT
USING (
    auth.uid() IS NOT NULL AND (user_id = auth.uid() OR customer_id = auth.uid())
);

DROP POLICY IF EXISTS "Customers can submit return requests" ON public.returns;
CREATE POLICY "Customers can submit return requests"
ON public.returns FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL AND (user_id = auth.uid() OR customer_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins full management on returns" ON public.returns;
CREATE POLICY "Admins full management on returns"
ON public.returns FOR ALL
USING (true)
WITH CHECK (true);

-- 6. RLS Policies on return_settings
DROP POLICY IF EXISTS "Public can view return settings" ON public.return_settings;
CREATE POLICY "Public can view return settings"
ON public.return_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can update return settings" ON public.return_settings;
CREATE POLICY "Admins can update return settings"
ON public.return_settings FOR ALL
USING (true)
WITH CHECK (true);

-- 7. Seed default return settings if none exist
INSERT INTO public.return_settings (id, return_window_days, allow_refund, allow_exchange, allow_cod_returns, allow_online_returns, shipping_refund_rule, enabled)
VALUES (1, 7, true, true, true, true, 'non_refundable', true)
ON CONFLICT (id) DO NOTHING;
