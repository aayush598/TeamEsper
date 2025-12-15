import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  pgTable,
  serial,
  text,
  timestamp,
  index,
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

export const topics = pgTable(
  "topics",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),   // 👈 NEW
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("topics_user_idx").on(table.userId),
  })
);

export const prompts = pgTable(
  "prompts",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),   // 👈 NEW
    title: text("title").notNull(),
    prompt: text("prompt").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("prompts_user_idx").on(table.userId),
  })
);


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


/* ------------------------------------------------------------------ */
/* TOPICS */
/* ------------------------------------------------------------------ */

export async function insertTopic(userId: string, name: string) {
  const result = await db
    .insert(topics)
    .values({ userId, name })
    .onConflictDoNothing()
    .returning();

  return result[0] ?? null;
}

export async function getTopics(userId: string) {
  return db
    .select()
    .from(topics)
    .where(eq(topics.userId, userId))
    .orderBy(topics.name);
}

export async function deleteTopic(userId: string, id: number) {
  await db
    .delete(topics)
    .where(
      eq(topics.userId, userId) // 👈 prevents deleting others’ data
    );

  return { success: true };
}


/* ------------------------------------------------------------------ */
/* PROMPTS */
/* ------------------------------------------------------------------ */

export async function insertPrompt(
  userId: string,
  title: string,
  prompt: string
) {
  const result = await db
    .insert(prompts)
    .values({ userId, title, prompt })
    .returning();

  return result[0];
}

export async function getPrompts(userId: string) {
  return db
    .select({
      id: prompts.id,
      title: prompts.title,
      createdAt: prompts.createdAt,
    })
    .from(prompts)
    .where(eq(prompts.userId, userId))
    .orderBy(prompts.createdAt);
}

export async function getPromptById(
  userId: string,
  id: number
) {
  const result = await db
    .select()
    .from(prompts)
    .where(
      eq(prompts.userId, userId)
    );

  return result[0] ?? null;
}

export async function deletePrompt(userId: string, id: number) {
  await db
    .delete(prompts)
    .where(
      eq(prompts.userId, userId)
    );

  return { success: true };
}
