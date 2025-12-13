import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* DB CONNECTION */
/* ------------------------------------------------------------------ */

const queryClient = postgres(process.env.DATABASE_URL!, {
  max: 1, // important for serverless
  ssl: "require",
});

export const db = drizzle(queryClient);

/* ------------------------------------------------------------------ */
/* SCHEMA */
/* ------------------------------------------------------------------ */

export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const prompts = pgTable("prompts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/* ------------------------------------------------------------------ */
/* INIT DB (TABLES + DEFAULT PROMPT) */
/* ------------------------------------------------------------------ */

const DEFAULT_PROMPT_TITLE = "Default Quiz Prompt";

const DEFAULT_PROMPT = `You are a senior technical interviewer at a top product-based company.

Your task is to generate ONLY QUESTIONS (no answers, no hints, no explanations).

### STRICT RULES:
- Do NOT include answers or solutions.
- Do NOT include explanations.
- Do NOT generate beginner or definition-only questions.
- Assume the candidate has already studied the topic.
- Difficulty level: Intermediate to Advanced (Interview level).
- Questions must test:
  - Practical understanding
  - Edge cases
  - Trade-offs
  - Real-world scenarios
  - Problem-solving ability
- Avoid trivial, textbook, or memorization-based questions.

### TOPICS:
{topics}

### QUIZ MODE:
{quiz_mode}

### QUESTION TYPE:
{question_type}

### NUMBER OF QUESTIONS:
{num_questions}

### OUTPUT FORMAT:
- Numbered list
- Questions only
- No answers
- No headings
- No topic names in output`;

export async function initDb(): Promise<{ success: true }> {
  // Drizzle migrations should normally handle this,
  // but keeping this for backward compatibility
  const existing = await db
    .select()
    .from(prompts)
    .where(eq(prompts.title, DEFAULT_PROMPT_TITLE));

  if (existing.length === 0) {
    await db.insert(prompts).values({
      title: DEFAULT_PROMPT_TITLE,
      prompt: DEFAULT_PROMPT,
    });
  }

  return { success: true };
}

/* ------------------------------------------------------------------ */
/* TOPICS */
/* ------------------------------------------------------------------ */

export async function insertTopic(name: string) {
  const result = await db
    .insert(topics)
    .values({ name })
    .onConflictDoNothing()
    .returning({ id: topics.id, name: topics.name });

  return result[0] ?? null;
}

export async function getTopics() {
  return await db
    .select()
    .from(topics)
    .orderBy(topics.name);
}

export async function deleteTopic(id: number) {
  await db.delete(topics).where(eq(topics.id, id));
  return { success: true };
}

/* ------------------------------------------------------------------ */
/* PROMPTS */
/* ------------------------------------------------------------------ */

export async function insertPrompt(title: string, prompt: string) {
  const result = await db
    .insert(prompts)
    .values({ title, prompt })
    .returning({ id: prompts.id });

  return result[0];
}

export async function getPrompts() {
  return await db
    .select({
      id: prompts.id,
      title: prompts.title,
      createdAt: prompts.createdAt,
    })
    .from(prompts)
    .orderBy(prompts.createdAt);
}

export async function getPromptById(id: string | number) {
  const result = await db
    .select()
    .from(prompts)
    .where(eq(prompts.id, Number(id)));

  return result[0] ?? null;
}

export async function deletePrompt(id: string | number) {
  await db.delete(prompts).where(eq(prompts.id, Number(id)));
  return { success: true };
}
