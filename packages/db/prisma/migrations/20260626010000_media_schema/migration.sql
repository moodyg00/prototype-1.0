-- Incremental media schema for existing proto-2 databases.
-- Adds columns/tables required by prototype-1.0 uploads + attachments APIs.

ALTER TABLE "media_files" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE "media_files" ADD COLUMN IF NOT EXISTS "scan_status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "media_files" ADD COLUMN IF NOT EXISTS "storage_path" TEXT;
ALTER TABLE "media_files" ADD COLUMN IF NOT EXISTS "checksum_sha256" VARCHAR(64);
ALTER TABLE "media_files" ADD COLUMN IF NOT EXISTS "quarantined_at" TIMESTAMPTZ(6);
ALTER TABLE "media_files" ADD COLUMN IF NOT EXISTS "category_id" UUID;

CREATE INDEX IF NOT EXISTS "media_files_scan_status_idx" ON "media_files"("scan_status");
CREATE INDEX IF NOT EXISTS "media_files_source_idx" ON "media_files"("source");
CREATE INDEX IF NOT EXISTS "media_files_category_id_idx" ON "media_files"("category_id");

CREATE TABLE IF NOT EXISTS "media_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "media_categories_slug_key" ON "media_categories"("slug");
CREATE INDEX IF NOT EXISTS "media_categories_is_active_idx" ON "media_categories"("is_active");

CREATE TABLE IF NOT EXISTS "media_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "media_file_id" UUID NOT NULL,
    "owner_type" VARCHAR(80) NOT NULL,
    "owner_id" UUID NOT NULL,
    "role" VARCHAR(80),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "media_links_media_file_id_idx" ON "media_links"("media_file_id");
CREATE INDEX IF NOT EXISTS "media_links_owner_type_owner_id_idx" ON "media_links"("owner_type", "owner_id");
CREATE INDEX IF NOT EXISTS "media_links_role_idx" ON "media_links"("role");

CREATE TABLE IF NOT EXISTS "media_collections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_collections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "media_collections_slug_key" ON "media_collections"("slug");

CREATE TABLE IF NOT EXISTS "media_collection_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "collection_id" UUID NOT NULL,
    "media_file_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_collection_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "media_collection_items_collection_id_sort_order_idx" ON "media_collection_items"("collection_id", "sort_order");
CREATE INDEX IF NOT EXISTS "media_collection_items_media_file_id_idx" ON "media_collection_items"("media_file_id");
CREATE UNIQUE INDEX IF NOT EXISTS "media_collection_items_collection_id_media_file_id_key" ON "media_collection_items"("collection_id", "media_file_id");

DO $$ BEGIN
  ALTER TABLE "media_files" ADD CONSTRAINT "media_files_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "media_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "media_links" ADD CONSTRAINT "media_links_media_file_id_fkey" FOREIGN KEY ("media_file_id") REFERENCES "media_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "media_collection_items" ADD CONSTRAINT "media_collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "media_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "media_collection_items" ADD CONSTRAINT "media_collection_items_media_file_id_fkey" FOREIGN KEY ("media_file_id") REFERENCES "media_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
