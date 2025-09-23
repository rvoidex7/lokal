-- ==============================================
-- Complete Setup SQL for Lokal Cafe
-- Run this file in Supabase SQL Editor to set up everything
-- ==============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- STORAGE BUCKET SETUP
-- ==============================================

-- Create storage bucket for uploads if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880;

-- Storage policies for uploads bucket
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own uploads" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ==============================================
-- BASE TABLES CREATION
-- ==============================================

-- Create social_groups table
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

-- Create group_members table
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

-- Create duyurular (announcements) table
CREATE TABLE IF NOT EXISTS public.duyurular (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create katilimcilar (participants) table
CREATE TABLE IF NOT EXISTS public.katilimcilar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    duyuru_id UUID REFERENCES public.duyurular(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(duyuru_id, user_id)
);

-- Create etkinlik_talepleri (activity requests) table
CREATE TABLE IF NOT EXISTS public.etkinlik_talepleri (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_type TEXT,
    expected_participants TEXT,
    preferred_date DATE,
    duration TEXT,
    budget_range TEXT,
    organization_name TEXT,
    requested_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    phone_number TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_profiles table
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

-- Create membership_requests table
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

-- Create club_comments table
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

-- Create comment_reactions table
CREATE TABLE IF NOT EXISTS public.comment_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES public.club_comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'heart', 'applause', 'thinking')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(comment_id, user_id)
);

-- Create activities table
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

-- Create coffee_vouchers table
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

-- Create activity_attendance table
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

-- Add columns to existing tables if they don't exist
DO $$ 
BEGIN
    -- Add columns to duyurular
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'duyurular' AND column_name = 'group_id') THEN
        ALTER TABLE public.duyurular ADD COLUMN group_id UUID REFERENCES public.social_groups(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'duyurular' AND column_name = 'meeting_datetime') THEN
        ALTER TABLE public.duyurular ADD COLUMN meeting_datetime TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'duyurular' AND column_name = 'is_club_only') THEN
        ALTER TABLE public.duyurular ADD COLUMN is_club_only BOOLEAN DEFAULT false;
    END IF;
    
    -- Add columns to etkinlik_talepleri
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'etkinlik_talepleri' AND column_name = 'assigned_to') THEN
        ALTER TABLE public.etkinlik_talepleri ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'etkinlik_talepleri' AND column_name = 'assigned_at') THEN
        ALTER TABLE public.etkinlik_talepleri ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'etkinlik_talepleri' AND column_name = 'admin_response') THEN
        ALTER TABLE public.etkinlik_talepleri ADD COLUMN admin_response TEXT;
    END IF;
END $$;

-- ==============================================
-- ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE public.social_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duyurular ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.katilimcilar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etkinlik_talepleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_attendance ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- DROP AND RECREATE ALL RLS POLICIES
-- ==============================================

-- Social Groups Policies
DROP POLICY IF EXISTS "Social groups are viewable by everyone" ON public.social_groups;
DROP POLICY IF EXISTS "Authenticated users can create social groups" ON public.social_groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON public.social_groups;
DROP POLICY IF EXISTS "Group creators can delete their groups" ON public.social_groups;

