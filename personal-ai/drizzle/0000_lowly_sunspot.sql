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
CREATE TABLE "news_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"url" text NOT NULL,
	"category" text NOT NULL,
	"published_date" text,
	"source_name" text,
	"search_query" text NOT NULL,
	"grounding_chunk_index" serial NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_fetch_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"categories_count" serial NOT NULL,
	"articles_count" serial NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"prompt" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"topics" json NOT NULL,
	"prompt_template" text NOT NULL,
	"quiz_mode" text NOT NULL,
	"question_type" text NOT NULL,
	"num_questions" serial NOT NULL,
	"final_prompt" text NOT NULL,
	"output" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '',
	"duration" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
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
CREATE TABLE "user_news_read_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"article_id" serial NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "typing_test_results" ADD CONSTRAINT "typing_test_results_snippet_id_code_snippets_id_fk" FOREIGN KEY ("snippet_id") REFERENCES "public"."code_snippets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_news_read_status" ADD CONSTRAINT "user_news_read_status_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "code_snippets_topic_idx" ON "code_snippets" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "code_snippets_language_idx" ON "code_snippets" USING btree ("language");--> statement-breakpoint
CREATE INDEX "code_snippets_difficulty_idx" ON "code_snippets" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "daily_questions_user_idx" ON "daily_questions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "daily_questions_created_at_idx" ON "daily_questions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "news_articles_category_idx" ON "news_articles" USING btree ("category");--> statement-breakpoint
CREATE INDEX "news_articles_fetched_at_idx" ON "news_articles" USING btree ("fetched_at");--> statement-breakpoint
CREATE INDEX "news_articles_url_idx" ON "news_articles" USING btree ("url");--> statement-breakpoint
CREATE INDEX "news_categories_user_idx" ON "news_categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "news_fetch_log_user_idx" ON "news_fetch_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "news_fetch_log_fetched_at_idx" ON "news_fetch_log" USING btree ("fetched_at");--> statement-breakpoint
CREATE INDEX "prompts_user_idx" ON "prompts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "question_gen_user_idx" ON "question_generations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_user_idx" ON "tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_user_date_idx" ON "tasks" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "topics_user_idx" ON "topics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "typing_results_user_idx" ON "typing_test_results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "typing_results_completed_at_idx" ON "typing_test_results" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "user_news_read_status_article_idx" ON "user_news_read_status" USING btree ("user_id","article_id");--> statement-breakpoint
CREATE INDEX "user_news_read_status_user_idx" ON "user_news_read_status" USING btree ("user_id");