/*
  # Sample Data for E-Commerce Store

  1. Sample Users
    - Create admin user and regular users
    
  2. Sample Products
    - Create 8 sample handmade craft products
    - Include realistic titles, descriptions, prices, and placeholder images
    
  3. Storage Setup
    - Instructions for setting up product-images bucket
*/

-- Insert sample products
INSERT INTO products (title, slug, description, price, stock, images, is_published) VALUES
(
  'Handwoven Ceramic Bowl Set',
  'handwoven-ceramic-bowl-set',
  'Beautiful set of 4 ceramic bowls, individually handcrafted by local artisans. Perfect for serving salads, soups, or as decorative pieces. Each bowl features unique glazing patterns that make every piece one-of-a-kind.',
  2499.00,
  15,
  '["https://images.pexels.com/photos/4226874/pexels-photo-4226874.jpeg"]'::jsonb,
  true
),
(
  'Macramé Wall Hanging - Bohemian Dream',
  'macrame-wall-hanging-bohemian-dream',
  'Elegant macramé wall hanging crafted from 100% cotton cord. This bohemian-inspired piece adds warmth and texture to any space. Features intricate knotwork and natural wooden accents.',
  1899.00,
  8,
  '["https://images.pexels.com/photos/6801647/pexels-photo-6801647.jpeg"]'::jsonb,
  true
),
(
  'Rustic Wooden Serving Tray',
  'rustic-wooden-serving-tray',
  'Handcrafted from reclaimed mango wood, this serving tray combines rustic charm with practical functionality. Perfect for serving breakfast in bed, entertaining guests, or as a decorative centerpiece.',
  1299.00,
  12,
  '["https://images.pexels.com/photos/4226881/pexels-photo-4226881.jpeg"]'::jsonb,
  true
),
(
  'Hand-knitted Alpaca Wool Scarf',
  'hand-knitted-alpaca-wool-scarf',
  'Luxuriously soft scarf knitted from 100% baby alpaca wool. Available in natural earth tones, this scarf provides exceptional warmth while remaining incredibly lightweight and breathable.',
  3299.00,
  6,
  '["https://images.pexels.com/photos/7148621/pexels-photo-7148621.jpeg"]'::jsonb,
  true
),
(
  'Artisan Copper Water Bottle',
  'artisan-copper-water-bottle',
  'Traditional hammered copper water bottle crafted using ancient techniques. Known for its health benefits and stunning appearance, this bottle develops a beautiful patina over time.',
  1599.00,
  20,
  '["https://images.pexels.com/photos/4226865/pexels-photo-4226865.jpeg"]'::jsonb,
  true
),
(
  'Embroidered Cushion Cover Set',
  'embroidered-cushion-cover-set',
  'Set of 2 cushion covers featuring intricate hand embroidery in traditional patterns. Made from premium cotton fabric with hidden zippers. Adds a touch of elegance to any living space.',
  1799.00,
  25,
  '["https://images.pexels.com/photos/6969826/pexels-photo-6969826.jpeg"]'::jsonb,
  true
),
(
  'Clay Pottery Vase - Minimal Design',
  'clay-pottery-vase-minimal-design',
  'Minimalist pottery vase thrown on the wheel and glazed in soft, neutral tones. Perfect for fresh flowers or as a standalone decorative piece. Each vase is unique with subtle variations.',
  999.00,
  18,
  '["https://images.pexels.com/photos/4226860/pexels-photo-4226860.jpeg"]'::jsonb,
  true
),
(
  'Handmade Beeswax Candles Set',
  'handmade-beeswax-candles-set',
  'Set of 3 pure beeswax candles with cotton wicks. Burns clean and long with a subtle honey fragrance. Comes in various natural shapes and sizes, each hand-dipped for unique character.',
  799.00,
  30,
  '["https://images.pexels.com/photos/6985001/pexels-photo-6985001.jpeg"]'::jsonb,
  true
);

-- Note: To add real product images:
-- 1. Create a 'product-images' storage bucket in Supabase
-- 2. Enable public access to the bucket
-- 3. Upload product images and update the URLs in the products table
-- 4. The placeholder Pexels URLs above can be replaced with your Supabase storage URLs