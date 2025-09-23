-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

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
    requested_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.duyurular ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.katilimcilar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etkinlik_talepleri ENABLE ROW LEVEL SECURITY;

-- RLS Policies for duyurular
CREATE POLICY "Duyurular are viewable by everyone" ON public.duyurular
    FOR SELECT USING (true);

CREATE POLICY "Users can insert duyurular" ON public.duyurular
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own duyurular" ON public.duyurular
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own duyurular" ON public.duyurular
    FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for katilimcilar
CREATE POLICY "Katilimcilar are viewable by everyone" ON public.katilimcilar
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own participation" ON public.katilimcilar
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own participation" ON public.katilimcilar
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for etkinlik_talepleri
CREATE POLICY "Etkinlik talepleri are viewable by everyone" ON public.etkinlik_talepleri
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own requests" ON public.etkinlik_talepleri
    FOR INSERT WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Users can update their own requests" ON public.etkinlik_talepleri
    FOR UPDATE USING (auth.uid() = requested_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_duyurular_updated_at BEFORE UPDATE ON public.duyurular
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_etkinlik_talepleri_updated_at BEFORE UPDATE ON public.etkinlik_talepleri
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS duyurular_created_at_idx ON public.duyurular(created_at);
CREATE INDEX IF NOT EXISTS duyurular_created_by_idx ON public.duyurular(created_by);
CREATE INDEX IF NOT EXISTS katilimcilar_duyuru_id_idx ON public.katilimcilar(duyuru_id);
CREATE INDEX IF NOT EXISTS katilimcilar_user_id_idx ON public.katilimcilar(user_id);
CREATE INDEX IF NOT EXISTS etkinlik_talepleri_requested_by_idx ON public.etkinlik_talepleri(requested_by);
CREATE INDEX IF NOT EXISTS etkinlik_talepleri_status_idx ON public.etkinlik_talepleri(status); 