-- ==============================================================================
-- APEX STORE: Add Unboxing Video Evidence to Returns System
-- ==============================================================================

-- 1. Add unboxing video columns to public.returns table
ALTER TABLE IF EXISTS public.returns
ADD COLUMN IF NOT EXISTS unboxing_video_url TEXT,
ADD COLUMN IF NOT EXISTS unboxing_video_path TEXT,
ADD COLUMN IF NOT EXISTS unboxing_video_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS unboxing_video_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS unboxing_video_status VARCHAR(50) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS admin_evidence_request TEXT;

-- 2. Add unboxing video requirement setting to return_settings
ALTER TABLE IF EXISTS public.return_settings
ADD COLUMN IF NOT EXISTS require_unboxing_video_for_damage BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_video_size_mb INTEGER DEFAULT 100;

-- 3. Update return_settings banner text to strictly use "7 Days Return" (no "Free Returns")
UPDATE public.return_settings
SET policy_banner_text = '7-Day APEX Guarantee: 7 Days Return & Replacements'
WHERE id = 1;

-- 4. Create index on unboxing video status for admin filtering
CREATE INDEX IF NOT EXISTS idx_returns_unboxing_video ON public.returns(unboxing_video_available);
