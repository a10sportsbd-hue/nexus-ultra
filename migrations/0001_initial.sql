PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','admin')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sku TEXT NOT NULL UNIQUE,
  price INTEGER NOT NULL CHECK(price >= 0),
  sale_price INTEGER CHECK(sale_price IS NULL OR sale_price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK(stock_quantity >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line TEXT NOT NULL,
  district TEXT NOT NULL,
  area TEXT,
  postal_code TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  subtotal INTEGER NOT NULL CHECK(subtotal >= 0),
  delivery_fee INTEGER NOT NULL DEFAULT 0 CHECK(delivery_fee >= 0),
  discount INTEGER NOT NULL DEFAULT 0 CHECK(discount >= 0),
  total INTEGER NOT NULL CHECK(total >= 0),
  payment_method TEXT NOT NULL DEFAULT 'cod',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  order_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  unit_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  line_total INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);

INSERT OR IGNORE INTO categories(id,name,slug,sort_order) VALUES
('cat-tech','Tech & Gadgets','tech',1),
('cat-style','Style & Lifestyle','style',2),
('cat-home','Home Essentials','home',3);

INSERT OR IGNORE INTO products(id,category_id,name,slug,description,sku,price,sale_price,stock_quantity,status) VALUES
('p1','cat-tech','Nova Wireless Headphones','nova-wireless-headphones','Premium wireless audio experience.','NU-AUD-001',3490,NULL,25,'active'),
('p2','cat-tech','Pulse Smart Watch X','pulse-smart-watch-x','Smart wearable for everyday life.','NU-WAT-002',4890,NULL,18,'active'),
('p3','cat-style','Urban Carry Backpack','urban-carry-backpack','Minimal everyday carry backpack.','NU-BAG-003',2250,NULL,32,'active'),
('p4','cat-home','Halo Ambient Desk Lamp','halo-ambient-desk-lamp','Ambient lighting for your workspace.','NU-HOM-004',1890,NULL,14,'active');

INSERT OR IGNORE INTO settings(key,value) VALUES
('store_name','NEXUS ULTRA'),
('currency','BDT'),
('currency_symbol','৳'),
('default_language','bn'),
('supported_languages','bn,en'),
('theme_modes','dark,light'),
('timezone','Asia/Dhaka');
