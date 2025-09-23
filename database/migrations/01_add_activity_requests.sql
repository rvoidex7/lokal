-- Migration to enhance etkinlik_talepleri (activity requests) table
-- This migration adds new fields for better activity organization

-- Add new columns to existing table
ALTER TABLE public.etkinlik_talepleri 
ADD COLUMN IF NOT EXISTS event_type TEXT,
ADD COLUMN IF NOT EXISTS expected_participants INTEGER,
ADD COLUMN IF NOT EXISTS preferred_date TEXT,
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS budget_range TEXT,
ADD COLUMN IF NOT EXISTS organization_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS requester_ip TEXT;

-- Update the constraint to allow null for requested_by (for non-authenticated users)
ALTER TABLE public.etkinlik_talepleri 
ALTER COLUMN requested_by DROP NOT NULL;

-- Create new RLS policy for anonymous insertions
CREATE POLICY "Anyone can insert activity requests" ON public.etkinlik_talepleri
    FOR INSERT WITH CHECK (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can insert their own requests" ON public.etkinlik_talepleri;

-- Add index for new fields that might be queried frequently
CREATE INDEX IF NOT EXISTS etkinlik_talepleri_event_type_idx ON public.etkinlik_talepleri(event_type);
CREATE INDEX IF NOT EXISTS etkinlik_talepleri_organization_name_idx ON public.etkinlik_talepleri(organization_name);
CREATE INDEX IF NOT EXISTS etkinlik_talepleri_preferred_date_idx ON public.etkinlik_talepleri(preferred_date);