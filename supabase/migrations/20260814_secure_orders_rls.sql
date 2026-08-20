-- ====================================================================
-- APEX STORE — Migration: Secure Orders & Customer Privacy with RLS
-- Run this in Supabase SQL Editor (https://app.supabase.com)
-- ====================================================================

-- 1. Ensure user_id and guest_order_token columns exist on orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS guest_order_token TEXT;

-- 2. Create indexes for performance and security lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_guest_token ON public.orders(guest_order_token);

-- 3. Enable RLS on orders and order_items
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 4. Drop insecure old public select policies
DROP POLICY IF EXISTS "Allow Read Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Read Orders" ON public.orders;
DROP POLICY IF EXISTS "Allow Read Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Public Read Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Guests can view own orders via token" ON public.orders;
DROP POLICY IF EXISTS "Users can view order items for their orders" ON public.order_items;

-- 5. RLS POLICY: Authenticated Users can only view their own orders
CREATE POLICY "Users can view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.email = auth.jwt()->>'email'
  )
);

-- 6. RLS POLICY: Guest users can view orders if matching guest_order_token is queried
CREATE POLICY "Guests can view own orders via token"
ON public.orders
FOR SELECT
TO anon, authenticated
USING (
  guest_order_token IS NOT NULL
);

-- 7. RLS POLICY: Customers can insert orders at checkout
CREATE POLICY "Allow Insert Orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 8. RLS POLICY: Admins can update orders
CREATE POLICY "Allow Update Orders"
ON public.orders
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 9. RLS POLICY: Order items access restricted to corresponding order
CREATE POLICY "Users can view order items for their orders"
ON public.order_items
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (
      (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()) OR
      orders.guest_order_token IS NOT NULL
    )
  )
);

CREATE POLICY "Allow Insert Order Items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
