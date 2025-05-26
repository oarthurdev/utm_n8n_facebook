
-- Create companies table
CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subdomain" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_subdomain_unique" UNIQUE("subdomain")
);

-- Add company_id columns to existing tables
ALTER TABLE "users" ADD COLUMN "company_id" uuid;
ALTER TABLE "workflows" ADD COLUMN "company_id" uuid;
ALTER TABLE "integrations" ADD COLUMN "company_id" uuid;
ALTER TABLE "events" ADD COLUMN "company_id" uuid;
ALTER TABLE "utm_data" ADD COLUMN "company_id" uuid;
ALTER TABLE "lead_events" ADD COLUMN "company_id" uuid;
ALTER TABLE "settings" ADD COLUMN "company_id" uuid;

-- Create foreign key constraints
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "events" ADD CONSTRAINT "events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "utm_data" ADD CONSTRAINT "utm_data_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "settings" ADD CONSTRAINT "settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;

-- Update constraints for settings table (remove unique constraint on key, add composite unique)
ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_key_unique";
ALTER TABLE "settings" ADD CONSTRAINT "settings_key_company_id_unique" UNIQUE("key", "company_id");

-- Update constraints for workflows table (remove unique constraint on workflow_id)
ALTER TABLE "workflows" DROP CONSTRAINT IF EXISTS "workflows_workflow_id_unique";

-- Update constraints for users table (remove unique constraint on username, add composite unique)
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_username_unique";
ALTER TABLE "users" ADD CONSTRAINT "users_username_company_id_unique" UNIQUE("username", "company_id");
