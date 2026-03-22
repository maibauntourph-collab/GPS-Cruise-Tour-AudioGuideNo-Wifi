CREATE TABLE "cities" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"country" varchar NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"zoom" integer DEFAULT 14,
	"cruise_port" json,
	"remarks" text,
	"landing_content" json,
	"default_guide_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities_backup" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"country" varchar NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"zoom" integer DEFAULT 14,
	"cruise_port" json,
	"landing_content" json,
	"default_guide_id" varchar,
	"backup_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_earnings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"total_balance" double precision DEFAULT 0 NOT NULL,
	"total_earned" double precision DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_versions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_id" varchar NOT NULL,
	"following_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "follows_follower_id_following_id_unique" UNIQUE("follower_id","following_id")
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tour_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"phone" varchar,
	"email" varchar,
	"room_number" varchar,
	"status" varchar DEFAULT 'on-time' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landmark_audio" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"landmark_id" varchar NOT NULL,
	"language" varchar(10) NOT NULL,
	"audio_url" varchar NOT NULL,
	"duration" integer,
	"size_bytes" integer,
	"format" varchar(20) DEFAULT 'audio/mpeg',
	"checksum" varchar(64),
	"voice_id" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "landmark_audio_landmark_id_language_unique" UNIQUE("landmark_id","language")
);
--> statement-breakpoint
CREATE TABLE "landmark_guides" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"landmark_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"narration" text NOT NULL,
	"description" text,
	"detailed_description" text,
	"translations" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "landmark_guides_landmark_id_user_id_unique" UNIQUE("landmark_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "landmarks" (
	"id" varchar PRIMARY KEY NOT NULL,
	"city_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"radius" integer NOT NULL,
	"narration" text NOT NULL,
	"description" text,
	"category" varchar,
	"detailed_description" text,
	"photos" json,
	"historical_info" text,
	"year_built" varchar,
	"architect" varchar,
	"translations" json,
	"opening_hours" varchar,
	"price_range" varchar,
	"cuisine" varchar,
	"reservation_url" varchar,
	"phone_number" varchar,
	"menu_highlights" json,
	"restaurant_photos" json,
	"payment_methods" json,
	"is_premium" boolean DEFAULT false NOT NULL,
	"price" double precision,
	"target_nations" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landmarks_backup" (
	"id" varchar PRIMARY KEY NOT NULL,
	"city_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"radius" integer NOT NULL,
	"narration" text NOT NULL,
	"description" text,
	"category" varchar,
	"detailed_description" text,
	"photos" json,
	"historical_info" text,
	"year_built" varchar,
	"architect" varchar,
	"translations" json,
	"opening_hours" varchar,
	"price_range" varchar,
	"cuisine" varchar,
	"reservation_url" varchar,
	"phone_number" varchar,
	"menu_highlights" json,
	"restaurant_photos" json,
	"payment_methods" json,
	"is_premium" boolean DEFAULT false NOT NULL,
	"price" double precision,
	"backup_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"target_id" varchar NOT NULL,
	"target_type" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "likes_user_id_target_id_target_type_unique" UNIQUE("user_id","target_id","target_type")
);
--> statement-breakpoint
CREATE TABLE "marketing_contents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"landmark_id" varchar NOT NULL,
	"content" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_photos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_id" varchar NOT NULL,
	"user_id" varchar,
	"storage_url" varchar NOT NULL,
	"thumbnail_url" varchar,
	"latitude" double precision,
	"longitude" double precision,
	"taken_at" timestamp,
	"source" varchar(20) DEFAULT 'upload',
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_routes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"session_id" varchar,
	"country_code" varchar(10) NOT NULL,
	"city_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"total_distance" double precision,
	"total_duration" integer,
	"stops" json NOT NULL,
	"cover_photo_url" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" double precision NOT NULL,
	"period" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tour_schedules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tour_id" varchar NOT NULL,
	"time" varchar NOT NULL,
	"location" varchar NOT NULL,
	"duration" varchar,
	"notes" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"target_id" varchar NOT NULL,
	"amount" double precision NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"provider_data" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "update_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" varchar(20) NOT NULL,
	"total_countries" integer NOT NULL,
	"total_regions" integer NOT NULL,
	"new_countries" integer DEFAULT 0 NOT NULL,
	"new_regions" integer DEFAULT 0 NOT NULL,
	"exotic_tours_count" integer DEFAULT 0 NOT NULL,
	"exotic_eats_count" integer DEFAULT 0 NOT NULL,
	"exotic_spots_count" integer DEFAULT 0 NOT NULL,
	"exotic_shops_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "update_stats_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "user_identities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_user_id" varchar NOT NULL,
	"email" varchar,
	"display_name" varchar,
	"avatar" varchar,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"raw_profile" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_identities_provider_provider_user_id_unique" UNIQUE("provider","provider_user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"display_name" varchar,
	"avatar" varchar,
	"locale" varchar(10) DEFAULT 'en',
	"role" varchar(20) DEFAULT 'user',
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visited_landmarks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"landmark_id" varchar NOT NULL,
	"visited_at" timestamp DEFAULT now() NOT NULL,
	"session_id" varchar,
	CONSTRAINT "visited_landmarks_session_id_landmark_id_unique" UNIQUE("session_id","landmark_id")
);
--> statement-breakpoint
ALTER TABLE "creator_earnings" ADD CONSTRAINT "creator_earnings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landmark_guides" ADD CONSTRAINT "landmark_guides_landmark_id_landmarks_id_fk" FOREIGN KEY ("landmark_id") REFERENCES "public"."landmarks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landmark_guides" ADD CONSTRAINT "landmark_guides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_contents" ADD CONSTRAINT "marketing_contents_landmark_id_landmarks_id_fk" FOREIGN KEY ("landmark_id") REFERENCES "public"."landmarks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_photos" ADD CONSTRAINT "route_photos_route_id_saved_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."saved_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_photos" ADD CONSTRAINT "route_photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_routes" ADD CONSTRAINT "saved_routes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;