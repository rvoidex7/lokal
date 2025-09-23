-- Database Migration: Add Notification System Tables
-- Run this script in your Supabase SQL Editor

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('activity_reminder', 'activity_reminder_24h', 'activity_reminder_1h', 'activity_update', 'activity_cancelled', 'new_activity', 'social_interaction', 'system')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('activity', 'social', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_email_sent BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  related_type VARCHAR(20) CHECK (related_type IN ('activity', 'group', 'user', 'comment')),
  action_url VARCHAR(500),
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  activity_reminders_24h BOOLEAN NOT NULL DEFAULT true,
  activity_reminders_1h BOOLEAN NOT NULL DEFAULT true,
  activity_updates BOOLEAN NOT NULL DEFAULT true,
  new_activities BOOLEAN NOT NULL DEFAULT true,
  social_notifications BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  preferred_reminder_time VARCHAR(5) NOT NULL DEFAULT '09:00',
  timezone VARCHAR(50) NOT NULL DEFAULT 'Europe/Istanbul',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. User Connections Table
CREATE TABLE IF NOT EXISTS public.user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connected_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_type VARCHAR(20) NOT NULL CHECK (connection_type IN ('follower', 'following', 'friend')),
  status VARCHAR(20) NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, connected_user_id, connection_type)
);

-- 4. Activity Statistics Table
CREATE TABLE IF NOT EXISTS public.activity_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL UNIQUE REFERENCES public.activities(id) ON DELETE CASCADE,
  total_views INTEGER NOT NULL DEFAULT 0,
  total_registrations INTEGER NOT NULL DEFAULT 0,
  total_attendees INTEGER NOT NULL DEFAULT 0,
  total_ratings INTEGER NOT NULL DEFAULT 0,
  average_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5),
  total_comments INTEGER NOT NULL DEFAULT 0,
  completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (completion_rate >= 0 AND completion_rate <= 100),
  no_show_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (no_show_rate >= 0 AND no_show_rate <= 100),
  last_calculated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Activity Ratings Table (Enhanced)
CREATE TABLE IF NOT EXISTS public.activity_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name VARCHAR(100) NOT NULL,
  user_avatar VARCHAR(500),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  photos TEXT[], -- Array of image URLs
  helpful_count INTEGER NOT NULL DEFAULT 0,
  is_verified_attendance BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(activity_id, user_id)
);

-- 6. Activity Comments Table (Enhanced)
CREATE TABLE IF NOT EXISTS public.activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name VARCHAR(100) NOT NULL,
  user_avatar VARCHAR(500),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.activity_comments(id) ON DELETE CASCADE,
  is_organizer_response BOOLEAN NOT NULL DEFAULT false,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMPTZ,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Notification Templates Table
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(20) NOT NULL,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  email_subject_template TEXT,
  email_body_template TEXT,
  variables TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON public.notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_connections_user_id ON public.user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_connected_user ON public.user_connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_type ON public.user_connections(connection_type);

CREATE INDEX IF NOT EXISTS idx_activity_statistics_activity_id ON public.activity_statistics(activity_id);

