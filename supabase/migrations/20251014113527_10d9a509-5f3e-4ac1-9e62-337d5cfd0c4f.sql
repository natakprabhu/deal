-- Insert sample stores
INSERT INTO public.stores (name, slug, logo_url, affiliate_base_url, status) VALUES
('Amazon', 'amazon', 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', 'https://www.amazon.in', 'active'),
('Flipkart', 'flipkart', 'https://upload.wikimedia.org/wikipedia/en/7/7a/Flipkart_logo.png', 'https://www.flipkart.com', 'active'),
('Myntra', 'myntra', 'https://constant.myntassets.com/web/assets/img/myntra_logo.png', 'https://www.myntra.com', 'active');

-- Insert sample categories
INSERT INTO public.categories (name, slug, icon) VALUES
('Electronics', 'electronics', 'Laptop'),
('Fashion', 'fashion', 'Shirt'),
('Home & Kitchen', 'home-kitchen', 'Home'),
('Books', 'books', 'BookOpen'),
('Sports', 'sports', 'Bike');

-- Insert sample products (using store and category IDs)
INSERT INTO public.products (store_id, category_id, title, description, image_url, price, mrp, discount_percent, affiliate_url, rating, in_stock)
SELECT 
  s.id,
  c.id,
  'Apple iPhone 15 Pro Max (256GB)',
  'Latest iPhone with A17 Pro chip, titanium design, and advanced camera system',
  'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500',
  124999,
  134900,
  7,
  s.affiliate_base_url || '/iphone-15-pro-max',
  4.8,
  true
FROM public.stores s, public.categories c
WHERE s.slug = 'amazon' AND c.slug = 'electronics';

INSERT INTO public.products (store_id, category_id, title, description, image_url, price, mrp, discount_percent, affiliate_url, rating, in_stock)
SELECT 
  s.id,
  c.id,
  'Samsung Galaxy S24 Ultra (512GB)',
  'Flagship Android phone with 200MP camera and S Pen',
  'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500',
  119999,
  129999,
  8,
  s.affiliate_base_url || '/samsung-s24-ultra',
  4.7,
  true
FROM public.stores s, public.categories c
WHERE s.slug = 'flipkart' AND c.slug = 'electronics';

INSERT INTO public.products (store_id, category_id, title, description, image_url, price, mrp, discount_percent, affiliate_url, rating, in_stock)
SELECT 
  s.id,
  c.id,
  'Sony WH-1000XM5 Headphones',
  'Industry-leading noise canceling headphones with premium sound',
  'https://images.unsplash.com/photo-1545127398-14699f92334b?w=500',
  24990,
  29990,
  17,
  s.affiliate_base_url || '/sony-headphones',
  4.9,
  true
FROM public.stores s, public.categories c
WHERE s.slug = 'amazon' AND c.slug = 'electronics';

INSERT INTO public.products (store_id, category_id, title, description, image_url, price, mrp, discount_percent, affiliate_url, rating, in_stock)
SELECT 
  s.id,
  c.id,
  'Nike Air Max Running Shoes',
  'Comfortable running shoes with Air cushioning technology',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
  7999,
  12995,
  38,
  s.affiliate_base_url || '/nike-air-max',
  4.5,
  true
FROM public.stores s, public.categories c
WHERE s.slug = 'myntra' AND c.slug = 'sports';

INSERT INTO public.products (store_id, category_id, title, description, image_url, price, mrp, discount_percent, affiliate_url, rating, in_stock)
SELECT 
  s.id,
  c.id,
  'Levi''s Men''s Slim Fit Jeans',
  'Classic denim jeans with modern fit',
  'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
  1899,
  2999,
  37,
  s.affiliate_base_url || '/levis-jeans',
  4.4,
  true
FROM public.stores s, public.categories c
WHERE s.slug = 'myntra' AND c.slug = 'fashion';

INSERT INTO public.products (store_id, category_id, title, description, image_url, price, mrp, discount_percent, affiliate_url, rating, in_stock)
SELECT 
  s.id,
  c.id,
  'MacBook Air M2 (256GB)',
  'Thin and light laptop powered by Apple M2 chip',
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
  99990,
  119900,
  17,
  s.affiliate_base_url || '/macbook-air-m2',
  4.9,
  true
FROM public.stores s, public.categories c
WHERE s.slug = 'amazon' AND c.slug = 'electronics';

INSERT INTO public.products (store_id, category_id, title, description, image_url, price, mrp, discount_percent, affiliate_url, rating, in_stock)
SELECT 
  s.id,
  c.id,
  'Instant Pot Duo 6L Pressure Cooker',
  '9-in-1 programmable pressure cooker for quick cooking',
  'https://images.unsplash.com/photo-1585515320310-259814833e62?w=500',
  6999,
  9990,
  30,
  s.affiliate_base_url || '/instant-pot',
  4.6,
  true
FROM public.stores s, public.categories c
WHERE s.slug = 'amazon' AND c.slug = 'home-kitchen';

INSERT INTO public.products (store_id, category_id, title, description, image_url, price, mrp, discount_percent, affiliate_url, rating, in_stock)
SELECT 
  s.id,
  c.id,
  'Atomic Habits by James Clear',
  'Bestselling book on building good habits and breaking bad ones',
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
  399,
  599,
  33,
  s.affiliate_base_url || '/atomic-habits',
  4.8,
  true
FROM public.stores s, public.categories c
WHERE s.slug = 'amazon' AND c.slug = 'books';

INSERT INTO public.products (store_id, category_id, title, description, image_url, price, mrp, discount_percent, affiliate_url, rating, in_stock)
SELECT 
  s.id,
  c.id,
  'Adidas Ultraboost Running Shoes',
  'Premium running shoes with Boost cushioning',
  'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500',
  12999,
  16999,
  24,
  s.affiliate_base_url || '/adidas-ultraboost',
  4.7,
  true
FROM public.stores s, public.categories c
WHERE s.slug = 'flipkart' AND c.slug = 'sports';

INSERT INTO public.products (store_id, category_id, title, description, image_url, price, mrp, discount_percent, affiliate_url, rating, in_stock)
SELECT 
  s.id,
  c.id,
  'Zara Women''s Blazer',
  'Professional blazer for office and formal occasions',
  'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=500',
  3999,
  5999,
  33,
  s.affiliate_base_url || '/zara-blazer',
  4.3,
  true
FROM public.stores s, public.categories c
WHERE s.slug = 'myntra' AND c.slug = 'fashion';

-- Insert current prices for all products
INSERT INTO public.product_prices (product_id, price, source)
SELECT id, price, 'api' FROM public.products;

-- Insert some price history to show price drops
INSERT INTO public.price_history (product_id, old_price, new_price, changed_at)
SELECT 
  id,
  134900,
  124999,
  NOW() - INTERVAL '2 days'
FROM public.products
WHERE title LIKE '%iPhone 15%';

INSERT INTO public.price_history (product_id, old_price, new_price, changed_at)
SELECT 
  id,
  29990,
  24990,
  NOW() - INTERVAL '5 days'
FROM public.products
WHERE title LIKE '%Sony%';

INSERT INTO public.price_history (product_id, old_price, new_price, changed_at)
SELECT 
  id,
  9990,
  6999,
  NOW() - INTERVAL '1 day'
FROM public.products
WHERE title LIKE '%Instant Pot%';