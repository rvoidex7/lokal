-- Create products table for cafe products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    category TEXT DEFAULT 'other' CHECK (category IN ('cup', 'glass', 'ceramic', 'accessory', 'other')),
    is_available BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
-- Everyone can view available products
CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (is_available = true OR auth.uid() IS NOT NULL);

-- Only authenticated users can insert products
CREATE POLICY "Authenticated users can insert products" ON public.products
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users can update products
CREATE POLICY "Authenticated users can update products" ON public.products
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Only authenticated users can delete products
CREATE POLICY "Authenticated users can delete products" ON public.products
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_products_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_products_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category);
CREATE INDEX IF NOT EXISTS products_is_available_idx ON public.products(is_available);
CREATE INDEX IF NOT EXISTS products_display_order_idx ON public.products(display_order);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON public.products(created_at);