CREATE INDEX IF NOT EXISTS idx_activity_ratings_activity_id ON public.activity_ratings(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_ratings_user_id ON public.activity_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_ratings_rating ON public.activity_ratings(rating);

CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id ON public.activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_user_id ON public.activity_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_parent_id ON public.activity_comments(parent_id) WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON public.notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON public.notification_templates(is_active);

-- Create Updated At Triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

DROP TRIGGER IF EXISTS handle_notifications_updated_at ON public.notifications;
CREATE TRIGGER handle_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER handle_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_activity_statistics_updated_at ON public.activity_statistics;
CREATE TRIGGER handle_activity_statistics_updated_at
  BEFORE UPDATE ON public.activity_statistics
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_activity_ratings_updated_at ON public.activity_ratings;
CREATE TRIGGER handle_activity_ratings_updated_at
  BEFORE UPDATE ON public.activity_ratings
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_notification_templates_updated_at ON public.notification_templates;
CREATE TRIGGER handle_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Row Level Security (RLS) Policies

-- Notifications RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- User Preferences RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Connections RLS
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view connections involving them" ON public.user_connections;
CREATE POLICY "Users can view connections involving them" ON public.user_connections
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

DROP POLICY IF EXISTS "Users can manage their own connections" ON public.user_connections;
CREATE POLICY "Users can manage their own connections" ON public.user_connections
  FOR ALL USING (auth.uid() = user_id);

-- Activity Statistics RLS
ALTER TABLE public.activity_statistics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view activity statistics" ON public.activity_statistics;
CREATE POLICY "Anyone can view activity statistics" ON public.activity_statistics
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "System can manage activity statistics" ON public.activity_statistics;
CREATE POLICY "System can manage activity statistics" ON public.activity_statistics
  FOR ALL USING (true);

-- Activity Ratings RLS
ALTER TABLE public.activity_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view activity ratings" ON public.activity_ratings;
CREATE POLICY "Anyone can view activity ratings" ON public.activity_ratings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can manage their own ratings" ON public.activity_ratings;
CREATE POLICY "Users can manage their own ratings" ON public.activity_ratings
  FOR ALL USING (auth.uid() = user_id);

-- Activity Comments RLS
ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view activity comments" ON public.activity_comments;
CREATE POLICY "Anyone can view activity comments" ON public.activity_comments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.activity_comments;
CREATE POLICY "Authenticated users can insert comments" ON public.activity_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.activity_comments;
CREATE POLICY "Users can update their own comments" ON public.activity_comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.activity_comments;
CREATE POLICY "Users can delete their own comments" ON public.activity_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Notification Templates RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active templates" ON public.notification_templates;
CREATE POLICY "Anyone can view active templates" ON public.notification_templates
  FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage templates" ON public.notification_templates;
CREATE POLICY "Admins can manage templates" ON public.notification_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert Default Notification Templates
INSERT INTO public.notification_templates (type, category, title_template, message_template, email_subject_template, email_body_template, variables) VALUES
('activity_reminder_24h', 'activity', 'Etkinlik Hatırlatması', '{{activity_title}} etkinliği yarın {{activity_time}} saatinde başlayacak!', 'Yarınki Etkinliğinizi Unutmayın', 'Merhaba {{user_name}},\n\n{{activity_title}} etkinliği yarın {{activity_date}} tarihinde {{activity_time}} saatinde {{activity_location}} konumunda gerçekleşecek.\n\nDetaylar için: {{activity_url}}', ARRAY['activity_title', 'activity_time', 'activity_date', 'activity_location', 'activity_url', 'user_name']),

('activity_reminder_1h', 'activity', 'Etkinlik Yakında', '{{activity_title}} etkinliği 1 saat içinde başlayacak!', 'Etkinliğiniz 1 Saat İçinde Başlıyor', 'Merhaba {{user_name}},\n\n{{activity_title}} etkinliği 1 saat içinde {{activity_location}} konumunda başlayacak.\n\nHazır olduğunuzdan emin olun!', ARRAY['activity_title', 'activity_location', 'user_name']),

('activity_cancelled', 'activity', 'Etkinlik İptal Edildi', '{{activity_title}} etkinliği iptal edilmiştir. Sebep: {{cancellation_reason}}', 'Etkinlik İptal Edildi', 'Merhaba {{user_name}},\n\nMaalesef {{activity_title}} etkinliği iptal edilmiştir.\n\nİptal sebebi: {{cancellation_reason}}\n\nBu durumdan dolayı özür dileriz.', ARRAY['activity_title', 'cancellation_reason', 'user_name']),

('new_activity', 'activity', 'Yeni Etkinlik', '{{activity_title}} adlı yeni bir etkinlik eklendi!', 'Yeni Etkinlik Duyurusu', 'Merhaba {{user_name}},\n\n{{activity_title}} adlı yeni bir etkinlik {{activity_date}} tarihinde düzenlenecek.\n\nDetaylar: {{activity_url}}', ARRAY['activity_title', 'activity_date', 'activity_url', 'user_name']),

('social_new_follower', 'social', 'Yeni Takipçi', '{{follower_name}} sizi takip etmeye başladı!', 'Yeni Takipçiniz Var', 'Merhaba {{user_name}},\n\n{{follower_name}} sizi takip etmeye başladı.\n\nProfil: {{follower_url}}', ARRAY['follower_name', 'follower_url', 'user_name']),

('social_new_comment', 'social', 'Yeni Yorum', '{{commenter_name}} etkinliğinize yorum yaptı', 'Etkinliğinize Yeni Yorum', 'Merhaba {{user_name}},\n\n{{commenter_name}} "{{activity_title}}" etkinliğinize yorum yaptı:\n\n"{{comment_content}}"\n\nYanıtlamak için: {{activity_url}}', ARRAY['commenter_name', 'activity_title', 'comment_content', 'activity_url', 'user_name']);

-- Create default user preferences for existing users
INSERT INTO public.user_preferences (user_id)
SELECT u.id FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_preferences p WHERE p.user_id = u.id
);

COMMENT ON TABLE public.notifications IS 'Stores user notifications for activity reminders, updates, and social interactions';
COMMENT ON TABLE public.user_preferences IS 'User notification and communication preferences';
COMMENT ON TABLE public.user_connections IS 'Social connections between users (followers, friends)';
COMMENT ON TABLE public.activity_statistics IS 'Statistics and analytics for activities';
COMMENT ON TABLE public.activity_ratings IS 'User ratings and reviews for activities';
COMMENT ON TABLE public.activity_comments IS 'Comments and discussions on activities';
COMMENT ON TABLE public.notification_templates IS 'Templates for generating notifications and emails';