CREATE POLICY "Social groups are viewable by everyone" 
    ON public.social_groups FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can create social groups" 
    ON public.social_groups FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Group creators can update their groups" 
    ON public.social_groups FOR UPDATE 
    USING (auth.uid() = created_by OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Group creators can delete their groups" 
    ON public.social_groups FOR DELETE 
    USING (auth.uid() = created_by OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Group Members Policies
DROP POLICY IF EXISTS "Group members are viewable by everyone" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
DROP POLICY IF EXISTS "Admins can manage group members" ON public.group_members;

CREATE POLICY "Group members are viewable by everyone" 
    ON public.group_members FOR SELECT 
    USING (true);

CREATE POLICY "Users can join groups" 
    ON public.group_members FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Users can leave groups" 
    ON public.group_members FOR DELETE 
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can manage group members"
    ON public.group_members FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Duyurular (Announcements) Policies
DROP POLICY IF EXISTS "Duyurular are viewable by everyone" ON public.duyurular;
DROP POLICY IF EXISTS "Users can insert duyurular" ON public.duyurular;
DROP POLICY IF EXISTS "Users can update their own duyurular" ON public.duyurular;
DROP POLICY IF EXISTS "Users can delete their own duyurular" ON public.duyurular;

CREATE POLICY "Duyurular are viewable by everyone" 
    ON public.duyurular FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can insert duyurular" 
    ON public.duyurular FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own duyurular" 
    ON public.duyurular FOR UPDATE 
    USING (auth.uid() = created_by OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Users can delete their own duyurular" 
    ON public.duyurular FOR DELETE 
    USING (auth.uid() = created_by OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Katilimcilar (Participants) Policies
DROP POLICY IF EXISTS "Katilimcilar are viewable by everyone" ON public.katilimcilar;
DROP POLICY IF EXISTS "Users can insert their own participation" ON public.katilimcilar;
DROP POLICY IF EXISTS "Users can delete their own participation" ON public.katilimcilar;

CREATE POLICY "Katilimcilar are viewable by everyone" 
    ON public.katilimcilar FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert their own participation" 
    ON public.katilimcilar FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own participation" 
    ON public.katilimcilar FOR DELETE 
    USING (auth.uid() = user_id);

-- Etkinlik Talepleri (Activity Requests) Policies
DROP POLICY IF EXISTS "Etkinlik talepleri are viewable by everyone" ON public.etkinlik_talepleri;
DROP POLICY IF EXISTS "Users can insert their own requests" ON public.etkinlik_talepleri;
DROP POLICY IF EXISTS "Users can update their own requests" ON public.etkinlik_talepleri;
DROP POLICY IF EXISTS "Admins can manage all requests" ON public.etkinlik_talepleri;

CREATE POLICY "Etkinlik talepleri are viewable by everyone" 
    ON public.etkinlik_talepleri FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert their own requests" 
    ON public.etkinlik_talepleri FOR INSERT 
    WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Users can update their own requests" 
    ON public.etkinlik_talepleri FOR UPDATE 
    USING (auth.uid() = requested_by OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can manage all requests"
    ON public.etkinlik_talepleri FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- User Profiles Policies
DROP POLICY IF EXISTS "User profiles are viewable by everyone" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

CREATE POLICY "User profiles are viewable by everyone" 
    ON public.user_profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert their own profile" 
    ON public.user_profiles FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
    ON public.user_profiles FOR UPDATE 
    USING (auth.uid() = user_id);

-- Membership Requests Policies
DROP POLICY IF EXISTS "Membership requests viewable by user and admins" ON public.membership_requests;
DROP POLICY IF EXISTS "Users can create their own membership requests" ON public.membership_requests;
DROP POLICY IF EXISTS "Only admins can update membership requests" ON public.membership_requests;

CREATE POLICY "Membership requests viewable by user and admins" 
    ON public.membership_requests FOR SELECT 
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Users can create their own membership requests" 
    ON public.membership_requests FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can update membership requests" 
    ON public.membership_requests FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Club Comments Policies
DROP POLICY IF EXISTS "Club comments are viewable by everyone" ON public.club_comments;
DROP POLICY IF EXISTS "Club members can post comments" ON public.club_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.club_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.club_comments;

CREATE POLICY "Club comments are viewable by everyone" 
    ON public.club_comments FOR SELECT 
    USING (true);

CREATE POLICY "Club members can post comments" 
    ON public.club_comments FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = club_comments.group_id 
        AND user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own comments" 
    ON public.club_comments FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
    ON public.club_comments FOR DELETE 
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Comment Reactions Policies
DROP POLICY IF EXISTS "Comment reactions are viewable by everyone" ON public.comment_reactions;
DROP POLICY IF EXISTS "Club members can react to comments" ON public.comment_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON public.comment_reactions;

CREATE POLICY "Comment reactions are viewable by everyone" 
    ON public.comment_reactions FOR SELECT 
    USING (true);

CREATE POLICY "Club members can react to comments" 
    ON public.comment_reactions FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.club_comments c
        JOIN public.group_members gm ON gm.group_id = c.group_id
        WHERE c.id = comment_reactions.comment_id 
        AND gm.user_id = auth.uid()
    ));

CREATE POLICY "Users can remove their own reactions" 
    ON public.comment_reactions FOR DELETE 
    USING (auth.uid() = user_id);

-- Activities Policies
DROP POLICY IF EXISTS "Activities are viewable by everyone" ON public.activities;
DROP POLICY IF EXISTS "Admins and managers can create activities" ON public.activities;
DROP POLICY IF EXISTS "Admins and managers can update activities" ON public.activities;

CREATE POLICY "Activities are viewable by everyone" 
    ON public.activities FOR SELECT 
    USING (true);

CREATE POLICY "Admins and managers can create activities" 
    ON public.activities FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) OR auth.uid() = managed_by);

CREATE POLICY "Admins and managers can update activities" 
    ON public.activities FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) OR auth.uid() = managed_by);

