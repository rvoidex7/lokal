-- Enhanced Database Schema for Lokal Cafe
-- This schema includes all the new features for the community platform

-- ========================================
-- USER PROFILES AND ROLES
-- ========================================

-- Create user_profiles table for extended user information
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    birthday DATE,
    phone_number TEXT,
    bio TEXT,
    avatar_url TEXT,
    coffee_voucher_count INT DEFAULT 0,
    activity_attendance_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================
-- CLUB MEMBERSHIP REQUESTS
-- ========================================

-- Create membership_requests table for tracking join requests
CREATE TABLE IF NOT EXISTS public.membership_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.social_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    request_message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- ========================================
-- CLUB COMMENT WALLS
-- ========================================

-- Create club_comments table for group discussions
CREATE TABLE IF NOT EXISTS public.club_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.social_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create comment_reactions table for likes/reactions
CREATE TABLE IF NOT EXISTS public.comment_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES public.club_comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'heart', 'applause', 'thinking')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(comment_id, user_id)
);

-- ========================================
-- ENHANCED ANNOUNCEMENTS
-- ========================================

-- Update announcements table to include club-specific features
ALTER TABLE public.duyurular 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.social_groups(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS meeting_datetime TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_club_only BOOLEAN DEFAULT false;

-- ========================================
-- ENHANCED ACTIVITY MANAGEMENT
-- ========================================

-- Create activities table for improved activity management
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    activity_type TEXT,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_hours DECIMAL(3,1),
    location TEXT,
    max_participants INT,
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    managed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    request_id UUID REFERENCES public.etkinlik_talepleri(id) ON DELETE SET NULL,
    group_id UUID REFERENCES public.social_groups(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update etkinlik_talepleri to include assignment
ALTER TABLE public.etkinlik_talepleri
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_response TEXT;

-- ========================================
-- LOYALTY AND BIRTHDAY SYSTEM
-- ========================================

-- Create coffee_vouchers table for tracking rewards
CREATE TABLE IF NOT EXISTS public.coffee_vouchers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    voucher_code TEXT UNIQUE NOT NULL,
    reason TEXT CHECK (reason IN ('birthday', 'loyalty', 'special')),
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create activity_attendance table for tracking participation
CREATE TABLE IF NOT EXISTS public.activity_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_name TEXT NOT NULL,
    attended BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(activity_id, user_id)
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS user_profiles_birthday_idx ON public.user_profiles(birthday);

CREATE INDEX IF NOT EXISTS membership_requests_group_id_idx ON public.membership_requests(group_id);
CREATE INDEX IF NOT EXISTS membership_requests_user_id_idx ON public.membership_requests(user_id);
CREATE INDEX IF NOT EXISTS membership_requests_status_idx ON public.membership_requests(status);

CREATE INDEX IF NOT EXISTS club_comments_group_id_idx ON public.club_comments(group_id);
CREATE INDEX IF NOT EXISTS club_comments_user_id_idx ON public.club_comments(user_id);
CREATE INDEX IF NOT EXISTS club_comments_created_at_idx ON public.club_comments(created_at);

CREATE INDEX IF NOT EXISTS comment_reactions_comment_id_idx ON public.comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS comment_reactions_user_id_idx ON public.comment_reactions(user_id);

CREATE INDEX IF NOT EXISTS activities_date_time_idx ON public.activities(date_time);
CREATE INDEX IF NOT EXISTS activities_status_idx ON public.activities(status);
CREATE INDEX IF NOT EXISTS activities_group_id_idx ON public.activities(group_id);

CREATE INDEX IF NOT EXISTS coffee_vouchers_user_id_idx ON public.coffee_vouchers(user_id);
CREATE INDEX IF NOT EXISTS coffee_vouchers_is_used_idx ON public.coffee_vouchers(is_used);

CREATE INDEX IF NOT EXISTS activity_attendance_activity_id_idx ON public.activity_attendance(activity_id);
CREATE INDEX IF NOT EXISTS activity_attendance_user_id_idx ON public.activity_attendance(user_id);

-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enable RLS on new tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_attendance ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "User profiles are viewable by everyone" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Membership Requests Policies
CREATE POLICY "Membership requests viewable by user and admins" ON public.membership_requests
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Users can create their own membership requests" ON public.membership_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can update membership requests" ON public.membership_requests
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Club Comments Policies
CREATE POLICY "Club comments are viewable by everyone" ON public.club_comments
    FOR SELECT USING (true);

CREATE POLICY "Club members can post comments" ON public.club_comments
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = club_comments.group_id 
        AND user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own comments" ON public.club_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.club_comments
    FOR DELETE USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Comment Reactions Policies
CREATE POLICY "Comment reactions are viewable by everyone" ON public.comment_reactions
    FOR SELECT USING (true);

CREATE POLICY "Club members can react to comments" ON public.comment_reactions
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.club_comments c
        JOIN public.group_members gm ON gm.group_id = c.group_id
        WHERE c.id = comment_reactions.comment_id 
        AND gm.user_id = auth.uid()
    ));

