-- Create articles table
CREATE TABLE public.articles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  featured_image text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  views integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for articles
CREATE POLICY "Anyone can view published articles"
ON public.articles
FOR SELECT
USING (status = 'published');

CREATE POLICY "Admins can insert articles"
ON public.articles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update articles"
ON public.articles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete articles"
ON public.articles
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create article_products junction table (for linking products to articles)
CREATE TABLE public.article_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  position integer DEFAULT 0,
  UNIQUE(article_id, product_id)
);

ALTER TABLE public.article_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view article products"
ON public.article_products
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage article products"
ON public.article_products
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Insert sample articles
INSERT INTO public.articles (title, slug, content, excerpt, featured_image, category_id, status) VALUES
(
  'Top 10 Kitchen Chimneys in 2025',
  'top-10-kitchen-chimneys-2025',
  'Discover the best kitchen chimneys with powerful suction, auto-clean features, and modern designs. We have tested and reviewed the top models available in the Indian market. From budget-friendly options to premium models, find the perfect chimney for your kitchen.',
  'Comprehensive guide to the best kitchen chimneys in 2025 with detailed comparisons',
  'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800',
  (SELECT id FROM public.categories WHERE slug = 'kitchen' LIMIT 1),
  'published'
),
(
  'Best Air Conditioners Under ₹30000',
  'best-air-conditioners-under-30000',
  'Looking for an affordable AC? We have compiled a list of the best air conditioners under ₹30000. These models offer excellent cooling, energy efficiency, and durability without breaking the bank.',
  'Find the perfect air conditioner that fits your budget',
  'https://images.unsplash.com/photo-1631545877313-c5a9004d0b1f?w=800',
  (SELECT id FROM public.categories WHERE slug = 'home-appliances' LIMIT 1),
  'published'
),
(
  'Smart TV Buying Guide 2025',
  'smart-tv-buying-guide-2025',
  'Everything you need to know before buying a smart TV in 2025. Learn about screen sizes, resolution, smart features, and the best brands. We compare OLED vs LED, 4K vs 8K, and help you make an informed decision.',
  'Complete buying guide for smart TVs with expert recommendations',
  'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800',
  (SELECT id FROM public.categories WHERE slug = 'electronics' LIMIT 1),
  'published'
),
(
  'Best Refrigerators for Large Families',
  'best-refrigerators-large-families',
  'Large family needs large storage. Discover refrigerators with 500+ liters capacity, multiple compartments, and energy-efficient cooling. We review the best double-door and French-door models available.',
  'Top refrigerator picks for large families with detailed analysis',
  'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800',
  (SELECT id FROM public.categories WHERE slug = 'home-appliances' LIMIT 1),
  'published'
),
(
  'Ultimate Guide to Smart Home Devices',
  'ultimate-guide-smart-home-devices',
  'Transform your home into a smart home. Learn about smart lights, smart locks, voice assistants, and home automation systems. We review the best devices and how to integrate them seamlessly.',
  'Everything about building a smart home ecosystem',
  'https://images.unsplash.com/photo-1558002038-1055907df827?w=800',
  (SELECT id FROM public.categories WHERE slug = 'smart-devices' LIMIT 1),
  'published'
);

-- Trigger for updated_at
CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();