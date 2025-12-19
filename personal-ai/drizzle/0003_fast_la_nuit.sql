CREATE TABLE "news_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"content" text,
	"url" text NOT NULL,
	"image_url" text,
	"category" text NOT NULL,
	"source" text NOT NULL,
	"author" text,
	"published_at" timestamp,
	"scraped_at" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "news_articles_url_unique" UNIQUE("url")
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
ALTER TABLE "user_news_read_status" ADD CONSTRAINT "user_news_read_status_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "news_category_idx" ON "news_articles" USING btree ("category");--> statement-breakpoint
CREATE INDEX "news_source_idx" ON "news_articles" USING btree ("source");--> statement-breakpoint
CREATE INDEX "news_scraped_at_idx" ON "news_articles" USING btree ("scraped_at");--> statement-breakpoint
CREATE INDEX "news_url_idx" ON "news_articles" USING btree ("url");--> statement-breakpoint
CREATE INDEX "user_article_idx" ON "user_news_read_status" USING btree ("user_id","article_id");--> statement-breakpoint
CREATE INDEX "user_news_idx" ON "user_news_read_status" USING btree ("user_id");