-- Complete Enhanced Database Schema for Lokal Cafe
-- This file can be run independently and handles all dependencies

-- ========================================
-- ENSURE BASE TABLES EXIST FIRST
-- ========================================

-- Create social_groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.social_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    recurring_day TEXT,
    time TEXT,
    location TEXT,
    max_members INT DEFAULT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create group_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.social_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'organizer', 'admin')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- Create duyurular (announcements) table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.duyurular (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create etkinlik_talepleri (activity requests) table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.etkinlik_talepleri (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requested_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- Add new columns to announcements table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'duyurular' 
                   AND column_name = 'group_id') THEN
        ALTER TABLE public.duyurular ADD COLUMN group_id UUID REFERENCES public.social_groups(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'duyurular' 
                   AND column_name = 'meeting_datetime') THEN
        ALTER TABLE public.duyurular ADD COLUMN meeting_datetime TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'duyurular' 
                   AND column_name = 'is_club_only') THEN
        ALTER TABLE public.duyurular ADD COLUMN is_club_only BOOLEAN DEFAULT false;
    END IF;
END $$;

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

-- Add new columns to etkinlik_talepleri if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'etkinlik_talepleri' 
                   AND column_name = 'assigned_to') THEN
        ALTER TABLE public.etkinlik_talepleri ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'etkinlik_talepleri' 
                   AND column_name = 'assigned_at') THEN
        ALTER TABLE public.etkinlik_talepleri ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'etkinlik_talepleri' 
                   AND column_name = 'admin_response') THEN
        ALTER TABLE public.etkinlik_talepleri ADD COLUMN admin_response TEXT;
    END IF;
END $$;

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
ALTER TABLE public.social_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duyurular ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etkinlik_talepleri ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
    -- User Profiles Policies
    DROP POLICY IF EXISTS "User profiles are viewable by everyone" ON public.user_profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
    
    CREATE POLICY "User profiles are viewable by everyone" ON public.user_profiles
        FOR SELECT USING (true);
    CREATE POLICY "Users can update their own profile" ON public.user_profiles
        FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own profile" ON public.user_profiles
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    -- Membership Requests Policies
    DROP POLICY IF EXISTS "Membership requests viewable by user and admins" ON public.membership_requests;
    DROP POLICY IF EXISTS "Users can create their own membership requests" ON public.membership_requests;
    DROP POLICY IF EXISTS "Only admins can update membership requests" ON public.membership_requests;
    
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
    DROP POLICY IF EXISTS "Club comments are viewable by everyone" ON public.club_comments;
    DROP POLICY IF EXISTS "Club members can post comments" ON public.club_comments;
    DROP POLICY IF EXISTS "Users can update their own comments" ON public.club_comments;
    DROP POLICY IF EXISTS "Users can delete their own comments" ON public.club_comments;
    
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

    -- Activities Policies
    DROP POLICY IF EXISTS "Activities are viewable by everyone" ON public.activities;
    DROP POLICY IF EXISTS "Admins and managers can create activities" ON public.activities;
    DROP POLICY IF EXISTS "Admins and managers can update activities" ON public.activities;
    
    CREATE POLICY "Activities are viewable by everyone" ON public.activities
        FOR SELECT USING (true);
    CREATE POLICY "Admins and managers can create activities" ON public.activities
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Admins and managers can update activities" ON public.activities
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE user_id = auth.uid() AND role = 'admin'
            ) OR auth.uid() = managed_by
        );

    -- Basic policies for existing tables
    DROP POLICY IF EXISTS "Social groups are viewable by everyone" ON public.social_groups;
    CREATE POLICY "Social groups are viewable by everyone" ON public.social_groups
        FOR SELECT USING (true);
        
    DROP POLICY IF EXISTS "Duyurular are viewable by everyone" ON public.duyurular;
    CREATE POLICY "Duyurular are viewable by everyone" ON public.duyurular
        FOR SELECT USING (true);
END $$;

-- ========================================
-- TRIGGERS AND FUNCTIONS
-- ========================================

-- Create or replace update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at if they don't exist
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_activities_updated_at ON public.activities;
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_social_groups_updated_at ON public.social_groups;
CREATE TRIGGER update_social_groups_updated_at BEFORE UPDATE ON public.social_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_duyurular_updated_at ON public.duyurular;
CREATE TRIGGER update_duyurular_updated_at BEFORE UPDATE ON public.duyurular
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_etkinlik_talepleri_updated_at ON public.etkinlik_talepleri;
CREATE TRIGGER update_etkinlik_talepleri_updated_at BEFORE UPDATE ON public.etkinlik_talepleri
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Create trigger for loyalty vouchers
DROP TRIGGER IF EXISTS check_loyalty_after_attendance ON public.activity_attendance;
CREATE TRIGGER check_loyalty_after_attendance
AFTER UPDATE OF attended ON public.activity_attendance
FOR EACH ROW
WHEN (NEW.attended = true AND OLD.attended = false)
EXECUTE FUNCTION check_loyalty_voucher();