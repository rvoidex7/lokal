-- Fix RLS policy for coffee_vouchers table

-- Allow admins to insert new vouchers for any user.
-- This policy checks the user_profiles table to see if the person performing the action has the 'admin' role.
CREATE POLICY "Allow admins to insert vouchers"
ON public.coffee_vouchers
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Allow users to view their own vouchers.
CREATE POLICY "Allow users to view their own vouchers"
ON public.coffee_vouchers
FOR SELECT
USING (auth.uid() = user_id);
