-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "JournalEntryStatus" AS ENUM ('Draft', 'Posted', 'Reversed');

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(80) NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255),
    "username" VARCHAR(100),
    "full_name" VARCHAR(255) NOT NULL,
    "avatar_url" TEXT,
    "password_hash" TEXT,
    "api_key" VARCHAR(255),
    "user_type" TEXT NOT NULL DEFAULT 'human',
    "role_id" UUID,
    "ai_model" VARCHAR(120),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(512),

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "table_name" VARCHAR(120) NOT NULL,
    "record_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" UUID,
    "changes" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "change_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "module" VARCHAR(80) NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "is_sensitive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "legal_name" VARCHAR(255),
    "ein" VARCHAR(40),
    "email" VARCHAR(255),
    "phone" VARCHAR(40),
    "website" VARCHAR(255),
    "address_line1" VARCHAR(255),
    "address_line2" VARCHAR(255),
    "city" VARCHAR(120),
    "state" VARCHAR(80),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(80) DEFAULT 'US',
    "logo_path" VARCHAR(500),
    "primary_color" VARCHAR(20),
    "accent_color" VARCHAR(20),
    "default_payment_terms" TEXT,
    "default_discount_type" TEXT,
    "document_intro_text" TEXT,
    "document_footer_text" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "relationship_type" TEXT NOT NULL DEFAULT 'other',
    "organization_type" TEXT NOT NULL DEFAULT 'company',
    "industry" VARCHAR(120),
    "phone" VARCHAR(40),
    "website" TEXT,
    "address" JSONB,
    "tax_id" TEXT,
    "is_1099_vendor" BOOLEAN NOT NULL DEFAULT false,
    "source" VARCHAR(120),
    "last_contacted_at" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" JSONB,
    "tags" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID,
    "title" VARCHAR(120),
    "type" TEXT NOT NULL DEFAULT 'other',
    "name" VARCHAR(255),
    "phone" VARCHAR(40),
    "email" VARCHAR(255),
    "address" JSONB,
    "source" VARCHAR(120),
    "last_contacted_at" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" JSONB,
    "tags" JSONB,
    "stripe_customer_id" VARCHAR(64),
    "stripe_default_payment_method_id" VARCHAR(128),
    "stripe_payment_method_brand" VARCHAR(40),
    "stripe_payment_method_last4" VARCHAR(8),
    "stripe_payment_method_exp_month" SMALLINT,
    "stripe_payment_method_exp_year" SMALLINT,
    "stripe_metadata" JSONB,
    "stripe_synced_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contact_id" UUID,
    "organization_id" UUID,
    "title" VARCHAR(120),
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(40),
    "email" VARCHAR(255),
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "assigned_to" UUID,
    "next_follow_up" TIMESTAMPTZ(6),
    "last_contacted_at" TIMESTAMPTZ(6),
    "notes" JSONB,
    "expected_value" DECIMAL(12,2),
    "closed_at" TIMESTAMPTZ(6),
    "lost_reason" TEXT,
    "converted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "contact_id" UUID,
    "contact_name" VARCHAR(255),
    "organization_id" UUID,
    "organization_name" VARCHAR(255),
    "capital_requirement" DECIMAL(12,2),
    "risk_score" SMALLINT,
    "method" VARCHAR(120),
    "execution_plan" JSONB,
    "budget" JSONB,
    "issues" JSONB,
    "alerts" JSONB,
    "resource_links" JSONB,
    "document_library_ref" VARCHAR(255),
    "image_library_ref" VARCHAR(255),
    "objectives" JSONB,
    "milestones" JSONB,
    "risks" JSONB,
    "business_plan" JSONB,
    "meta" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "business_plan_status" TEXT NOT NULL DEFAULT 'draft',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "target_date" DATE,
    "assigned_to" UUID,
    "notes" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "intro_text" TEXT,
    "footer_text" TEXT,
    "payment_terms" TEXT,
    "accent_color" VARCHAR(20) NOT NULL DEFAULT 'sky',
    "line_items" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "estimate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "estimate_number" VARCHAR(40) NOT NULL,
    "version_number" INTEGER NOT NULL DEFAULT 1,
    "parent_estimate_id" UUID,
    "lead_id" UUID,
    "contact_id" UUID,
    "contact_name" VARCHAR(255),
    "organization_id" UUID,
    "organization_name" VARCHAR(255),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "estimate_template_id" UUID,
    "line_items" JSONB,
    "subtotal" DECIMAL(12,2),
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_type" TEXT,
    "tax_amount" DECIMAL(12,2),
    "total_amount" DECIMAL(12,2) NOT NULL,
    "payment_terms" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "valid_until" TIMESTAMPTZ(6),
    "notes" JSONB,
    "metadata" JSONB,
    "sent_at" TIMESTAMPTZ(6),
    "accepted_at" TIMESTAMPTZ(6),
    "converted_at" TIMESTAMPTZ(6),
    "converted_work_order_id" UUID,
    "converted_invoice_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "quote_prompt" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "estimated_duration_minutes" INTEGER,
    "suggested_price" DECIMAL(12,2),
    "web_page_url" TEXT,
    "web_content_summary" TEXT,
    "best_headline" VARCHAR(255),
    "best_hook" VARCHAR(255),
    "best_cta" VARCHAR(255),
    "q_and_a" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'other',
    "unit_price" DECIMAL(12,2),
    "unit_of_measure" VARCHAR(40),
    "is_for_sale" BOOLEAN NOT NULL DEFAULT false,
    "is_internal_use" BOOLEAN NOT NULL DEFAULT true,
    "sku" VARCHAR(80),
    "purchase_url" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR(255),
    "quantity_on_hand" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "quantity_reserved" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "reorder_level" DECIMAL(12,2),
    "reorder_quantity" DECIMAL(12,2),
    "location" VARCHAR(120),
    "last_purchased_at" TIMESTAMPTZ(6),
    "last_used_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "work_order_number" VARCHAR(40) NOT NULL,
    "invoice_id" UUID,
    "invoice_number" VARCHAR(40),
    "estimate_id" UUID,
    "contact_id" UUID NOT NULL,
    "customer_name" VARCHAR(255),
    "service_id" UUID,
    "service_name" VARCHAR(255),
    "assigned_contractor_id" UUID,
    "assigned_contractor" VARCHAR(255),
    "contractor_status" TEXT NOT NULL DEFAULT 'pending',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "scheduled_date" DATE,
    "booking_date" DATE,
    "booking_time" TIME(6),
    "address" JSONB,
    "special_instructions" TEXT,
    "notes" JSONB,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "work_order_id" UUID,
    "contact_id" UUID,
    "service_id" UUID,
    "booking_link_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "source" TEXT NOT NULL DEFAULT 'admin',
    "booking_date" DATE NOT NULL,
    "start_time" TIME(6),
    "end_time" TIME(6),
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "address" JSONB,
    "duration_minutes" INTEGER,
    "collected_data" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_materials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "work_order_id" UUID NOT NULL,
    "product_id" UUID,
    "estimate_item_id" UUID,
    "product_name" VARCHAR(255),
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit_cost" DECIMAL(12,2),
    "total_cost" DECIMAL(12,2),
    "source" TEXT NOT NULL DEFAULT 'inventory',
    "is_billable" BOOLEAN NOT NULL DEFAULT true,
    "invoice_item_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "work_order_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "work_order_id" UUID NOT NULL,
    "old_status" VARCHAR(60),
    "new_status" VARCHAR(60) NOT NULL,
    "changed_by" UUID,
    "notes" TEXT,
    "changed_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "work_order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_time_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "work_order_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "ended_at" TIMESTAMPTZ(6),
    "duration_minutes" INTEGER,
    "activity_type" VARCHAR(60),
    "notes" TEXT,
    "logged_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "work_order_time_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contractor_performance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "work_order_id" UUID NOT NULL,
    "contractor_id" UUID NOT NULL,
    "rating" INTEGER,
    "quality" INTEGER,
    "timeliness" INTEGER,
    "communication" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "contractor_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_incidents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "work_order_id" UUID NOT NULL,
    "incident_date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "reported_by" UUID,
    "actions_taken" TEXT,
    "follow_up_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "safety_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "work_order_id" UUID NOT NULL,
    "contact_id" UUID,
    "platform" VARCHAR(80),
    "review_text" TEXT,
    "sentiment_score" DECIMAL(5,2),
    "responded_to" BOOLEAN NOT NULL DEFAULT false,
    "review_date" DATE,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "work_order_id" UUID NOT NULL,
    "before_photos" JSONB,
    "after_photos" JSONB,
    "issues_encountered" TEXT,
    "safety_issues" TEXT,
    "customer_signoff_notes" TEXT,
    "work_order_quality_score" INTEGER,
    "review_id" UUID,
    "approval_status" TEXT NOT NULL DEFAULT 'approved',
    "performance_id" UUID,
    "safety_incident_id" UUID,
    "submitted_by" UUID,
    "submitted_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "quality_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_returns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "work_order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "return_date" DATE NOT NULL,
    "returned_by" UUID,
    "reason" VARCHAR(255),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "material_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_purchases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "work_order_id" UUID,
    "product_id" UUID NOT NULL,
    "vendor_id" UUID,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit_cost" DECIMAL(12,2) NOT NULL,
    "total_cost" DECIMAL(12,2) NOT NULL,
    "purchase_date" DATE NOT NULL,
    "receipt_url" TEXT,
    "journal_entry_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "material_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "public_token" VARCHAR(64) NOT NULL,
    "link_kind" TEXT NOT NULL DEFAULT 'standard',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "service_id" UUID,
    "contact_id" UUID,
    "work_order_id" UUID,
    "duration_minutes" INTEGER,
    "channel" VARCHAR(80),
    "known_data" JSONB,
    "fields_to_collect" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "proposed_slots" JSONB,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "booking_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subject_kind" TEXT NOT NULL,
    "user_id" UUID,
    "service_id" UUID,
    "business_id" UUID,
    "pattern_weeks" INTEGER NOT NULL DEFAULT 1,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE NOT NULL,
    "slot_duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "slot_gap_minutes" INTEGER NOT NULL DEFAULT 15,
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'America/Chicago',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "availability_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_pattern_days" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schedule_id" UUID NOT NULL,
    "week_index" INTEGER NOT NULL DEFAULT 0,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,

    CONSTRAINT "availability_pattern_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_exceptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schedule_id" UUID NOT NULL,
    "exception_type" TEXT NOT NULL,
    "specific_date" DATE NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,

    CONSTRAINT "availability_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sops" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "document_url" TEXT,
    "version" VARCHAR(20) NOT NULL DEFAULT '1.0',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "sops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_sops" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_id" UUID NOT NULL,
    "sop_id" UUID NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "service_sops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "work_order_id" UUID NOT NULL,
    "contractor_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "work_order_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_signoffs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "work_order_id" UUID NOT NULL,
    "signed_by_name" VARCHAR(255) NOT NULL,
    "signed_by_title" VARCHAR(120),
    "signature_url" TEXT,
    "signoff_date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "customer_signoffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chart_of_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" TEXT NOT NULL,
    "sub_type" TEXT,
    "description" TEXT,
    "parent_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entry_number" VARCHAR(40) NOT NULL,
    "description" TEXT,
    "reference" VARCHAR(120),
    "entry_date" DATE NOT NULL,
    "status" "JournalEntryStatus" NOT NULL DEFAULT 'Draft',
    "total_debits" DECIMAL(12,2) DEFAULT 0,
    "total_credits" DECIMAL(12,2) DEFAULT 0,
    "source_module" VARCHAR(60),
    "posted_at" TIMESTAMPTZ(6),
    "posted_by" UUID,
    "reverses_entry_id" UUID,
    "reversed_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entry_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "journal_entry_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "debit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoice_number" VARCHAR(40) NOT NULL,
    "journal_entry_id" UUID,
    "work_order_id" UUID,
    "estimate_id" UUID,
    "contact_id" UUID,
    "contact_name" VARCHAR(255),
    "organization_id" UUID,
    "organization_name" VARCHAR(255),
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_type" TEXT,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "amount_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amount_due" DECIMAL(12,2),
    "payment_terms" TEXT,
    "notes" TEXT,
    "sent_at" TIMESTAMPTZ(6),
    "paid_at" TIMESTAMPTZ(6),
    "public_token" VARCHAR(64),
    "public_token_generated_at" TIMESTAMPTZ(6),
    "last_reminder_sent_at" TIMESTAMPTZ(6),
    "stripe_customer_id" VARCHAR(64),
    "stripe_checkout_session_id" VARCHAR(128),
    "stripe_payment_intent_id" VARCHAR(128),
    "stripe_payment_link_id" VARCHAR(128),
    "stripe_payment_status" VARCHAR(40),
    "stripe_hosted_url" TEXT,
    "stripe_currency" VARCHAR(8),
    "stripe_metadata" JSONB,
    "payment_link_sent_at" TIMESTAMPTZ(6),
    "stripe_synced_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoice_id" UUID NOT NULL,
    "service_id" UUID,
    "product_id" UUID,
    "description" TEXT,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "is_billable" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "contact_id" UUID,
    "contact_name" VARCHAR(255),
    "organization_id" UUID,
    "organization_name" VARCHAR(255),
    "frequency" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "next_invoice_date" DATE,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_generated_invoice_id" UUID,
    "stripe_customer_id" VARCHAR(64),
    "stripe_subscription_id" VARCHAR(128),
    "stripe_price_id" VARCHAR(128),
    "stripe_product_id" VARCHAR(128),
    "stripe_status" VARCHAR(40),
    "stripe_current_period_end" TIMESTAMPTZ(6),
    "stripe_metadata" JSONB,
    "stripe_synced_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "recurring_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bill_number" VARCHAR(40) NOT NULL,
    "vendor_id" UUID NOT NULL,
    "vendor_name" VARCHAR(255),
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "amount_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "journal_entry_id" UUID,
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payment_number" VARCHAR(40) NOT NULL,
    "journal_entry_id" UUID,
    "invoice_id" UUID,
    "bill_id" UUID,
    "contact_id" UUID,
    "organization_id" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_date" DATE NOT NULL,
    "method" TEXT NOT NULL,
    "reference" VARCHAR(120),
    "payment_direction" TEXT NOT NULL DEFAULT 'incoming',
    "reconciliation_status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "stripe_payment_intent_id" VARCHAR(128),
    "stripe_charge_id" VARCHAR(128),
    "stripe_checkout_session_id" VARCHAR(128),
    "stripe_payment_method_id" VARCHAR(128),
    "stripe_payment_method_type" VARCHAR(40),
    "stripe_payment_method_brand" VARCHAR(40),
    "stripe_payment_method_last4" VARCHAR(8),
    "stripe_status" VARCHAR(40),
    "stripe_currency" VARCHAR(8),
    "stripe_raw_payload" JSONB,
    "paid_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "failure_message" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "expense_number" VARCHAR(40) NOT NULL,
    "vendor_id" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "expense_date" DATE NOT NULL,
    "category" VARCHAR(120),
    "description" TEXT,
    "receipt_url" TEXT,
    "journal_entry_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payroll_number" VARCHAR(40) NOT NULL,
    "employee_id" UUID NOT NULL,
    "pay_period_start" DATE NOT NULL,
    "pay_period_end" DATE NOT NULL,
    "pay_date" DATE NOT NULL,
    "gross_pay" DECIMAL(12,2) NOT NULL,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_pay" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "journal_entry_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_forms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendor_organization_id" UUID,
    "vendor_contact_id" UUID,
    "tax_year" INTEGER NOT NULL,
    "form_type" TEXT NOT NULL DEFAULT '1099-NEC',
    "total_paid" DECIMAL(12,2) NOT NULL,
    "tax_id" TEXT,
    "address" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "filed_date" DATE,
    "sent_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "tax_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_name" VARCHAR(255) NOT NULL,
    "tax_id" TEXT NOT NULL,
    "address" JSONB,
    "contact_name" VARCHAR(255),
    "contact_phone" VARCHAR(40),
    "contact_email" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "tax_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_filings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tax_year" INTEGER NOT NULL,
    "form_type" VARCHAR(80) NOT NULL,
    "filing_date" DATE,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount_due" DECIMAL(12,2),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "tax_filings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tax_filing_id" UUID,
    "payment_date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" VARCHAR(80),
    "reference" VARCHAR(120),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "tax_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "credit_number" VARCHAR(40) NOT NULL,
    "credit_source" TEXT NOT NULL DEFAULT 'customer',
    "invoice_id" UUID,
    "work_order_id" UUID,
    "product_id" UUID,
    "payment_id" UUID,
    "contact_id" UUID,
    "vendor_id" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "quantity_returned" DECIMAL(12,2),
    "credit_date" DATE NOT NULL,
    "credit_type" TEXT NOT NULL DEFAULT 'refund',
    "reason" VARCHAR(255),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "journal_entry_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "account_type" TEXT NOT NULL,
    "chart_of_account_id" UUID,
    "bank_name" VARCHAR(120),
    "provider" VARCHAR(40),
    "provider_account_id" VARCHAR(120),
    "last_synced_at" TIMESTAMPTZ(6),
    "account_number_encrypted" TEXT,
    "routing_number_encrypted" TEXT,
    "swift_code_encrypted" TEXT,
    "account_number" VARCHAR(120),
    "account_number_last4" VARCHAR(4),
    "routing_number_last4" VARCHAR(4),
    "available_balance_cents" BIGINT,
    "current_balance_cents" BIGINT,
    "status" VARCHAR(40),
    "dashboard_link" TEXT,
    "provider_raw_payload" JSONB,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "current_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_reconciled_date" DATE,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_cards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "card_name" VARCHAR(255) NOT NULL,
    "last4" VARCHAR(4),
    "provider" VARCHAR(40),
    "provider_card_id" VARCHAR(120),
    "last_synced_at" TIMESTAMPTZ(6),
    "card_number_encrypted" TEXT,
    "cvc_encrypted" TEXT,
    "expiry_encrypted" TEXT,
    "billing_address_encrypted" TEXT,
    "expiry_month_masked" VARCHAR(4),
    "network" VARCHAR(20),
    "card_type" VARCHAR(20),
    "spend_limit_amount_cents" BIGINT,
    "spend_limit_interval" VARCHAR(20),
    "provider_raw_payload" JSONB,
    "vendor_id" UUID,
    "bank_account_id" UUID,
    "daily_limit" DECIMAL(12,2),
    "per_transaction_limit" DECIMAL(12,2),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "bank_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_merchants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "display_name" VARCHAR(255) NOT NULL,
    "normalized_name" VARCHAR(255) NOT NULL,
    "domain" VARCHAR(255),
    "logo_url" TEXT,
    "logo_source" VARCHAR(40),
    "avatar_initials" VARCHAR(6) NOT NULL,
    "avatar_color" VARCHAR(20) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bank_account_id" UUID NOT NULL,
    "card_id" UUID,
    "merchant_id" UUID,
    "provider" VARCHAR(40),
    "provider_transaction_id" VARCHAR(120),
    "last_synced_at" TIMESTAMPTZ(6),
    "provider_status" VARCHAR(40),
    "provider_kind" VARCHAR(40),
    "counterparty_name" VARCHAR(255),
    "posted_at" TIMESTAMPTZ(6),
    "mercury_request_id" VARCHAR(120),
    "dashboard_link" TEXT,
    "provider_raw_payload" JSONB,
    "transaction_date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "description" TEXT,
    "reference" VARCHAR(120),
    "external_category" VARCHAR(120),
    "internal_category" VARCHAR(120),
    "category_source" TEXT NOT NULL DEFAULT 'mercury',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rule_resolution_status" VARCHAR(40) NOT NULL DEFAULT 'unprocessed',
    "rule_confidence" SMALLINT,
    "rule_reason" TEXT,
    "llm_review_status" VARCHAR(40) NOT NULL DEFAULT 'not_requested',
    "journal_entry_id" UUID,
    "ignored_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_sync_audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" VARCHAR(40) NOT NULL,
    "operation" VARCHAR(60) NOT NULL,
    "target_resource_id" VARCHAR(120),
    "actor_user_id" UUID,
    "response_status" INTEGER,
    "request_id" VARCHAR(120),
    "duration_ms" INTEGER,
    "succeeded" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_sync_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_reconciliations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bank_account_id" UUID NOT NULL,
    "statement_date" DATE NOT NULL,
    "statement_balance" DECIMAL(14,2) NOT NULL,
    "book_balance" DECIMAL(14,2) NOT NULL,
    "difference" DECIMAL(14,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "bank_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transfers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transfer_number" VARCHAR(40) NOT NULL,
    "from_account_id" UUID NOT NULL,
    "to_account_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "transfer_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "journal_entry_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "bank_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_imports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bank_account_id" UUID NOT NULL,
    "import_date" DATE NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "total_transactions" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "bank_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rule_name" VARCHAR(255) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "conditions" JSONB NOT NULL,
    "action" JSONB NOT NULL,
    "actions" JSONB,
    "stop_processing" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "applies_to_provider" VARCHAR(40),
    "applies_to_account_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "bank_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transaction_rule_matches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bank_transaction_id" UUID NOT NULL,
    "bank_rule_id" UUID,
    "matched" BOOLEAN NOT NULL DEFAULT false,
    "confidence" SMALLINT,
    "reason" TEXT,
    "conditions_snapshot" JSONB,
    "actions_snapshot" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transaction_rule_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transaction_review_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bank_transaction_id" UUID NOT NULL,
    "task_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "assigned_role" VARCHAR(80) NOT NULL DEFAULT 'super-user',
    "reason" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transaction_review_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "blog_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "featured_image_url" TEXT,
    "author_id" UUID NOT NULL,
    "category_id" UUID,
    "category" VARCHAR(120),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMPTZ(6),
    "seo_title" VARCHAR(255),
    "seo_description" TEXT,
    "seo_keywords" JSONB,
    "reading_time_minutes" INTEGER,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_post_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "blog_post_id" UUID NOT NULL,
    "blog_tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "blog_post_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "page_slug" VARCHAR(180) NOT NULL,
    "page_title" VARCHAR(255) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "meta_title" VARCHAR(255),
    "meta_description" TEXT,
    "sections" JSONB NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_section_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "fields" JSONB NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "page_section_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "filename" VARCHAR(255) NOT NULL,
    "original_filename" VARCHAR(255),
    "file_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "medium_url" TEXT,
    "poster_url" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "duration_seconds" DECIMAL(10,3),
    "mime_type" VARCHAR(100) NOT NULL,
    "media_kind" TEXT NOT NULL DEFAULT 'image',
    "size_bytes" INTEGER,
    "tags" JSONB,
    "source" TEXT NOT NULL DEFAULT 'admin',
    "scan_status" TEXT NOT NULL DEFAULT 'pending',
    "library_type" TEXT NOT NULL,
    "storage_path" TEXT,
    "checksum_sha256" VARCHAR(64),
    "quarantined_at" TIMESTAMPTZ(6),
    "category_id" UUID,
    "parent_media_id" UUID,
    "work_order_id" UUID,
    "uploaded_by" UUID,
    "alt_text" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_media_content" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "primary_creative_asset_id" UUID,
    "platform" VARCHAR(80) NOT NULL,
    "caption" TEXT,
    "hashtags" JSONB,
    "scheduled_at" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "social_media_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_blanks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "category" VARCHAR(40) NOT NULL DEFAULT 'apparel',
    "product_type" VARCHAR(40) NOT NULL DEFAULT 'apparel',
    "fulfillment_provider" VARCHAR(60),
    "provider_product_id" VARCHAR(120),
    "base_unit_price" DECIMAL(12,2),
    "sku_prefix" VARCHAR(80),
    "print_areas" JSONB,
    "available_sizes" JSONB,
    "available_colors" JSONB,
    "available_techniques" JSONB,
    "placement_capabilities" JSONB,
    "specs" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "product_blanks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_blank_id" UUID NOT NULL,
    "color_key" VARCHAR(40) NOT NULL,
    "color_hex" VARCHAR(9),
    "front_image_url" VARCHAR(500),
    "back_image_url" VARCHAR(500),
    "thumbnail_url" VARCHAR(500),
    "print_area_overlays" JSONB,
    "view_images" JSONB,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "product_blank_id" UUID,
    "default_color_key" VARCHAR(40),
    "canvas_json" JSONB,
    "canvas_svg" TEXT,
    "thumbnail_url" VARCHAR(500),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "designs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_mockups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "design_id" UUID NOT NULL,
    "product_template_id" UUID NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "kind" VARCHAR(20) NOT NULL DEFAULT 'front',
    "print_file_url" VARCHAR(500),
    "generated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "design_mockups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fulfillment_provider" VARCHAR(60),
    "external_order_id" VARCHAR(120),
    "status" VARCHAR(40) NOT NULL DEFAULT 'draft',
    "recipient" JSONB,
    "subtotal" DECIMAL(12,2),
    "shipping" DECIMAL(12,2),
    "tax" DECIMAL(12,2),
    "total" DECIMAL(12,2),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "print_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "print_order_id" UUID NOT NULL,
    "design_id" UUID,
    "product_template_id" UUID,
    "size_code" VARCHAR(20),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2),
    "external_variant_id" VARCHAR(120),
    "print_files" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "print_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "platform" VARCHAR(80),
    "status" TEXT NOT NULL DEFAULT 'active',
    "total_budget" DECIMAL(12,2),
    "amount_spent" DECIMAL(12,2) DEFAULT 0,
    "roas" DECIMAL(8,2),
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "ad_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_budgets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "total_budget" DECIMAL(12,2) NOT NULL,
    "daily_budget" DECIMAL(12,2),
    "amount_spent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "remaining_budget" DECIMAL(12,2),
    "budget_status" TEXT NOT NULL DEFAULT 'on_track',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "campaign_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_pages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "meta_description" TEXT,
    "content" JSONB NOT NULL,
    "ad_id" UUID,
    "ad_count" INTEGER DEFAULT 0,
    "conversion_rate" DECIMAL(8,2),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "landing_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "platform" VARCHAR(80) NOT NULL,
    "campaign_id" UUID,
    "headline" VARCHAR(255),
    "hook" VARCHAR(255),
    "description" TEXT,
    "primary_creative_asset_id" UUID,
    "cta_text" VARCHAR(120),
    "cta_url" TEXT,
    "landing_page_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "budget" DECIMAL(12,2),
    "performance_score" DECIMAL(8,2),
    "roas" DECIMAL(8,2),
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_variants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ad_id" UUID NOT NULL,
    "variant_name" VARCHAR(20) NOT NULL,
    "headline" VARCHAR(255),
    "hook" VARCHAR(255),
    "media_id" UUID,
    "cta_text" VARCHAR(120),
    "performance_score" DECIMAL(8,2),
    "is_winner" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "ad_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_performance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ctr" DECIMAL(8,4),
    "cpc" DECIMAL(12,4),
    "roas" DECIMAL(8,2),
    "metrics" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "campaign_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "creatable_type" VARCHAR(255) NOT NULL,
    "creatable_id" UUID NOT NULL,
    "media_id" UUID,
    "asset_type" TEXT NOT NULL DEFAULT 'image',
    "creative_url" TEXT,
    "name" VARCHAR(255),
    "headline" VARCHAR(255),
    "description" TEXT,
    "cta_text" VARCHAR(120),
    "crop_settings" JSONB,
    "metadata" JSONB,
    "width" INTEGER,
    "height" INTEGER,
    "size_bytes" INTEGER,
    "mime_type" VARCHAR(120),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "performance_score" DECIMAL(8,2),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "creative_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_audiences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "platform" VARCHAR(80) NOT NULL,
    "audience_type" TEXT NOT NULL,
    "description" TEXT,
    "size_estimate" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "ad_audiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_placements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ad_id" UUID NOT NULL,
    "platform" VARCHAR(80) NOT NULL,
    "placement" VARCHAR(120) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "ad_placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_attribution" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contact_id" UUID,
    "ad_id" UUID,
    "campaign_id" UUID,
    "touchpoint" VARCHAR(120) NOT NULL,
    "touchpoint_date" TIMESTAMPTZ(6) NOT NULL,
    "conversion_value" DECIMAL(12,2),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "marketing_attribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "provider" VARCHAR(80),
    "environment" TEXT DEFAULT 'production',
    "base_url" TEXT,
    "auth_type" VARCHAR(40),
    "api_key" TEXT,
    "api_secret" TEXT,
    "webhook_secret" TEXT,
    "public_key" TEXT,
    "external_account_id" VARCHAR(255),
    "docs_url" TEXT,
    "last_connected_at" TIMESTAMPTZ(6),
    "configuration" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credentials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "site_url" TEXT,
    "username" VARCHAR(255) NOT NULL,
    "password" TEXT NOT NULL,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "integration_id" UUID NOT NULL,
    "log_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "endpoint" TEXT,
    "request_payload" JSONB,
    "response_payload" JSONB,
    "error_message" TEXT,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'operations',
    "type" TEXT NOT NULL DEFAULT 'generic_chat',
    "assigned_to" UUID NOT NULL,
    "assigned_to_name" VARCHAR(255),
    "owner_user_id" UUID,
    "originator_user_id" UUID,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "due_date" TIMESTAMPTZ(6),
    "opportunity_id" UUID,
    "meta" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "content" JSONB NOT NULL DEFAULT '{"blocks":[]}'::jsonb,
    "loop" JSONB NOT NULL DEFAULT '{"messages":[]}'::jsonb,
    "requires" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(80) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "activity_date" TIMESTAMPTZ(6),
    "due_at" TIMESTAMPTZ(6),
    "assigned_to" UUID,
    "lead_id" UUID,
    "contact_id" UUID,
    "organization_id" UUID,
    "related_type" VARCHAR(120),
    "related_id" UUID,
    "notes" JSONB,
    "metadata" JSONB,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agent_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "prompt_template" TEXT,
    "allowed_modules" JSONB,
    "max_concurrency" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_active_at" TIMESTAMPTZ(6),
    "tasks_completed_today" INTEGER NOT NULL DEFAULT 0,
    "avg_task_duration_seconds" INTEGER,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "ai_agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_task_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" UUID NOT NULL,
    "agent_user_id" UUID,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "duration_seconds" INTEGER,
    "execution_log" JSONB,
    "error_message" TEXT,
    "output_summary" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "ai_task_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" UUID,
    "agent_user_id" UUID,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "message" TEXT NOT NULL,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "ai_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "low_stock_alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventory_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR(255),
    "quantity_on_hand" DECIMAL(12,2) NOT NULL,
    "reorder_level" DECIMAL(12,2),
    "status" TEXT NOT NULL DEFAULT 'open',
    "related_task_id" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "low_stock_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "preheader" VARCHAR(255),
    "body_html" TEXT,
    "body_text" TEXT,
    "footer_text" TEXT,
    "category" TEXT NOT NULL DEFAULT 'promotional',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "accent_color" VARCHAR(20) NOT NULL DEFAULT 'sky',
    "design_settings" JSONB,
    "review_notes" TEXT,
    "submitted_for_review_at" TIMESTAMPTZ(6),
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewed_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "approved_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_audiences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "filter_rules" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "estimated_recipient_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "email_audiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "email_template_id" UUID NOT NULL,
    "email_audience_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduled_at" TIMESTAMPTZ(6),
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'America/Chicago',
    "send_immediately" BOOLEAN NOT NULL DEFAULT false,
    "from_name" VARCHAR(120),
    "from_email" VARCHAR(255),
    "reply_to_email" VARCHAR(255),
    "track_opens" BOOLEAN NOT NULL DEFAULT true,
    "track_clicks" BOOLEAN NOT NULL DEFAULT true,
    "utm_source" VARCHAR(120),
    "utm_medium" VARCHAR(120) DEFAULT 'email',
    "utm_campaign" VARCHAR(120),
    "utm_content" VARCHAR(120),
    "batch_size" INTEGER,
    "batch_interval_minutes" INTEGER,
    "exclude_recently_contacted_days" INTEGER,
    "recipients_targeted" INTEGER NOT NULL DEFAULT 0,
    "recipients_sent" INTEGER NOT NULL DEFAULT 0,
    "internal_notes" TEXT,
    "launched_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "estimate_id" UUID NOT NULL,
    "kind" VARCHAR(20) NOT NULL,
    "service_id" UUID,
    "product_id" UUID,
    "description" TEXT,
    "quantity" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_billable" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "estimate_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_materials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "estimate_id" UUID NOT NULL,
    "product_id" UUID,
    "product_name" VARCHAR(255) NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit_of_measure" VARCHAR(40),
    "source" TEXT NOT NULL DEFAULT 'bom',
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "estimate_item_id" UUID,
    "service_id" UUID,
    "service_name" VARCHAR(255),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estimate_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "work_order_id" UUID NOT NULL,
    "service_id" UUID,
    "description" TEXT,
    "quantity" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "assigned_contractor_id" UUID,
    "scheduled_for" TIMESTAMPTZ(6),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "work_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_materials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "default_quantity" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "service_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_vendor_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "purchase_url" TEXT,
    "sku_at_vendor" VARCHAR(120),
    "last_known_price" DECIMAL(12,2),
    "is_preferred" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "product_vendor_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_deliveries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoice_id" UUID NOT NULL,
    "kind" VARCHAR(40) NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "recipient" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'queued',
    "provider_message_id" VARCHAR(120),
    "error" TEXT,
    "sent_by_user_id" UUID,
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_refunds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoice_id" UUID,
    "payment_id" UUID,
    "stripe_refund_id" VARCHAR(128),
    "stripe_charge_id" VARCHAR(128),
    "stripe_payment_intent_id" VARCHAR(128),
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(8),
    "reason" VARCHAR(64),
    "status" VARCHAR(40) NOT NULL DEFAULT 'pending',
    "failure_reason" TEXT,
    "raw_payload" JSONB,
    "refunded_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" VARCHAR(128) NOT NULL,
    "type" VARCHAR(120) NOT NULL,
    "api_version" VARCHAR(40),
    "object_id" VARCHAR(128),
    "object_type" VARCHAR(80),
    "status" VARCHAR(40) NOT NULL DEFAULT 'received',
    "error_message" TEXT,
    "payload" JSONB,
    "received_at" TIMESTAMPTZ(6),
    "processed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_links" (
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

-- CreateTable
CREATE TABLE "media_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_collections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_collection_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "collection_id" UUID NOT NULL,
    "media_file_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoredCredential" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "encrypted" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoredCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionState" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'standard',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowVersion" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "definition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowExport" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "artifacts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_name_key" ON "user_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_api_key_key" ON "users"("api_key");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_api_key_idx" ON "users"("api_key");

-- CreateIndex
CREATE INDEX "users_user_type_idx" ON "users"("user_type");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");

-- CreateIndex
CREATE INDEX "password_resets_token_hash_idx" ON "password_resets"("token_hash");

-- CreateIndex
CREATE INDEX "password_resets_expires_at_idx" ON "password_resets"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_hash_key" ON "user_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "change_log_table_name_record_id_idx" ON "change_log"("table_name", "record_id");

-- CreateIndex
CREATE INDEX "change_log_user_id_idx" ON "change_log"("user_id");

-- CreateIndex
CREATE INDEX "change_log_created_at_idx" ON "change_log"("created_at");

-- CreateIndex
CREATE INDEX "settings_module_idx" ON "settings"("module");

-- CreateIndex
CREATE INDEX "settings_module_key_idx" ON "settings"("module", "key");

-- CreateIndex
CREATE UNIQUE INDEX "settings_module_key_key" ON "settings"("module", "key");

-- CreateIndex
CREATE INDEX "businesses_is_primary_idx" ON "businesses"("is_primary");

-- CreateIndex
CREATE INDEX "organizations_name_idx" ON "organizations"("name");

-- CreateIndex
CREATE INDEX "organizations_relationship_type_idx" ON "organizations"("relationship_type");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "organizations"("status");

-- CreateIndex
CREATE INDEX "organizations_last_contacted_at_idx" ON "organizations"("last_contacted_at");

-- CreateIndex
CREATE INDEX "contacts_organization_id_idx" ON "contacts"("organization_id");

-- CreateIndex
CREATE INDEX "contacts_type_idx" ON "contacts"("type");

-- CreateIndex
CREATE INDEX "contacts_email_idx" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_status_idx" ON "contacts"("status");

-- CreateIndex
CREATE INDEX "contacts_last_contacted_at_idx" ON "contacts"("last_contacted_at");

-- CreateIndex
CREATE INDEX "contacts_stripe_customer_id_idx" ON "contacts"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_assigned_to_idx" ON "leads"("assigned_to");

-- CreateIndex
CREATE INDEX "leads_next_follow_up_idx" ON "leads"("next_follow_up");

-- CreateIndex
CREATE INDEX "leads_source_idx" ON "leads"("source");

-- CreateIndex
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");

-- CreateIndex
CREATE INDEX "opportunities_status_idx" ON "opportunities"("status");

-- CreateIndex
CREATE INDEX "opportunities_priority_idx" ON "opportunities"("priority");

-- CreateIndex
CREATE INDEX "opportunities_target_date_idx" ON "opportunities"("target_date");

-- CreateIndex
CREATE INDEX "opportunities_assigned_to_idx" ON "opportunities"("assigned_to");

-- CreateIndex
CREATE UNIQUE INDEX "estimate_templates_name_key" ON "estimate_templates"("name");

-- CreateIndex
CREATE INDEX "estimate_templates_is_active_idx" ON "estimate_templates"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "estimates_estimate_number_key" ON "estimates"("estimate_number");

-- CreateIndex
CREATE INDEX "estimates_estimate_number_idx" ON "estimates"("estimate_number");

-- CreateIndex
CREATE INDEX "estimates_estimate_template_id_idx" ON "estimates"("estimate_template_id");

-- CreateIndex
CREATE INDEX "estimates_status_idx" ON "estimates"("status");

-- CreateIndex
CREATE INDEX "estimates_valid_until_idx" ON "estimates"("valid_until");

-- CreateIndex
CREATE INDEX "estimates_contact_id_idx" ON "estimates"("contact_id");

-- CreateIndex
CREATE INDEX "estimates_created_at_idx" ON "estimates"("created_at");

-- CreateIndex
CREATE INDEX "estimates_converted_work_order_id_idx" ON "estimates"("converted_work_order_id");

-- CreateIndex
CREATE INDEX "estimates_converted_invoice_id_idx" ON "estimates"("converted_invoice_id");

-- CreateIndex
CREATE INDEX "services_name_idx" ON "services"("name");

-- CreateIndex
CREATE INDEX "services_category_idx" ON "services"("category");

-- CreateIndex
CREATE INDEX "services_is_active_idx" ON "services"("is_active");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "products_is_for_sale_idx" ON "products"("is_for_sale");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "inventory_product_id_idx" ON "inventory"("product_id");

-- CreateIndex
CREATE INDEX "inventory_quantity_on_hand_idx" ON "inventory"("quantity_on_hand");

-- CreateIndex
CREATE INDEX "inventory_location_idx" ON "inventory"("location");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_product_id_key" ON "inventory"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_work_order_number_key" ON "work_orders"("work_order_number");

-- CreateIndex
CREATE INDEX "work_orders_work_order_number_idx" ON "work_orders"("work_order_number");

-- CreateIndex
CREATE INDEX "work_orders_status_idx" ON "work_orders"("status");

-- CreateIndex
CREATE INDEX "work_orders_contact_id_idx" ON "work_orders"("contact_id");

-- CreateIndex
CREATE INDEX "work_orders_assigned_contractor_id_idx" ON "work_orders"("assigned_contractor_id");

-- CreateIndex
CREATE INDEX "work_orders_scheduled_date_idx" ON "work_orders"("scheduled_date");

-- CreateIndex
CREATE INDEX "work_orders_booking_date_idx" ON "work_orders"("booking_date");

-- CreateIndex
CREATE INDEX "bookings_work_order_id_idx" ON "bookings"("work_order_id");

-- CreateIndex
CREATE INDEX "bookings_booking_date_idx" ON "bookings"("booking_date");

-- CreateIndex
CREATE INDEX "bookings_booking_link_id_idx" ON "bookings"("booking_link_id");

-- CreateIndex
CREATE INDEX "bookings_contact_id_idx" ON "bookings"("contact_id");

-- CreateIndex
CREATE INDEX "bookings_status_starts_at_idx" ON "bookings"("status", "starts_at");

-- CreateIndex
CREATE INDEX "work_order_materials_work_order_id_idx" ON "work_order_materials"("work_order_id");

-- CreateIndex
CREATE INDEX "work_order_materials_product_id_idx" ON "work_order_materials"("product_id");

-- CreateIndex
CREATE INDEX "work_order_materials_source_idx" ON "work_order_materials"("source");

-- CreateIndex
CREATE INDEX "work_order_status_history_work_order_id_idx" ON "work_order_status_history"("work_order_id");

-- CreateIndex
CREATE INDEX "work_order_status_history_changed_at_idx" ON "work_order_status_history"("changed_at");

-- CreateIndex
CREATE INDEX "work_order_time_logs_work_order_id_idx" ON "work_order_time_logs"("work_order_id");

-- CreateIndex
CREATE INDEX "work_order_time_logs_logged_by_idx" ON "work_order_time_logs"("logged_by");

-- CreateIndex
CREATE INDEX "contractor_performance_work_order_id_idx" ON "contractor_performance"("work_order_id");

-- CreateIndex
CREATE INDEX "contractor_performance_contractor_id_idx" ON "contractor_performance"("contractor_id");

-- CreateIndex
CREATE INDEX "safety_incidents_work_order_id_idx" ON "safety_incidents"("work_order_id");

-- CreateIndex
CREATE INDEX "safety_incidents_severity_idx" ON "safety_incidents"("severity");

-- CreateIndex
CREATE INDEX "reviews_work_order_id_idx" ON "reviews"("work_order_id");

-- CreateIndex
CREATE INDEX "reviews_sentiment_score_idx" ON "reviews"("sentiment_score");

-- CreateIndex
CREATE INDEX "quality_reviews_work_order_id_idx" ON "quality_reviews"("work_order_id");

-- CreateIndex
CREATE INDEX "quality_reviews_submitted_at_idx" ON "quality_reviews"("submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "quality_reviews_work_order_id_key" ON "quality_reviews"("work_order_id");

-- CreateIndex
CREATE INDEX "material_returns_work_order_id_idx" ON "material_returns"("work_order_id");

-- CreateIndex
CREATE INDEX "material_returns_product_id_idx" ON "material_returns"("product_id");

-- CreateIndex
CREATE INDEX "material_purchases_work_order_id_idx" ON "material_purchases"("work_order_id");

-- CreateIndex
CREATE INDEX "material_purchases_vendor_id_idx" ON "material_purchases"("vendor_id");

-- CreateIndex
CREATE INDEX "material_purchases_purchase_date_idx" ON "material_purchases"("purchase_date");

-- CreateIndex
CREATE UNIQUE INDEX "booking_links_slug_key" ON "booking_links"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "booking_links_public_token_key" ON "booking_links"("public_token");

-- CreateIndex
CREATE INDEX "booking_links_is_active_idx" ON "booking_links"("is_active");

-- CreateIndex
CREATE INDEX "booking_links_link_kind_idx" ON "booking_links"("link_kind");

-- CreateIndex
CREATE INDEX "booking_links_contact_id_idx" ON "booking_links"("contact_id");

-- CreateIndex
CREATE INDEX "booking_links_work_order_id_idx" ON "booking_links"("work_order_id");

-- CreateIndex
CREATE INDEX "availability_schedules_subject_kind_user_id_idx" ON "availability_schedules"("subject_kind", "user_id");

-- CreateIndex
CREATE INDEX "availability_schedules_subject_kind_service_id_idx" ON "availability_schedules"("subject_kind", "service_id");

-- CreateIndex
CREATE INDEX "availability_schedules_subject_kind_business_id_idx" ON "availability_schedules"("subject_kind", "business_id");

-- CreateIndex
CREATE INDEX "availability_schedules_valid_from_valid_to_idx" ON "availability_schedules"("valid_from", "valid_to");

-- CreateIndex
CREATE INDEX "availability_schedules_is_published_idx" ON "availability_schedules"("is_published");

-- CreateIndex
CREATE INDEX "availability_pattern_days_schedule_id_idx" ON "availability_pattern_days"("schedule_id");

-- CreateIndex
CREATE INDEX "availability_exceptions_schedule_id_specific_date_idx" ON "availability_exceptions"("schedule_id", "specific_date");

-- CreateIndex
CREATE INDEX "sops_title_idx" ON "sops"("title");

-- CreateIndex
CREATE INDEX "sops_is_active_idx" ON "sops"("is_active");

-- CreateIndex
CREATE INDEX "service_sops_service_id_idx" ON "service_sops"("service_id");

-- CreateIndex
CREATE INDEX "service_sops_sop_id_idx" ON "service_sops"("sop_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_sops_service_id_sop_id_key" ON "service_sops"("service_id", "sop_id");

-- CreateIndex
CREATE INDEX "work_order_assignments_work_order_id_idx" ON "work_order_assignments"("work_order_id");

-- CreateIndex
CREATE INDEX "work_order_assignments_contractor_id_idx" ON "work_order_assignments"("contractor_id");

-- CreateIndex
CREATE INDEX "customer_signoffs_work_order_id_idx" ON "customer_signoffs"("work_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_signoffs_work_order_id_key" ON "customer_signoffs"("work_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_code_key" ON "chart_of_accounts"("code");

-- CreateIndex
CREATE INDEX "chart_of_accounts_type_idx" ON "chart_of_accounts"("type");

-- CreateIndex
CREATE INDEX "chart_of_accounts_sub_type_idx" ON "chart_of_accounts"("sub_type");

-- CreateIndex
CREATE INDEX "chart_of_accounts_is_active_idx" ON "chart_of_accounts"("is_active");

-- CreateIndex
CREATE INDEX "chart_of_accounts_parent_id_idx" ON "chart_of_accounts"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_entry_number_key" ON "journal_entries"("entry_number");

-- CreateIndex
CREATE INDEX "journal_entries_entry_date_idx" ON "journal_entries"("entry_date");

-- CreateIndex
CREATE INDEX "journal_entries_created_by_idx" ON "journal_entries"("created_by");

-- CreateIndex
CREATE INDEX "journal_entries_status_entry_date_idx" ON "journal_entries"("status", "entry_date");

-- CreateIndex
CREATE INDEX "journal_entries_status_posted_at_idx" ON "journal_entries"("status", "posted_at");

-- CreateIndex
CREATE INDEX "journal_entries_reference_idx" ON "journal_entries"("reference");

-- CreateIndex
CREATE INDEX "journal_entry_lines_journal_entry_id_idx" ON "journal_entry_lines"("journal_entry_id");

-- CreateIndex
CREATE INDEX "journal_entry_lines_account_id_idx" ON "journal_entry_lines"("account_id");

-- CreateIndex
CREATE INDEX "journal_entry_lines_journal_entry_id_position_idx" ON "journal_entry_lines"("journal_entry_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_invoice_number_idx" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_contact_id_idx" ON "invoices"("contact_id");

-- CreateIndex
CREATE INDEX "invoices_due_date_idx" ON "invoices"("due_date");

-- CreateIndex
CREATE INDEX "invoices_work_order_id_idx" ON "invoices"("work_order_id");

-- CreateIndex
CREATE INDEX "invoices_estimate_id_idx" ON "invoices"("estimate_id");

-- CreateIndex
CREATE INDEX "invoices_stripe_payment_intent_id_idx" ON "invoices"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "invoices_stripe_checkout_session_id_idx" ON "invoices"("stripe_checkout_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_public_token_key" ON "invoices"("public_token");

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_position_idx" ON "invoice_items"("invoice_id", "position");

-- CreateIndex
CREATE INDEX "invoice_items_service_id_idx" ON "invoice_items"("service_id");

-- CreateIndex
CREATE INDEX "invoice_items_product_id_idx" ON "invoice_items"("product_id");

-- CreateIndex
CREATE INDEX "recurring_invoices_status_idx" ON "recurring_invoices"("status");

-- CreateIndex
CREATE INDEX "recurring_invoices_next_invoice_date_idx" ON "recurring_invoices"("next_invoice_date");

-- CreateIndex
CREATE INDEX "recurring_invoices_stripe_subscription_id_idx" ON "recurring_invoices"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "bills_bill_number_key" ON "bills"("bill_number");

-- CreateIndex
CREATE INDEX "bills_bill_number_idx" ON "bills"("bill_number");

-- CreateIndex
CREATE INDEX "bills_vendor_id_idx" ON "bills"("vendor_id");

-- CreateIndex
CREATE INDEX "bills_status_idx" ON "bills"("status");

-- CreateIndex
CREATE INDEX "bills_due_date_idx" ON "bills"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_number_key" ON "payments"("payment_number");

-- CreateIndex
CREATE INDEX "payments_payment_number_idx" ON "payments"("payment_number");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_bill_id_idx" ON "payments"("bill_id");

-- CreateIndex
CREATE INDEX "payments_payment_date_idx" ON "payments"("payment_date");

-- CreateIndex
CREATE INDEX "payments_reconciliation_status_idx" ON "payments"("reconciliation_status");

-- CreateIndex
CREATE INDEX "payments_stripe_payment_intent_id_idx" ON "payments"("stripe_payment_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_expense_number_key" ON "expenses"("expense_number");

-- CreateIndex
CREATE INDEX "expenses_vendor_id_idx" ON "expenses"("vendor_id");

-- CreateIndex
CREATE INDEX "expenses_expense_date_idx" ON "expenses"("expense_date");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_payroll_number_key" ON "payroll"("payroll_number");

-- CreateIndex
CREATE INDEX "payroll_employee_id_idx" ON "payroll"("employee_id");

-- CreateIndex
CREATE INDEX "payroll_pay_date_idx" ON "payroll"("pay_date");

-- CreateIndex
CREATE INDEX "payroll_status_idx" ON "payroll"("status");

-- CreateIndex
CREATE INDEX "tax_forms_tax_year_idx" ON "tax_forms"("tax_year");

-- CreateIndex
CREATE INDEX "tax_forms_status_idx" ON "tax_forms"("status");

-- CreateIndex
CREATE INDEX "tax_filings_tax_year_idx" ON "tax_filings"("tax_year");

-- CreateIndex
CREATE INDEX "tax_filings_status_idx" ON "tax_filings"("status");

-- CreateIndex
CREATE INDEX "tax_payments_tax_filing_id_idx" ON "tax_payments"("tax_filing_id");

-- CreateIndex
CREATE INDEX "tax_payments_payment_date_idx" ON "tax_payments"("payment_date");

-- CreateIndex
CREATE UNIQUE INDEX "credits_credit_number_key" ON "credits"("credit_number");

-- CreateIndex
CREATE INDEX "credits_invoice_id_idx" ON "credits"("invoice_id");

-- CreateIndex
CREATE INDEX "credits_work_order_id_idx" ON "credits"("work_order_id");

-- CreateIndex
CREATE INDEX "credits_status_idx" ON "credits"("status");

-- CreateIndex
CREATE INDEX "credits_credit_date_idx" ON "credits"("credit_date");

-- CreateIndex
CREATE INDEX "bank_accounts_name_idx" ON "bank_accounts"("name");

-- CreateIndex
CREATE INDEX "bank_accounts_account_type_idx" ON "bank_accounts"("account_type");

-- CreateIndex
CREATE INDEX "bank_accounts_chart_of_account_id_idx" ON "bank_accounts"("chart_of_account_id");

-- CreateIndex
CREATE INDEX "bank_accounts_is_active_idx" ON "bank_accounts"("is_active");

-- CreateIndex
CREATE INDEX "bank_accounts_provider_provider_account_id_idx" ON "bank_accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_provider_provider_account_id_key" ON "bank_accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE INDEX "bank_cards_vendor_id_idx" ON "bank_cards"("vendor_id");

-- CreateIndex
CREATE INDEX "bank_cards_status_idx" ON "bank_cards"("status");

-- CreateIndex
CREATE INDEX "bank_cards_provider_provider_card_id_idx" ON "bank_cards"("provider", "provider_card_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_cards_provider_provider_card_id_key" ON "bank_cards"("provider", "provider_card_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_merchants_normalized_name_key" ON "bank_merchants"("normalized_name");

-- CreateIndex
CREATE INDEX "bank_merchants_display_name_idx" ON "bank_merchants"("display_name");

-- CreateIndex
CREATE INDEX "bank_merchants_domain_idx" ON "bank_merchants"("domain");

-- CreateIndex
CREATE INDEX "bank_transactions_bank_account_id_idx" ON "bank_transactions"("bank_account_id");

-- CreateIndex
CREATE INDEX "bank_transactions_bank_account_id_transaction_date_idx" ON "bank_transactions"("bank_account_id", "transaction_date");

-- CreateIndex
CREATE INDEX "bank_transactions_transaction_type_idx" ON "bank_transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "bank_transactions_internal_category_idx" ON "bank_transactions"("internal_category");

-- CreateIndex
CREATE INDEX "bank_transactions_status_idx" ON "bank_transactions"("status");

-- CreateIndex
CREATE INDEX "bank_transactions_provider_provider_transaction_id_idx" ON "bank_transactions"("provider", "provider_transaction_id");

-- CreateIndex
CREATE INDEX "bank_transactions_posted_at_idx" ON "bank_transactions"("posted_at");

-- CreateIndex
CREATE INDEX "bank_transactions_merchant_id_idx" ON "bank_transactions"("merchant_id");

-- CreateIndex
CREATE INDEX "bank_transactions_rule_resolution_status_idx" ON "bank_transactions"("rule_resolution_status");

-- CreateIndex
CREATE INDEX "bank_transactions_llm_review_status_idx" ON "bank_transactions"("llm_review_status");

-- CreateIndex
CREATE INDEX "bank_transactions_ignored_at_idx" ON "bank_transactions"("ignored_at");

-- CreateIndex
CREATE UNIQUE INDEX "bank_transactions_provider_provider_transaction_id_key" ON "bank_transactions"("provider", "provider_transaction_id");

-- CreateIndex
CREATE INDEX "bank_sync_audit_log_provider_operation_idx" ON "bank_sync_audit_log"("provider", "operation");

-- CreateIndex
CREATE INDEX "bank_sync_audit_log_created_at_idx" ON "bank_sync_audit_log"("created_at");

-- CreateIndex
CREATE INDEX "bank_reconciliations_bank_account_id_statement_date_idx" ON "bank_reconciliations"("bank_account_id", "statement_date");

-- CreateIndex
CREATE INDEX "bank_reconciliations_status_idx" ON "bank_reconciliations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bank_transfers_transfer_number_key" ON "bank_transfers"("transfer_number");

-- CreateIndex
CREATE INDEX "bank_transfers_transfer_date_idx" ON "bank_transfers"("transfer_date");

-- CreateIndex
CREATE INDEX "bank_transfers_status_idx" ON "bank_transfers"("status");

-- CreateIndex
CREATE INDEX "bank_imports_bank_account_id_idx" ON "bank_imports"("bank_account_id");

-- CreateIndex
CREATE INDEX "bank_imports_status_idx" ON "bank_imports"("status");

-- CreateIndex
CREATE INDEX "bank_imports_import_date_idx" ON "bank_imports"("import_date");

-- CreateIndex
CREATE INDEX "bank_rules_rule_name_idx" ON "bank_rules"("rule_name");

-- CreateIndex
CREATE INDEX "bank_rules_priority_idx" ON "bank_rules"("priority");

-- CreateIndex
CREATE INDEX "bank_rules_is_active_idx" ON "bank_rules"("is_active");

-- CreateIndex
CREATE INDEX "bank_rules_is_active_priority_idx" ON "bank_rules"("is_active", "priority");

-- CreateIndex
CREATE INDEX "bank_rules_applies_to_provider_idx" ON "bank_rules"("applies_to_provider");

-- CreateIndex
CREATE INDEX "bank_rules_applies_to_account_id_idx" ON "bank_rules"("applies_to_account_id");

-- CreateIndex
CREATE INDEX "bank_transaction_rule_matches_bank_transaction_id_created_a_idx" ON "bank_transaction_rule_matches"("bank_transaction_id", "created_at");

-- CreateIndex
CREATE INDEX "bank_transaction_review_tasks_status_idx" ON "bank_transaction_review_tasks"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bank_transaction_review_tasks_bank_transaction_id_key" ON "bank_transaction_review_tasks"("bank_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories"("slug");

-- CreateIndex
CREATE INDEX "blog_categories_is_active_idx" ON "blog_categories"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "blog_tags_slug_key" ON "blog_tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_status_idx" ON "blog_posts"("status");

-- CreateIndex
CREATE INDEX "blog_posts_published_at_idx" ON "blog_posts"("published_at");

-- CreateIndex
CREATE INDEX "blog_posts_author_id_idx" ON "blog_posts"("author_id");

-- CreateIndex
CREATE INDEX "blog_posts_category_id_idx" ON "blog_posts"("category_id");

-- CreateIndex
CREATE INDEX "blog_post_tags_blog_post_id_idx" ON "blog_post_tags"("blog_post_id");

-- CreateIndex
CREATE INDEX "blog_post_tags_blog_tag_id_idx" ON "blog_post_tags"("blog_tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_post_tags_blog_post_id_blog_tag_id_key" ON "blog_post_tags"("blog_post_id", "blog_tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "pages_page_slug_key" ON "pages"("page_slug");

-- CreateIndex
CREATE INDEX "pages_page_slug_idx" ON "pages"("page_slug");

-- CreateIndex
CREATE INDEX "pages_status_idx" ON "pages"("status");

-- CreateIndex
CREATE UNIQUE INDEX "page_section_types_slug_key" ON "page_section_types"("slug");

-- CreateIndex
CREATE INDEX "media_files_library_type_idx" ON "media_files"("library_type");

-- CreateIndex
CREATE INDEX "media_files_media_kind_idx" ON "media_files"("media_kind");

-- CreateIndex
CREATE INDEX "media_files_scan_status_idx" ON "media_files"("scan_status");

-- CreateIndex
CREATE INDEX "media_files_source_idx" ON "media_files"("source");

-- CreateIndex
CREATE INDEX "media_files_category_id_idx" ON "media_files"("category_id");

-- CreateIndex
CREATE INDEX "media_files_parent_media_id_idx" ON "media_files"("parent_media_id");

-- CreateIndex
CREATE INDEX "media_files_work_order_id_idx" ON "media_files"("work_order_id");

-- CreateIndex
CREATE INDEX "media_files_uploaded_by_idx" ON "media_files"("uploaded_by");

-- CreateIndex
CREATE INDEX "social_media_content_platform_idx" ON "social_media_content"("platform");

-- CreateIndex
CREATE INDEX "social_media_content_status_idx" ON "social_media_content"("status");

-- CreateIndex
CREATE INDEX "social_media_content_scheduled_at_idx" ON "social_media_content"("scheduled_at");

-- CreateIndex
CREATE INDEX "social_media_content_primary_creative_asset_id_idx" ON "social_media_content"("primary_creative_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_blanks_slug_key" ON "product_blanks"("slug");

-- CreateIndex
CREATE INDEX "product_blanks_slug_idx" ON "product_blanks"("slug");

-- CreateIndex
CREATE INDEX "product_blanks_is_active_idx" ON "product_blanks"("is_active");

-- CreateIndex
CREATE INDEX "product_blanks_fulfillment_provider_idx" ON "product_blanks"("fulfillment_provider");

-- CreateIndex
CREATE INDEX "product_templates_product_blank_id_idx" ON "product_templates"("product_blank_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_templates_product_blank_id_color_key_key" ON "product_templates"("product_blank_id", "color_key");

-- CreateIndex
CREATE INDEX "designs_status_idx" ON "designs"("status");

-- CreateIndex
CREATE INDEX "designs_product_blank_id_idx" ON "designs"("product_blank_id");

-- CreateIndex
CREATE INDEX "design_mockups_design_id_idx" ON "design_mockups"("design_id");

-- CreateIndex
CREATE UNIQUE INDEX "design_mockups_design_id_product_template_id_kind_key" ON "design_mockups"("design_id", "product_template_id", "kind");

-- CreateIndex
CREATE INDEX "print_orders_status_idx" ON "print_orders"("status");

-- CreateIndex
CREATE INDEX "print_order_items_print_order_id_idx" ON "print_order_items"("print_order_id");

-- CreateIndex
CREATE INDEX "ad_campaigns_status_idx" ON "ad_campaigns"("status");

-- CreateIndex
CREATE INDEX "ad_campaigns_start_date_idx" ON "ad_campaigns"("start_date");

-- CreateIndex
CREATE INDEX "campaign_budgets_budget_status_idx" ON "campaign_budgets"("budget_status");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_budgets_campaign_id_key" ON "campaign_budgets"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "landing_pages_slug_key" ON "landing_pages"("slug");

-- CreateIndex
CREATE INDEX "landing_pages_status_idx" ON "landing_pages"("status");

-- CreateIndex
CREATE INDEX "ads_campaign_id_idx" ON "ads"("campaign_id");

-- CreateIndex
CREATE INDEX "ads_status_idx" ON "ads"("status");

-- CreateIndex
CREATE INDEX "ads_platform_idx" ON "ads"("platform");

-- CreateIndex
CREATE INDEX "ads_landing_page_id_idx" ON "ads"("landing_page_id");

-- CreateIndex
CREATE INDEX "ads_primary_creative_asset_id_idx" ON "ads"("primary_creative_asset_id");

-- CreateIndex
CREATE INDEX "ad_variants_ad_id_idx" ON "ad_variants"("ad_id");

-- CreateIndex
CREATE INDEX "ad_variants_is_winner_idx" ON "ad_variants"("is_winner");

-- CreateIndex
CREATE INDEX "campaign_performance_campaign_id_idx" ON "campaign_performance"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_performance_date_idx" ON "campaign_performance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_performance_campaign_id_date_key" ON "campaign_performance"("campaign_id", "date");

-- CreateIndex
CREATE INDEX "creative_assets_creatable_type_creatable_id_idx" ON "creative_assets"("creatable_type", "creatable_id");

-- CreateIndex
CREATE INDEX "creative_assets_media_id_idx" ON "creative_assets"("media_id");

-- CreateIndex
CREATE INDEX "creative_assets_asset_type_idx" ON "creative_assets"("asset_type");

-- CreateIndex
CREATE INDEX "ad_audiences_platform_idx" ON "ad_audiences"("platform");

-- CreateIndex
CREATE INDEX "ad_audiences_audience_type_idx" ON "ad_audiences"("audience_type");

-- CreateIndex
CREATE INDEX "ad_placements_ad_id_idx" ON "ad_placements"("ad_id");

-- CreateIndex
CREATE INDEX "ad_placements_platform_idx" ON "ad_placements"("platform");

-- CreateIndex
CREATE INDEX "marketing_attribution_contact_id_idx" ON "marketing_attribution"("contact_id");

-- CreateIndex
CREATE INDEX "marketing_attribution_campaign_id_idx" ON "marketing_attribution"("campaign_id");

-- CreateIndex
CREATE INDEX "marketing_attribution_touchpoint_date_idx" ON "marketing_attribution"("touchpoint_date");

-- CreateIndex
CREATE INDEX "integrations_type_idx" ON "integrations"("type");

-- CreateIndex
CREATE INDEX "integrations_status_idx" ON "integrations"("status");

-- CreateIndex
CREATE INDEX "integrations_provider_idx" ON "integrations"("provider");

-- CreateIndex
CREATE INDEX "integrations_environment_idx" ON "integrations"("environment");

-- CreateIndex
CREATE INDEX "credentials_is_active_idx" ON "credentials"("is_active");

-- CreateIndex
CREATE INDEX "credentials_name_idx" ON "credentials"("name");

-- CreateIndex
CREATE INDEX "integration_logs_integration_id_idx" ON "integration_logs"("integration_id");

-- CreateIndex
CREATE INDEX "integration_logs_log_type_idx" ON "integration_logs"("log_type");

-- CreateIndex
CREATE INDEX "integration_logs_status_idx" ON "integration_logs"("status");

-- CreateIndex
CREATE INDEX "integration_logs_created_at_idx" ON "integration_logs"("created_at");

-- CreateIndex
CREATE INDEX "tasks_assigned_to_idx" ON "tasks"("assigned_to");

-- CreateIndex
CREATE INDEX "tasks_owner_user_id_idx" ON "tasks"("owner_user_id");

-- CreateIndex
CREATE INDEX "tasks_originator_user_id_idx" ON "tasks"("originator_user_id");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");

-- CreateIndex
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");

-- CreateIndex
CREATE INDEX "tasks_category_idx" ON "tasks"("category");

-- CreateIndex
CREATE INDEX "tasks_type_idx" ON "tasks"("type");

-- CreateIndex
CREATE INDEX "tasks_opportunity_id_idx" ON "tasks"("opportunity_id");

-- CreateIndex
CREATE INDEX "activities_type_idx" ON "activities"("type");

-- CreateIndex
CREATE INDEX "activities_status_idx" ON "activities"("status");

-- CreateIndex
CREATE INDEX "activities_priority_idx" ON "activities"("priority");

-- CreateIndex
CREATE INDEX "activities_activity_date_idx" ON "activities"("activity_date");

-- CreateIndex
CREATE INDEX "activities_assigned_to_idx" ON "activities"("assigned_to");

-- CreateIndex
CREATE INDEX "activities_lead_id_idx" ON "activities"("lead_id");

-- CreateIndex
CREATE INDEX "activities_contact_id_idx" ON "activities"("contact_id");

-- CreateIndex
CREATE INDEX "activities_organization_id_idx" ON "activities"("organization_id");

-- CreateIndex
CREATE INDEX "activities_related_type_related_id_idx" ON "activities"("related_type", "related_id");

-- CreateIndex
CREATE INDEX "ai_agent_profiles_status_idx" ON "ai_agent_profiles"("status");

-- CreateIndex
CREATE INDEX "ai_agent_profiles_last_active_at_idx" ON "ai_agent_profiles"("last_active_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_agent_profiles_user_id_key" ON "ai_agent_profiles"("user_id");

-- CreateIndex
CREATE INDEX "ai_task_runs_task_id_idx" ON "ai_task_runs"("task_id");

-- CreateIndex
CREATE INDEX "ai_task_runs_agent_user_id_idx" ON "ai_task_runs"("agent_user_id");

-- CreateIndex
CREATE INDEX "ai_task_runs_status_idx" ON "ai_task_runs"("status");

-- CreateIndex
CREATE INDEX "ai_alerts_alert_type_idx" ON "ai_alerts"("alert_type");

-- CreateIndex
CREATE INDEX "ai_alerts_is_resolved_idx" ON "ai_alerts"("is_resolved");

-- CreateIndex
CREATE INDEX "ai_alerts_created_at_idx" ON "ai_alerts"("created_at");

-- CreateIndex
CREATE INDEX "low_stock_alerts_status_idx" ON "low_stock_alerts"("status");

-- CreateIndex
CREATE INDEX "low_stock_alerts_inventory_id_idx" ON "low_stock_alerts"("inventory_id");

-- CreateIndex
CREATE INDEX "email_templates_status_idx" ON "email_templates"("status");

-- CreateIndex
CREATE INDEX "email_templates_category_idx" ON "email_templates"("category");

-- CreateIndex
CREATE INDEX "email_templates_updated_at_idx" ON "email_templates"("updated_at");

-- CreateIndex
CREATE INDEX "email_audiences_status_idx" ON "email_audiences"("status");

-- CreateIndex
CREATE INDEX "email_audiences_name_idx" ON "email_audiences"("name");

-- CreateIndex
CREATE INDEX "email_campaigns_status_idx" ON "email_campaigns"("status");

-- CreateIndex
CREATE INDEX "email_campaigns_scheduled_at_idx" ON "email_campaigns"("scheduled_at");

-- CreateIndex
CREATE INDEX "email_campaigns_email_template_id_idx" ON "email_campaigns"("email_template_id");

-- CreateIndex
CREATE INDEX "email_campaigns_email_audience_id_idx" ON "email_campaigns"("email_audience_id");

-- CreateIndex
CREATE INDEX "estimate_items_estimate_id_sort_order_idx" ON "estimate_items"("estimate_id", "sort_order");

-- CreateIndex
CREATE INDEX "estimate_materials_estimate_id_idx" ON "estimate_materials"("estimate_id");

-- CreateIndex
CREATE INDEX "estimate_materials_product_id_idx" ON "estimate_materials"("product_id");

-- CreateIndex
CREATE INDEX "work_order_items_work_order_id_sort_order_idx" ON "work_order_items"("work_order_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "service_materials_service_id_product_id_key" ON "service_materials"("service_id", "product_id");

-- CreateIndex
CREATE INDEX "product_vendor_links_product_id_sort_order_idx" ON "product_vendor_links"("product_id", "sort_order");

-- CreateIndex
CREATE INDEX "invoice_deliveries_invoice_id_sent_at_idx" ON "invoice_deliveries"("invoice_id", "sent_at");

-- CreateIndex
CREATE INDEX "invoice_deliveries_kind_idx" ON "invoice_deliveries"("kind");

-- CreateIndex
CREATE INDEX "invoice_refunds_invoice_id_idx" ON "invoice_refunds"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_refunds_payment_id_idx" ON "invoice_refunds"("payment_id");

-- CreateIndex
CREATE INDEX "invoice_refunds_stripe_refund_id_idx" ON "invoice_refunds"("stripe_refund_id");

-- CreateIndex
CREATE INDEX "invoice_refunds_status_idx" ON "invoice_refunds"("status");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_events_event_id_key" ON "stripe_events"("event_id");

-- CreateIndex
CREATE INDEX "stripe_events_type_idx" ON "stripe_events"("type");

-- CreateIndex
CREATE INDEX "stripe_events_status_idx" ON "stripe_events"("status");

-- CreateIndex
CREATE INDEX "stripe_events_object_id_idx" ON "stripe_events"("object_id");

-- CreateIndex
CREATE INDEX "media_links_media_file_id_idx" ON "media_links"("media_file_id");

-- CreateIndex
CREATE INDEX "media_links_owner_type_owner_id_idx" ON "media_links"("owner_type", "owner_id");

-- CreateIndex
CREATE INDEX "media_links_role_idx" ON "media_links"("role");

-- CreateIndex
CREATE UNIQUE INDEX "media_categories_slug_key" ON "media_categories"("slug");

-- CreateIndex
CREATE INDEX "media_categories_is_active_idx" ON "media_categories"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "media_collections_slug_key" ON "media_collections"("slug");

-- CreateIndex
CREATE INDEX "media_collection_items_collection_id_sort_order_idx" ON "media_collection_items"("collection_id", "sort_order");

-- CreateIndex
CREATE INDEX "media_collection_items_media_file_id_idx" ON "media_collection_items"("media_file_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_collection_items_collection_id_media_file_id_key" ON "media_collection_items"("collection_id", "media_file_id");

-- CreateIndex
CREATE UNIQUE INDEX "StoredCredential_domain_key" ON "StoredCredential"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "SessionState_domain_key" ON "SessionState"("domain");

-- CreateIndex
CREATE INDEX "WorkflowVersion_workflowId_idx" ON "WorkflowVersion"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowVersion_workflowId_version_key" ON "WorkflowVersion"("workflowId", "version");

-- CreateIndex
CREATE INDEX "WorkflowExport_workflowId_idx" ON "WorkflowExport"("workflowId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "user_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_log" ADD CONSTRAINT "change_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_log" ADD CONSTRAINT "change_log_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_log" ADD CONSTRAINT "change_log_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_templates" ADD CONSTRAINT "estimate_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_templates" ADD CONSTRAINT "estimate_templates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_parent_estimate_id_fkey" FOREIGN KEY ("parent_estimate_id") REFERENCES "estimates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_estimate_template_id_fkey" FOREIGN KEY ("estimate_template_id") REFERENCES "estimate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_converted_work_order_id_fkey" FOREIGN KEY ("converted_work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_converted_invoice_id_fkey" FOREIGN KEY ("converted_invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assigned_contractor_id_fkey" FOREIGN KEY ("assigned_contractor_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_booking_link_id_fkey" FOREIGN KEY ("booking_link_id") REFERENCES "booking_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_materials" ADD CONSTRAINT "work_order_materials_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_materials" ADD CONSTRAINT "work_order_materials_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_materials" ADD CONSTRAINT "work_order_materials_estimate_item_id_fkey" FOREIGN KEY ("estimate_item_id") REFERENCES "estimate_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_materials" ADD CONSTRAINT "work_order_materials_invoice_item_id_fkey" FOREIGN KEY ("invoice_item_id") REFERENCES "invoice_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_materials" ADD CONSTRAINT "work_order_materials_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_materials" ADD CONSTRAINT "work_order_materials_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_status_history" ADD CONSTRAINT "work_order_status_history_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_status_history" ADD CONSTRAINT "work_order_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_status_history" ADD CONSTRAINT "work_order_status_history_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_status_history" ADD CONSTRAINT "work_order_status_history_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_time_logs" ADD CONSTRAINT "work_order_time_logs_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_time_logs" ADD CONSTRAINT "work_order_time_logs_logged_by_fkey" FOREIGN KEY ("logged_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_time_logs" ADD CONSTRAINT "work_order_time_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_time_logs" ADD CONSTRAINT "work_order_time_logs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractor_performance" ADD CONSTRAINT "contractor_performance_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractor_performance" ADD CONSTRAINT "contractor_performance_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractor_performance" ADD CONSTRAINT "contractor_performance_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractor_performance" ADD CONSTRAINT "contractor_performance_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_reviews" ADD CONSTRAINT "quality_reviews_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_reviews" ADD CONSTRAINT "quality_reviews_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_reviews" ADD CONSTRAINT "quality_reviews_performance_id_fkey" FOREIGN KEY ("performance_id") REFERENCES "contractor_performance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_reviews" ADD CONSTRAINT "quality_reviews_safety_incident_id_fkey" FOREIGN KEY ("safety_incident_id") REFERENCES "safety_incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_reviews" ADD CONSTRAINT "quality_reviews_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_reviews" ADD CONSTRAINT "quality_reviews_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_reviews" ADD CONSTRAINT "quality_reviews_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_returns" ADD CONSTRAINT "material_returns_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_returns" ADD CONSTRAINT "material_returns_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_returns" ADD CONSTRAINT "material_returns_returned_by_fkey" FOREIGN KEY ("returned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_returns" ADD CONSTRAINT "material_returns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_returns" ADD CONSTRAINT "material_returns_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_purchases" ADD CONSTRAINT "material_purchases_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_purchases" ADD CONSTRAINT "material_purchases_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_purchases" ADD CONSTRAINT "material_purchases_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_purchases" ADD CONSTRAINT "material_purchases_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_purchases" ADD CONSTRAINT "material_purchases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_purchases" ADD CONSTRAINT "material_purchases_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_links" ADD CONSTRAINT "booking_links_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_links" ADD CONSTRAINT "booking_links_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_links" ADD CONSTRAINT "booking_links_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_links" ADD CONSTRAINT "booking_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_links" ADD CONSTRAINT "booking_links_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_schedules" ADD CONSTRAINT "availability_schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_schedules" ADD CONSTRAINT "availability_schedules_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_schedules" ADD CONSTRAINT "availability_schedules_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_schedules" ADD CONSTRAINT "availability_schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_pattern_days" ADD CONSTRAINT "availability_pattern_days_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "availability_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_exceptions" ADD CONSTRAINT "availability_exceptions_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "availability_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sops" ADD CONSTRAINT "sops_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sops" ADD CONSTRAINT "sops_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_sops" ADD CONSTRAINT "service_sops_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_sops" ADD CONSTRAINT "service_sops_sop_id_fkey" FOREIGN KEY ("sop_id") REFERENCES "sops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_sops" ADD CONSTRAINT "service_sops_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_sops" ADD CONSTRAINT "service_sops_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_assignments" ADD CONSTRAINT "work_order_assignments_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_assignments" ADD CONSTRAINT "work_order_assignments_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_assignments" ADD CONSTRAINT "work_order_assignments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_assignments" ADD CONSTRAINT "work_order_assignments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_signoffs" ADD CONSTRAINT "customer_signoffs_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_signoffs" ADD CONSTRAINT "customer_signoffs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_signoffs" ADD CONSTRAINT "customer_signoffs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_reverses_entry_id_fkey" FOREIGN KEY ("reverses_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_invoices" ADD CONSTRAINT "recurring_invoices_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_invoices" ADD CONSTRAINT "recurring_invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_invoices" ADD CONSTRAINT "recurring_invoices_last_generated_invoice_id_fkey" FOREIGN KEY ("last_generated_invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_invoices" ADD CONSTRAINT "recurring_invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_invoices" ADD CONSTRAINT "recurring_invoices_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_forms" ADD CONSTRAINT "tax_forms_vendor_organization_id_fkey" FOREIGN KEY ("vendor_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_forms" ADD CONSTRAINT "tax_forms_vendor_contact_id_fkey" FOREIGN KEY ("vendor_contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_forms" ADD CONSTRAINT "tax_forms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_forms" ADD CONSTRAINT "tax_forms_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_settings" ADD CONSTRAINT "tax_settings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_settings" ADD CONSTRAINT "tax_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_filings" ADD CONSTRAINT "tax_filings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_filings" ADD CONSTRAINT "tax_filings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_payments" ADD CONSTRAINT "tax_payments_tax_filing_id_fkey" FOREIGN KEY ("tax_filing_id") REFERENCES "tax_filings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_payments" ADD CONSTRAINT "tax_payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_payments" ADD CONSTRAINT "tax_payments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_chart_of_account_id_fkey" FOREIGN KEY ("chart_of_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_cards" ADD CONSTRAINT "bank_cards_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_cards" ADD CONSTRAINT "bank_cards_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_cards" ADD CONSTRAINT "bank_cards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_cards" ADD CONSTRAINT "bank_cards_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "bank_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "bank_merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_sync_audit_log" ADD CONSTRAINT "bank_sync_audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_from_account_id_fkey" FOREIGN KEY ("from_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_to_account_id_fkey" FOREIGN KEY ("to_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_imports" ADD CONSTRAINT "bank_imports_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_imports" ADD CONSTRAINT "bank_imports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_imports" ADD CONSTRAINT "bank_imports_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_rules" ADD CONSTRAINT "bank_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_rules" ADD CONSTRAINT "bank_rules_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transaction_rule_matches" ADD CONSTRAINT "bank_transaction_rule_matches_bank_transaction_id_fkey" FOREIGN KEY ("bank_transaction_id") REFERENCES "bank_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transaction_rule_matches" ADD CONSTRAINT "bank_transaction_rule_matches_bank_rule_id_fkey" FOREIGN KEY ("bank_rule_id") REFERENCES "bank_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transaction_review_tasks" ADD CONSTRAINT "bank_transaction_review_tasks_bank_transaction_id_fkey" FOREIGN KEY ("bank_transaction_id") REFERENCES "bank_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transaction_review_tasks" ADD CONSTRAINT "bank_transaction_review_tasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_tags" ADD CONSTRAINT "blog_tags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_tags" ADD CONSTRAINT "blog_tags_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_blog_post_id_fkey" FOREIGN KEY ("blog_post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_blog_tag_id_fkey" FOREIGN KEY ("blog_tag_id") REFERENCES "blog_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_section_types" ADD CONSTRAINT "page_section_types_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_section_types" ADD CONSTRAINT "page_section_types_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_parent_media_id_fkey" FOREIGN KEY ("parent_media_id") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "media_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media_content" ADD CONSTRAINT "social_media_content_primary_creative_asset_id_fkey" FOREIGN KEY ("primary_creative_asset_id") REFERENCES "creative_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media_content" ADD CONSTRAINT "social_media_content_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media_content" ADD CONSTRAINT "social_media_content_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_blanks" ADD CONSTRAINT "product_blanks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_blanks" ADD CONSTRAINT "product_blanks_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_templates" ADD CONSTRAINT "product_templates_product_blank_id_fkey" FOREIGN KEY ("product_blank_id") REFERENCES "product_blanks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designs" ADD CONSTRAINT "designs_product_blank_id_fkey" FOREIGN KEY ("product_blank_id") REFERENCES "product_blanks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designs" ADD CONSTRAINT "designs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designs" ADD CONSTRAINT "designs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_mockups" ADD CONSTRAINT "design_mockups_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "designs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_mockups" ADD CONSTRAINT "design_mockups_product_template_id_fkey" FOREIGN KEY ("product_template_id") REFERENCES "product_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_orders" ADD CONSTRAINT "print_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_order_items" ADD CONSTRAINT "print_order_items_print_order_id_fkey" FOREIGN KEY ("print_order_id") REFERENCES "print_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_order_items" ADD CONSTRAINT "print_order_items_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "designs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_order_items" ADD CONSTRAINT "print_order_items_product_template_id_fkey" FOREIGN KEY ("product_template_id") REFERENCES "product_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_budgets" ADD CONSTRAINT "campaign_budgets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_budgets" ADD CONSTRAINT "campaign_budgets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_budgets" ADD CONSTRAINT "campaign_budgets_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "ads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_primary_creative_asset_id_fkey" FOREIGN KEY ("primary_creative_asset_id") REFERENCES "creative_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_landing_page_id_fkey" FOREIGN KEY ("landing_page_id") REFERENCES "landing_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_variants" ADD CONSTRAINT "ad_variants_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_variants" ADD CONSTRAINT "ad_variants_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_variants" ADD CONSTRAINT "ad_variants_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_variants" ADD CONSTRAINT "ad_variants_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_performance" ADD CONSTRAINT "campaign_performance_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_performance" ADD CONSTRAINT "campaign_performance_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_performance" ADD CONSTRAINT "campaign_performance_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_assets" ADD CONSTRAINT "creative_assets_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_assets" ADD CONSTRAINT "creative_assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_assets" ADD CONSTRAINT "creative_assets_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_audiences" ADD CONSTRAINT "ad_audiences_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_audiences" ADD CONSTRAINT "ad_audiences_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_placements" ADD CONSTRAINT "ad_placements_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_placements" ADD CONSTRAINT "ad_placements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_placements" ADD CONSTRAINT "ad_placements_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_attribution" ADD CONSTRAINT "marketing_attribution_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_attribution" ADD CONSTRAINT "marketing_attribution_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "ads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_attribution" ADD CONSTRAINT "marketing_attribution_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_attribution" ADD CONSTRAINT "marketing_attribution_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_attribution" ADD CONSTRAINT "marketing_attribution_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_originator_user_id_fkey" FOREIGN KEY ("originator_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_profiles" ADD CONSTRAINT "ai_agent_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_profiles" ADD CONSTRAINT "ai_agent_profiles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_profiles" ADD CONSTRAINT "ai_agent_profiles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_task_runs" ADD CONSTRAINT "ai_task_runs_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_task_runs" ADD CONSTRAINT "ai_task_runs_agent_user_id_fkey" FOREIGN KEY ("agent_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_task_runs" ADD CONSTRAINT "ai_task_runs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_task_runs" ADD CONSTRAINT "ai_task_runs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_alerts" ADD CONSTRAINT "ai_alerts_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_alerts" ADD CONSTRAINT "ai_alerts_agent_user_id_fkey" FOREIGN KEY ("agent_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_alerts" ADD CONSTRAINT "ai_alerts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_alerts" ADD CONSTRAINT "ai_alerts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "low_stock_alerts" ADD CONSTRAINT "low_stock_alerts_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "low_stock_alerts" ADD CONSTRAINT "low_stock_alerts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "low_stock_alerts" ADD CONSTRAINT "low_stock_alerts_related_task_id_fkey" FOREIGN KEY ("related_task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "low_stock_alerts" ADD CONSTRAINT "low_stock_alerts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "low_stock_alerts" ADD CONSTRAINT "low_stock_alerts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_audiences" ADD CONSTRAINT "email_audiences_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_audiences" ADD CONSTRAINT "email_audiences_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_email_template_id_fkey" FOREIGN KEY ("email_template_id") REFERENCES "email_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_email_audience_id_fkey" FOREIGN KEY ("email_audience_id") REFERENCES "email_audiences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_materials" ADD CONSTRAINT "estimate_materials_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_materials" ADD CONSTRAINT "estimate_materials_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_materials" ADD CONSTRAINT "estimate_materials_estimate_item_id_fkey" FOREIGN KEY ("estimate_item_id") REFERENCES "estimate_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_materials" ADD CONSTRAINT "estimate_materials_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_items" ADD CONSTRAINT "work_order_items_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_items" ADD CONSTRAINT "work_order_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_items" ADD CONSTRAINT "work_order_items_assigned_contractor_id_fkey" FOREIGN KEY ("assigned_contractor_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_materials" ADD CONSTRAINT "service_materials_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_materials" ADD CONSTRAINT "service_materials_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_vendor_links" ADD CONSTRAINT "product_vendor_links_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_vendor_links" ADD CONSTRAINT "product_vendor_links_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_deliveries" ADD CONSTRAINT "invoice_deliveries_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_deliveries" ADD CONSTRAINT "invoice_deliveries_sent_by_user_id_fkey" FOREIGN KEY ("sent_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_refunds" ADD CONSTRAINT "invoice_refunds_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_refunds" ADD CONSTRAINT "invoice_refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_links" ADD CONSTRAINT "media_links_media_file_id_fkey" FOREIGN KEY ("media_file_id") REFERENCES "media_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_collection_items" ADD CONSTRAINT "media_collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "media_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_collection_items" ADD CONSTRAINT "media_collection_items_media_file_id_fkey" FOREIGN KEY ("media_file_id") REFERENCES "media_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowVersion" ADD CONSTRAINT "WorkflowVersion_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExport" ADD CONSTRAINT "WorkflowExport_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
