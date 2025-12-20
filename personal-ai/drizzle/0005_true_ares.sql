CREATE TABLE "code_snippets" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic" text NOT NULL,
	"language" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"code" text NOT NULL,
	"difficulty" text NOT NULL,
	"line_count" serial NOT NULL,
	"character_count" serial NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "typing_test_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"snippet_id" serial NOT NULL,
	"wpm" serial NOT NULL,
	"accuracy" serial NOT NULL,
	"time_taken" serial NOT NULL,
	"total_characters" serial NOT NULL,
	"correct_characters" serial NOT NULL,
	"incorrect_characters" serial NOT NULL,
	"topic" text NOT NULL,
	"language" text NOT NULL,
	"difficulty" text NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "typing_test_results" ADD CONSTRAINT "typing_test_results_snippet_id_code_snippets_id_fk" FOREIGN KEY ("snippet_id") REFERENCES "public"."code_snippets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "code_snippets_topic_idx" ON "code_snippets" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "code_snippets_language_idx" ON "code_snippets" USING btree ("language");--> statement-breakpoint
CREATE INDEX "code_snippets_difficulty_idx" ON "code_snippets" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "typing_results_user_idx" ON "typing_test_results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "typing_results_completed_at_idx" ON "typing_test_results" USING btree ("completed_at");