CREATE TABLE "crawler_visits" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid,
	"domain" text,
	"path" text,
	"crawler_name" text,
	"timestamp" timestamp
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text,
	"is_admin" boolean,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text
);
--> statement-breakpoint
CREATE TABLE "workspace_api_keys" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid,
	"api_key" text,
	"key_hash" text,
	"name" text
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"domain" text,
	"workspace_name" text,
	"is_primary" boolean
);
--> statement-breakpoint
ALTER TABLE "crawler_visits" ADD CONSTRAINT "crawler_visits_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_api_keys" ADD CONSTRAINT "workspace_api_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

-- Enable Row Level Security for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawler_visits ENABLE ROW LEVEL SECURITY;
