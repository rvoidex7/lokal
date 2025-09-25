-- Create a view to combine user profile information with auth email
CREATE OR REPLACE VIEW public.users_view AS
SELECT
    up.user_id as id,
    up.full_name,
    au.email,
    up.phone_number as phone
FROM
    public.user_profiles up
JOIN
    auth.users au ON up.user_id = au.id;

-- RLS policy for the view
-- Ensures that only authenticated users can see the user list
ALTER VIEW public.users_view ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to see users list" ON public.users_view;
CREATE POLICY "Allow authenticated users to see users list" ON public.users_view
    FOR SELECT
    USING (auth.role() = 'authenticated');
