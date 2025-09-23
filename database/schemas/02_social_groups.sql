-- Social Groups Database Schema
-- This creates the necessary tables for managing social groups in the cafe

-- Create social_groups table for storing group information
CREATE TABLE IF NOT EXISTS public.social_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT, -- 'movie', 'yoga', 'book_club', 'art', 'music', 'sports', etc.
    recurring_day TEXT, -- 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
    time TEXT, -- '18:00', '19:30', etc.
    location TEXT, -- Specific location within the cafe
    max_members INT DEFAULT NULL, -- NULL means unlimited
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create group_members table for tracking group membership
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.social_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'organizer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- Create group_sessions table for tracking specific meetings/sessions
CREATE TABLE IF NOT EXISTS public.group_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.social_groups(id) ON DELETE CASCADE NOT NULL,
    session_date DATE NOT NULL,
    session_time TEXT,
    topic TEXT, -- For example: "Movie: Inception" or "Yoga: Beginner Flow"
    notes TEXT,
    max_attendees INT,
    is_cancelled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, session_date)
);

-- Create session_attendees table for tracking who attended each session
CREATE TABLE IF NOT EXISTS public.session_attendees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.group_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    attended BOOLEAN DEFAULT false,
    UNIQUE(session_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.social_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_attendees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_groups
CREATE POLICY "Social groups are viewable by everyone" ON public.social_groups
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create social groups" ON public.social_groups
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Group creators can update their groups" ON public.social_groups
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups" ON public.social_groups
    FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for group_members
CREATE POLICY "Group members are viewable by everyone" ON public.group_members
    FOR SELECT USING (true);

CREATE POLICY "Users can join groups" ON public.group_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON public.group_members
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for group_sessions
CREATE POLICY "Group sessions are viewable by everyone" ON public.group_sessions
    FOR SELECT USING (true);

CREATE POLICY "Group creators can manage sessions" ON public.group_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.social_groups 
            WHERE id = group_id AND created_by = auth.uid()
        )
    );

CREATE POLICY "Group creators can update sessions" ON public.group_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.social_groups 
            WHERE id = group_id AND created_by = auth.uid()
        )
    );

CREATE POLICY "Group creators can delete sessions" ON public.group_sessions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.social_groups 
            WHERE id = group_id AND created_by = auth.uid()
        )
    );

-- RLS Policies for session_attendees
CREATE POLICY "Session attendees are viewable by everyone" ON public.session_attendees
    FOR SELECT USING (true);

CREATE POLICY "Users can register for sessions" ON public.session_attendees
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unregister from sessions" ON public.session_attendees
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_social_groups_updated_at BEFORE UPDATE ON public.social_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_sessions_updated_at BEFORE UPDATE ON public.group_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS social_groups_is_active_idx ON public.social_groups(is_active);
CREATE INDEX IF NOT EXISTS social_groups_recurring_day_idx ON public.social_groups(recurring_day);
CREATE INDEX IF NOT EXISTS social_groups_category_idx ON public.social_groups(category);
CREATE INDEX IF NOT EXISTS social_groups_created_by_idx ON public.social_groups(created_by);

CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON public.group_members(user_id);

CREATE INDEX IF NOT EXISTS group_sessions_group_id_idx ON public.group_sessions(group_id);
CREATE INDEX IF NOT EXISTS group_sessions_session_date_idx ON public.group_sessions(session_date);
CREATE INDEX IF NOT EXISTS group_sessions_is_cancelled_idx ON public.group_sessions(is_cancelled);

CREATE INDEX IF NOT EXISTS session_attendees_session_id_idx ON public.session_attendees(session_id);
CREATE INDEX IF NOT EXISTS session_attendees_user_id_idx ON public.session_attendees(user_id);