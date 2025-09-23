-- Personal Letters Table Schema for User Dashboard
-- This adds the personal letters functionality to the Lokal cafe system

-- Create personal_letters table
CREATE TABLE IF NOT EXISTS public.personal_letters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS personal_letters_user_id_idx ON public.personal_letters(user_id);
CREATE INDEX IF NOT EXISTS personal_letters_status_idx ON public.personal_letters(status);
CREATE INDEX IF NOT EXISTS personal_letters_created_at_idx ON public.personal_letters(created_at);

-- Enable Row Level Security
ALTER TABLE public.personal_letters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for personal letters
CREATE POLICY "Users can view their own letters" ON public.personal_letters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own letters" ON public.personal_letters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own letters" ON public.personal_letters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own letters" ON public.personal_letters
    FOR DELETE USING (auth.uid() = user_id);

-- Published letters are viewable by everyone (optional - for community sharing)
CREATE POLICY "Published letters are viewable by everyone" ON public.personal_letters
    FOR SELECT USING (status = 'published');

-- Create trigger for updated_at column
DROP TRIGGER IF EXISTS update_personal_letters_updated_at ON public.personal_letters;
CREATE TRIGGER update_personal_letters_updated_at BEFORE UPDATE ON public.personal_letters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();