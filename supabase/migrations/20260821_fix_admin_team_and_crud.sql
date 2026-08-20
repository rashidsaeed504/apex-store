-- ====================================================================
-- APEX STORE — COMPLETE ADMIN TEAM & ACCESS CRUD + SUPABASE RLS FIX
-- Execute in Supabase SQL Editor (https://app.supabase.com)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. FIX / EXTEND public.admin_users TABLE SCHEMA
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    full_name VARCHAR(255) DEFAULT 'Admin',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure user_id column exists and is NULLABLE (to allow pending admin invites before signup)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.admin_users ADD COLUMN user_id UUID NULL;
    ELSE
        ALTER TABLE public.admin_users ALTER COLUMN user_id DROP NOT NULL;
    END IF;

    -- Ensure full_name exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.admin_users ADD COLUMN full_name VARCHAR(255) DEFAULT 'Admin';
    END IF;

    -- Ensure is_active exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.admin_users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;

    -- Ensure updated_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.admin_users ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$;

-- Enforce role constraint (admin or superadmin)
DO $$
BEGIN
    ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS chk_admin_users_role;
    -- Normalize any legacy super_admin roles to superadmin
    UPDATE public.admin_users SET role = 'superadmin' WHERE role = 'super_admin';
    ALTER TABLE public.admin_users ADD CONSTRAINT chk_admin_users_role CHECK (role IN ('admin', 'superadmin', 'super_admin'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Create Case-Insensitive Unique Index on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_lower_email 
ON public.admin_users (LOWER(TRIM(email)));

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id 
ON public.admin_users (user_id);

-- Link any existing auth.users to admin_users by email
UPDATE public.admin_users a
SET user_id = u.id,
    updated_at = NOW()
FROM auth.users u
WHERE LOWER(TRIM(a.email)) = LOWER(TRIM(u.email))
  AND a.user_id IS NULL;

-- --------------------------------------------------------------------
-- 2. SEED DEFAULT SUPERADMINS
-- --------------------------------------------------------------------
INSERT INTO public.admin_users (email, role, full_name, is_active)
VALUES 
    ('apexstore54@gmail.com', 'superadmin', 'Apex Super Admin', true),
    ('admin@apexstore.pk', 'superadmin', 'Apex Administrator', true),
    ('apexstore530@gmail.com', 'superadmin', 'Apex Tech Admin', true),
    ('admin@apexstore.com', 'admin', 'Apex Store Admin', true)
ON CONFLICT ((LOWER(TRIM(email)))) DO UPDATE 
SET role = EXCLUDED.role, is_active = true, updated_at = NOW();

-- --------------------------------------------------------------------
-- 3. SECURITY DEFINER AUTHORIZATION FUNCTIONS (No Recursive RLS)
-- --------------------------------------------------------------------

-- Function to get the role of an admin: 'superadmin', 'admin', or NULL
CREATE OR REPLACE FUNCTION public.get_admin_role(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    found_role TEXT;
    user_email TEXT;
BEGIN
    IF check_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get email from auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = check_user_id;

    -- Query admin_users by UUID or normalized email
    SELECT 
        CASE 
            WHEN a.role IN ('superadmin', 'super_admin') THEN 'superadmin'
            ELSE 'admin'
        END INTO found_role
    FROM public.admin_users a
    WHERE a.is_active = TRUE
      AND (
          a.user_id = check_user_id 
          OR (user_email IS NOT NULL AND LOWER(TRIM(a.email)) = LOWER(TRIM(user_email)))
      )
    ORDER BY (CASE WHEN a.role IN ('superadmin', 'super_admin') THEN 1 ELSE 2 END)
    LIMIT 1;

    -- Auto-link user_id if pending
    IF found_role IS NOT NULL AND user_email IS NOT NULL THEN
        UPDATE public.admin_users
        SET user_id = check_user_id, updated_at = NOW()
        WHERE LOWER(TRIM(email)) = LOWER(TRIM(user_email))
          AND user_id IS NULL;
    END IF;

    RETURN found_role;
END;
$$;

-- Function to check if user is ANY authorized admin (admin or superadmin)
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    RETURN (public.get_admin_role(check_user_id) IS NOT NULL);
END;
$$;

-- Function to check if user is specifically a SUPERADMIN
CREATE OR REPLACE FUNCTION public.is_superadmin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    RETURN (public.get_admin_role(check_user_id) = 'superadmin');
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_admin_role(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_superadmin(UUID) TO authenticated, anon;

-- --------------------------------------------------------------------
-- 4. SECURE SERVER-SIDE CRUD RPC FUNCTIONS
-- --------------------------------------------------------------------

-- RPC: Authorize a new administrator (Supports pending invite with user_id NULL)
CREATE OR REPLACE FUNCTION public.authorize_admin(
    admin_email TEXT,
    admin_role TEXT DEFAULT 'admin',
    admin_full_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    caller_id UUID := auth.uid();
    clean_email TEXT;
    target_user_id UUID := NULL;
    normalized_role TEXT;
    new_record public.admin_users%ROWTYPE;
BEGIN
    -- 1. Authentication & Privilege Verification
    IF caller_id IS NULL OR NOT public.is_superadmin(caller_id) THEN
        RAISE EXCEPTION 'Access Denied: Superadmin privileges are required to authorize new administrators.' 
            USING ERRCODE = '42501';
    END IF;

    -- 2. Input Validation & Normalization
    clean_email := LOWER(TRIM(admin_email));
    IF clean_email IS NULL OR clean_email = '' OR clean_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Please provide a valid email address.';
    END IF;

    normalized_role := LOWER(TRIM(admin_role));
    IF normalized_role NOT IN ('admin', 'superadmin', 'super_admin') THEN
        RAISE EXCEPTION 'Invalid role: must be either admin or superadmin.';
    END IF;
    IF normalized_role = 'super_admin' THEN
        normalized_role := 'superadmin';
    END IF;

    -- 3. Duplicate Check
    IF EXISTS (SELECT 1 FROM public.admin_users WHERE LOWER(TRIM(email)) = clean_email) THEN
        RAISE EXCEPTION 'An administrator with email "%" is already authorized.', clean_email;
    END IF;

    -- 4. Link existing auth.users ID if the user is already registered
    SELECT id INTO target_user_id FROM auth.users WHERE LOWER(TRIM(email)) = clean_email LIMIT 1;

    -- 5. Insert into admin_users
    INSERT INTO public.admin_users (
        email,
        role,
        full_name,
        user_id,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        clean_email,
        normalized_role,
        COALESCE(NULLIF(TRIM(admin_full_name), ''), split_part(clean_email, '@', 1)),
        target_user_id,
        TRUE,
        NOW(),
        NOW()
    )
    RETURNING * INTO new_record;

    RETURN to_jsonb(new_record);
END;
$$;

-- RPC: Update administrator role or details
CREATE OR REPLACE FUNCTION public.update_admin(
    target_admin_id TEXT,
    new_role TEXT,
    new_full_name TEXT DEFAULT NULL,
    new_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    caller_id UUID := auth.uid();
    target_record public.admin_users%ROWTYPE;
    normalized_role TEXT;
    clean_email TEXT;
    superadmin_count INT;
    matched_user_id UUID;
BEGIN
    -- 1. Security Check
    IF caller_id IS NULL OR NOT public.is_superadmin(caller_id) THEN
        RAISE EXCEPTION 'Access Denied: Superadmin privileges are required to modify administrators.' 
            USING ERRCODE = '42501';
    END IF;

    -- 2. Find target admin
    SELECT * INTO target_record 
    FROM public.admin_users 
    WHERE id::text = target_admin_id OR email = LOWER(TRIM(target_admin_id));

    IF target_record.id IS NULL THEN
        RAISE EXCEPTION 'Administrator not found.';
    END IF;

    -- 3. Validate Role
    normalized_role := LOWER(TRIM(new_role));
    IF normalized_role NOT IN ('admin', 'superadmin', 'super_admin') THEN
        RAISE EXCEPTION 'Invalid role: must be either admin or superadmin.';
    END IF;
    IF normalized_role = 'super_admin' THEN
        normalized_role := 'superadmin';
    END IF;

    -- 4. Last Superadmin Protection on Demotion
    IF target_record.role IN ('superadmin', 'super_admin') AND normalized_role = 'admin' THEN
        SELECT COUNT(*) INTO superadmin_count
        FROM public.admin_users
        WHERE role IN ('superadmin', 'super_admin') AND is_active = TRUE;

        IF superadmin_count <= 1 THEN
            RAISE EXCEPTION 'Cannot demote the last remaining Super Admin. At least one Super Admin must remain.';
        END IF;
    END IF;

    -- 5. Email update (if provided)
    IF new_email IS NOT NULL AND TRIM(new_email) <> '' THEN
        clean_email := LOWER(TRIM(new_email));
        IF clean_email <> LOWER(TRIM(target_record.email)) THEN
            IF EXISTS (SELECT 1 FROM public.admin_users WHERE LOWER(TRIM(email)) = clean_email AND id <> target_record.id) THEN
                RAISE EXCEPTION 'An administrator with email "%" already exists.', clean_email;
            END IF;
            target_record.email := clean_email;
            SELECT id INTO matched_user_id FROM auth.users WHERE LOWER(TRIM(email)) = clean_email LIMIT 1;
            target_record.user_id := matched_user_id;
        END IF;
    END IF;

    -- 6. Apply updates
    UPDATE public.admin_users
    SET role = normalized_role,
        full_name = COALESCE(NULLIF(TRIM(new_full_name), ''), target_record.full_name),
        email = target_record.email,
        user_id = target_record.user_id,
        updated_at = NOW()
    WHERE id = target_record.id
    RETURNING * INTO target_record;

    RETURN to_jsonb(target_record);
END;
$$;

-- RPC: Revoke administrator access
CREATE OR REPLACE FUNCTION public.revoke_admin(
    target_admin_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    caller_id UUID := auth.uid();
    target_record public.admin_users%ROWTYPE;
    superadmin_count INT;
BEGIN
    -- 1. Security Check
    IF caller_id IS NULL OR NOT public.is_superadmin(caller_id) THEN
        RAISE EXCEPTION 'Access Denied: Superadmin privileges are required to revoke administrators.' 
            USING ERRCODE = '42501';
    END IF;

    -- 2. Find target admin
    SELECT * INTO target_record 
    FROM public.admin_users 
    WHERE id::text = target_admin_id OR email = LOWER(TRIM(target_admin_id));

    IF target_record.id IS NULL THEN
        RAISE EXCEPTION 'Administrator not found.';
    END IF;

    -- 3. Last Superadmin Protection
    IF target_record.role IN ('superadmin', 'super_admin') THEN
        SELECT COUNT(*) INTO superadmin_count
        FROM public.admin_users
        WHERE role IN ('superadmin', 'super_admin') AND is_active = TRUE;

        IF superadmin_count <= 1 THEN
            RAISE EXCEPTION 'Cannot revoke the last remaining Super Admin. At least one Super Admin must remain.';
        END IF;
    END IF;

    -- 4. Delete from admin_users (Leaves auth.users account untouched!)
    DELETE FROM public.admin_users WHERE id = target_record.id;

    RETURN jsonb_build_object(
        'success', true,
        'message', format('Administrator "%s" access has been revoked.', target_record.email),
        'revoked_id', target_record.id
    );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.authorize_admin(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_admin(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin(TEXT) TO authenticated;

-- --------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES FOR public.admin_users
-- --------------------------------------------------------------------
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid recursive conflicts
DROP POLICY IF EXISTS "Admin Users Select Policy" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Insert Policy" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Update Policy" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Delete Policy" ON public.admin_users;
DROP POLICY IF EXISTS "Allow Admins To Read Admin Users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow Superadmins To Insert Admin Users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow Superadmins To Update Admin Users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow Superadmins To Delete Admin Users" ON public.admin_users;

-- SELECT Policy: Authorized admins can see all; users can check their own row
CREATE POLICY "Allow Admins To Read Admin Users" 
ON public.admin_users FOR SELECT 
TO authenticated, anon
USING (
    public.is_admin(auth.uid()) 
    OR user_id = auth.uid()
    OR LOWER(TRIM(email)) = LOWER(TRIM((SELECT email FROM auth.users WHERE id = auth.uid())))
);

-- INSERT Policy: Only Superadmins
CREATE POLICY "Allow Superadmins To Insert Admin Users" 
ON public.admin_users FOR INSERT 
TO authenticated
WITH CHECK (public.is_superadmin(auth.uid()));

-- UPDATE Policy: Only Superadmins
CREATE POLICY "Allow Superadmins To Update Admin Users" 
ON public.admin_users FOR UPDATE 
TO authenticated
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

-- DELETE Policy: Only Superadmins
CREATE POLICY "Allow Superadmins To Delete Admin Users" 
ON public.admin_users FOR DELETE 
TO authenticated
USING (public.is_superadmin(auth.uid()));

-- --------------------------------------------------------------------
-- 6. AUTOMATIC AUTH TRIGGER (Promote Pending Invites on Sign-up)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_admin_auth_user_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- If an admin was pre-authorized by email, link their user_id immediately upon auth creation
    UPDATE public.admin_users
    SET user_id = NEW.id,
        updated_at = NOW()
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
      AND user_id IS NULL;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_admin_on_signup ON auth.users;
CREATE TRIGGER trg_link_admin_on_signup
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_admin_auth_user_link();
