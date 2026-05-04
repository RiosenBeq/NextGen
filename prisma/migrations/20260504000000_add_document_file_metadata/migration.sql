-- Adds optional file metadata columns to Document.
-- Idempotent so repeat applies and concurrent rollouts are safe.
ALTER TABLE "Document"
  ADD COLUMN IF NOT EXISTS "fileSize" INTEGER,
  ADD COLUMN IF NOT EXISTS "mimeType" TEXT;