CREATE POLICY "Users can remove their own reactions" ON public.comment_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Activities Policies
CREATE POLICY "Activities are viewable by everyone" ON public.activities
    FOR SELECT USING (true);

CREATE POLICY "Admins and managers can create activities" ON public.activities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        ) OR auth.uid() = managed_by
    );

CREATE POLICY "Admins and managers can update activities" ON public.activities
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        ) OR auth.uid() = managed_by
    );

-- Coffee Vouchers Policies
CREATE POLICY "Users can view their own vouchers" ON public.coffee_vouchers
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Only system can create vouchers" ON public.coffee_vouchers
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Activity Attendance Policies
CREATE POLICY "Attendance is viewable by everyone" ON public.activity_attendance
    FOR SELECT USING (true);

CREATE POLICY "Users can register for activities" ON public.activity_attendance
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance" ON public.activity_attendance
    FOR UPDATE USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- ========================================
-- TRIGGERS AND FUNCTIONS
-- ========================================

-- Function to generate voucher code
CREATE OR REPLACE FUNCTION generate_voucher_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := 'LOKAL-';
    i INT;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check and award loyalty vouchers
CREATE OR REPLACE FUNCTION check_loyalty_voucher()
RETURNS TRIGGER AS $$
DECLARE
    attendance_count INT;
BEGIN
    -- Count confirmed attendances
    SELECT COUNT(*) INTO attendance_count
    FROM public.activity_attendance
    WHERE user_id = NEW.user_id AND attended = true;
    
    -- Award voucher every 6 activities
    IF attendance_count % 6 = 0 AND attendance_count > 0 THEN
        INSERT INTO public.coffee_vouchers (
            user_id, 
            voucher_code, 
            reason, 
            expires_at
        ) VALUES (
            NEW.user_id,
            generate_voucher_code(),
            'loyalty',
            NOW() + INTERVAL '30 days'
        );
        
        -- Update user profile voucher count
        UPDATE public.user_profiles
        SET coffee_voucher_count = coffee_voucher_count + 1,
            activity_attendance_count = attendance_count
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for loyalty vouchers
CREATE TRIGGER check_loyalty_after_attendance
AFTER UPDATE OF attended ON public.activity_attendance
FOR EACH ROW
WHEN (NEW.attended = true AND OLD.attended = false)
EXECUTE FUNCTION check_loyalty_voucher();

-- Function to auto-generate birthday vouchers
CREATE OR REPLACE FUNCTION generate_birthday_vouchers()
RETURNS void AS $$
BEGIN
    INSERT INTO public.coffee_vouchers (user_id, voucher_code, reason, expires_at)
    SELECT 
        up.user_id,
        generate_voucher_code(),
        'birthday',
        NOW() + INTERVAL '7 days'
    FROM public.user_profiles up
    WHERE 
        EXTRACT(MONTH FROM up.birthday) = EXTRACT(MONTH FROM NOW())
        AND EXTRACT(DAY FROM up.birthday) = EXTRACT(DAY FROM NOW())
        AND NOT EXISTS (
            SELECT 1 FROM public.coffee_vouchers cv
            WHERE cv.user_id = up.user_id 
            AND cv.reason = 'birthday'
            AND EXTRACT(YEAR FROM cv.created_at) = EXTRACT(YEAR FROM NOW())
        );
END;
$$ LANGUAGE plpgsql;

-- Update updated_at triggers for new tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();