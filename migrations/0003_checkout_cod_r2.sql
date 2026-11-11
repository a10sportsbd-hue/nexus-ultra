
-- NEXUS ULTRA checkout, COD and R2 media support
ALTER TABLE products ADD COLUMN image_url TEXT;

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);

CREATE TRIGGER IF NOT EXISTS order_items_stock_guard
BEFORE INSERT ON order_items
BEGIN
  SELECT CASE
    WHEN (SELECT status FROM products WHERE id = NEW.product_id) IS NULL
      THEN RAISE(ABORT, 'PRODUCT_NOT_FOUND')
    WHEN (SELECT status FROM products WHERE id = NEW.product_id) != 'active'
      THEN RAISE(ABORT, 'PRODUCT_NOT_AVAILABLE')
    WHEN (SELECT stock_quantity FROM products WHERE id = NEW.product_id) < NEW.quantity
      THEN RAISE(ABORT, 'INSUFFICIENT_STOCK')
  END;
END;

CREATE TRIGGER IF NOT EXISTS order_items_stock_decrement
AFTER INSERT ON order_items
BEGIN
  UPDATE products SET stock_quantity = stock_quantity - NEW.quantity,
    updated_at = CURRENT_TIMESTAMP WHERE id = NEW.product_id;
END;

INSERT OR IGNORE INTO settings(key,value) VALUES
('delivery_fee','80'),
('free_delivery_threshold','3000'),
('cod_enabled','1'),
('store_phone','');
