-- NEXUS ULTRA free D1 image storage
-- admin_sessions already uses user_id in migration 0002.

CREATE TABLE IF NOT EXISTS media_objects (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL
    CHECK(content_type IN ('image/jpeg','image/png','image/webp')),
  data_base64 TEXT NOT NULL,
  byte_size INTEGER NOT NULL
    CHECK(byte_size > 0 AND byte_size <= 262144),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_objects_created
ON media_objects(created_at);
