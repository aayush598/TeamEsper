CREATE TABLE "daily_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text NOT NULL,
	"prompt_used" text NOT NULL,
	"user_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prompts" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "question_generations" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "topics" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "daily_questions_user_idx" ON "daily_questions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "daily_questions_created_at_idx" ON "daily_questions" USING btree ("created_at");