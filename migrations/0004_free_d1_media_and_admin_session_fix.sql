-- NEXUS ULTRA: migrate admin session owner column and add free D1 image storage.
-- Run once after migrations 0002 and 0003.
ALTER TABLE admin_sessions RENAME COLUMN admin_id TO user_id;

CREATE TABLE IF NOT EXISTS media_objects (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL CHECK(content_type IN ('image/jpeg','image/png','image/webp')),
  data_base64 TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK(byte_size > 0 AND byte_size <= 262144),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_objects_created
ON media_objects(created_at);
