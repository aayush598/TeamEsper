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
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "question_gen_user_idx" ON "question_generations" USING btree ("user_id");