-- Coffee Vouchers Policies
DROP POLICY IF EXISTS "Users can view their own vouchers" ON public.coffee_vouchers;
DROP POLICY IF EXISTS "Only system can create vouchers" ON public.coffee_vouchers;

CREATE POLICY "Users can view their own vouchers" 
    ON public.coffee_vouchers FOR SELECT 
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Only admins can create vouchers" 
    ON public.coffee_vouchers FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Activity Attendance Policies
DROP POLICY IF EXISTS "Attendance is viewable by everyone" ON public.activity_attendance;
DROP POLICY IF EXISTS "Users can register for activities" ON public.activity_attendance;
DROP POLICY IF EXISTS "Users can update their own attendance" ON public.activity_attendance;

CREATE POLICY "Attendance is viewable by everyone" 
    ON public.activity_attendance FOR SELECT 
    USING (true);

CREATE POLICY "Users can register for activities" 
    ON public.activity_attendance FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance" 
    ON public.activity_attendance FOR UPDATE 
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- ==============================================
-- CREATE INDEXES
-- ==============================================

CREATE INDEX IF NOT EXISTS social_groups_is_active_idx ON public.social_groups(is_active);
CREATE INDEX IF NOT EXISTS social_groups_created_by_idx ON public.social_groups(created_by);
CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS duyurular_created_at_idx ON public.duyurular(created_at);
CREATE INDEX IF NOT EXISTS duyurular_created_by_idx ON public.duyurular(created_by);
CREATE INDEX IF NOT EXISTS katilimcilar_duyuru_id_idx ON public.katilimcilar(duyuru_id);
CREATE INDEX IF NOT EXISTS katilimcilar_user_id_idx ON public.katilimcilar(user_id);
CREATE INDEX IF NOT EXISTS etkinlik_talepleri_requested_by_idx ON public.etkinlik_talepleri(requested_by);
CREATE INDEX IF NOT EXISTS etkinlik_talepleri_status_idx ON public.etkinlik_talepleri(status);
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS membership_requests_group_id_idx ON public.membership_requests(group_id);
CREATE INDEX IF NOT EXISTS membership_requests_status_idx ON public.membership_requests(status);
CREATE INDEX IF NOT EXISTS club_comments_group_id_idx ON public.club_comments(group_id);
CREATE INDEX IF NOT EXISTS activities_date_time_idx ON public.activities(date_time);
CREATE INDEX IF NOT EXISTS coffee_vouchers_user_id_idx ON public.coffee_vouchers(user_id);

-- ==============================================
-- CREATE OR REPLACE FUNCTIONS
-- ==============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_social_groups_updated_at ON public.social_groups;
CREATE TRIGGER update_social_groups_updated_at 
    BEFORE UPDATE ON public.social_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_duyurular_updated_at ON public.duyurular;
CREATE TRIGGER update_duyurular_updated_at 
    BEFORE UPDATE ON public.duyurular
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_etkinlik_talepleri_updated_at ON public.etkinlik_talepleri;
CREATE TRIGGER update_etkinlik_talepleri_updated_at 
    BEFORE UPDATE ON public.etkinlik_talepleri
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_activities_updated_at ON public.activities;
CREATE TRIGGER update_activities_updated_at 
    BEFORE UPDATE ON public.activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- GRANT PERMISSIONS
-- ==============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ==============================================
-- FINAL MESSAGE
-- ==============================================
DO $$
BEGIN
    RAISE NOTICE 'Setup completed successfully! All tables, policies, and permissions have been configured.';
END $$;