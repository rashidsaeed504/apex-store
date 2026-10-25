-- ====================================================================
-- APEX STORE — Real-Time Admin Notification Center Migration
-- Table: public.admin_notifications
-- Triggers: Orders, Returns, Low Stock, Reviews, Customers
-- Security: Strict RLS (Admins only for SELECT/UPDATE, Triggers for INSERT)
-- ====================================================================

-- 1. Create table public.admin_notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('new_order', 'return_request', 'low_stock', 'new_review', 'new_user')),
    title TEXT NOT NULL,
    message TEXT,
    ref_table TEXT,
    ref_id TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create index on (is_read, created_at desc) for fast notification queries
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read_created_at 
ON public.admin_notifications(is_read, created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Only authenticated administrators can SELECT notifications
DROP POLICY IF EXISTS "Admins can view admin notifications" ON public.admin_notifications;
CREATE POLICY "Admins can view admin notifications"
ON public.admin_notifications FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Only authenticated administrators can UPDATE (mark as read) notifications
DROP POLICY IF EXISTS "Admins can update admin notifications" ON public.admin_notifications;
CREATE POLICY "Admins can update admin notifications"
ON public.admin_notifications FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Note: Nobody can INSERT from client directly. Inserts occur solely via
-- SECURITY DEFINER database triggers running with elevated permissions.

-- 5. Add table to Supabase Realtime publication
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = 'admin_notifications'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
        END IF;
    END IF;
END $$;

-- ====================================================================
-- TRIGGER FUNCTIONS & TRIGGERS
-- ====================================================================

-- Trigger A: New Order Notification (AFTER INSERT ON public.orders)
CREATE OR REPLACE FUNCTION public.fn_notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_num TEXT;
    v_cust_name TEXT;
    v_total TEXT;
BEGIN
    v_order_num := COALESCE(NEW.order_number, NEW.id::text);
    v_cust_name := COALESCE(NEW.customer_name, 'Guest Customer');
    v_total := COALESCE(NEW.total::text, '0');

    INSERT INTO public.admin_notifications (type, title, message, ref_table, ref_id)
    VALUES (
        'new_order',
        'New order #' || v_order_num,
        v_cust_name || ' placed an order for PKR ' || v_total,
        'orders',
        v_order_num
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Prevent order placement failure if notification trigger errors
    RAISE WARNING 'fn_notify_new_order error: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_order ON public.orders;
CREATE TRIGGER trg_notify_new_order
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_new_order();


-- Trigger B: Return Request Notification (AFTER INSERT ON public.returns)
CREATE OR REPLACE FUNCTION public.fn_notify_return_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_num TEXT;
    v_return_num TEXT;
    v_reason TEXT;
BEGIN
    v_order_num := COALESCE(NEW.order_number, 'N/A');
    v_return_num := COALESCE(NEW.return_number, NEW.id::text);
    v_reason := COALESCE(NEW.reason, 'No reason specified');

    INSERT INTO public.admin_notifications (type, title, message, ref_table, ref_id)
    VALUES (
        'return_request',
        'New return request #' || v_return_num,
        'Order #' || v_order_num || ' — Reason: ' || v_reason,
        'returns',
        v_return_num
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'fn_notify_return_request error: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_return_request ON public.returns;
CREATE TRIGGER trg_notify_return_request
AFTER INSERT ON public.returns
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_return_request();


-- Trigger C: Low Stock Warning (AFTER UPDATE OF stock ON public.products)
CREATE OR REPLACE FUNCTION public.fn_notify_low_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Triggers when stock drops to or below 5 and was previously above 5
    IF NEW.stock <= 5 AND (OLD.stock > 5 OR OLD.stock IS NULL) THEN
        INSERT INTO public.admin_notifications (type, title, message, ref_table, ref_id)
        VALUES (
            'low_stock',
            'Low Stock Alert: ' || COALESCE(NEW.name, 'Product'),
            'Only ' || NEW.stock || ' unit(s) remaining in inventory.',
            'products',
            COALESCE(NEW.name, NEW.id::text)
        );
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'fn_notify_low_stock error: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_low_stock ON public.products;
CREATE TRIGGER trg_notify_low_stock
AFTER UPDATE OF stock ON public.products
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_low_stock();


-- Trigger D: New Customer Review (AFTER INSERT ON public.reviews)
CREATE OR REPLACE FUNCTION public.fn_notify_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.admin_notifications (type, title, message, ref_table, ref_id)
    VALUES (
        'new_review',
        'New Customer Review',
        COALESCE(NEW.customer_name, 'Customer') || ' submitted a ' || COALESCE(NEW.rating::text, '5') || '-star review for ' || COALESCE(NEW.product_name, 'a product') || '.',
        'reviews',
        NEW.id::text
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'fn_notify_new_review error: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_review ON public.reviews;
CREATE TRIGGER trg_notify_new_review
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_new_review();


-- Trigger E: New Customer Signup (AFTER INSERT ON public.customers)
CREATE OR REPLACE FUNCTION public.fn_notify_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.admin_notifications (type, title, message, ref_table, ref_id)
    VALUES (
        'new_user',
        'New Customer Registered',
        COALESCE(NEW.full_name, 'Customer') || ' (' || COALESCE(NEW.email, 'no email') || ') joined Apex Store.',
        'customers',
        COALESCE(NEW.email, NEW.id::text)
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'fn_notify_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_user ON public.customers;
CREATE TRIGGER trg_notify_new_user
AFTER INSERT ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_new_user();

-- Notify PostgREST schema reload
NOTIFY pgrst, 'reload schema';
