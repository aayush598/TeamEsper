import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  pgTable,
  serial,
  text,
  timestamp,
  index,
  json,
} from "drizzle-orm/pg-core";
import { eq, desc, and, gte } from "drizzle-orm";

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
    createdAt: timestamp("created_at").defaultNow().notNull(),
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
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


/* ------------------------------------------------------------------ */
/* QUESTION GENERATION HISTORY */
/* ------------------------------------------------------------------ */

export const questionGenerations = pgTable(
  "question_generations",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),

    // Inputs
    topics: json("topics").$type<string[]>().notNull(),
    promptTemplate: text("prompt_template").notNull(),
    quizMode: text("quiz_mode").notNull(),
    questionType: text("question_type").notNull(),
    numQuestions: serial("num_questions").notNull(),

    finalPrompt: text("final_prompt").notNull(),

    // Output
    output: text("output").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("question_gen_user_idx").on(t.userId),
  })
);

/* ------------------------------------------------------------------ */
/* QUESTION HISTORY */
/* ------------------------------------------------------------------ */

export async function insertQuestionGeneration(data: {
  userId: string;
  topics: string[];
  promptTemplate: string;
  quizMode: string;
  questionType: string;
  numQuestions: number;
  finalPrompt: string;
  output: string;
}) {
  const result = await db
    .insert(questionGenerations)
    .values(data)
    .returning();

  return result[0];
}


export async function getQuestionGenerations(userId: string) {
  return db
    .select({
      id: questionGenerations.id,
      topics: questionGenerations.topics,
      quizMode: questionGenerations.quizMode,
      questionType: questionGenerations.questionType,
      numQuestions: questionGenerations.numQuestions,
      createdAt: questionGenerations.createdAt,
    })
    .from(questionGenerations)
    .where(eq(questionGenerations.userId, userId))
    .orderBy(desc(questionGenerations.createdAt)); // ✅ latest first
}

export async function getQuestionGenerationById(
  userId: string,
  id: number
) {
  const result = await db
    .select()
    .from(questionGenerations)
    .where(
      and(
        eq(questionGenerations.userId, userId),
        eq(questionGenerations.id, id) // ✅ FIX
      )
    );

  return result[0] ?? null;
}

export async function deleteQuestionGeneration(
  userId: string,
  id: number
) {
  await db
    .delete(questionGenerations)
    .where(
      and(
        eq(questionGenerations.userId, userId),
        eq(questionGenerations.id, id)
      )
    );

  return { success: true };
}



interface DailyQuestionInput {
  userId: string;
  question: string;
  answer: string;
  category: string;
  promptUsed: string;
}

interface DailyQuestionRecord {
  id: number;
  userId: string;
  question: string;
  answer: string;
  category: string;
  promptUsed: string;
  createdAt: Date;
  userNotes?: string | null;
}

/* ------------------------------------------------------------------ */
/* DAILY QUESTIONS */
/* ------------------------------------------------------------------ */

export const dailyQuestions = pgTable(
  "daily_questions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),

    question: text("question").notNull(),
    answer: text("answer").notNull(),
    category: text("category").notNull(),
    promptUsed: text("prompt_used").notNull(),

    userNotes: text("user_notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("daily_questions_user_idx").on(t.userId),
    createdAtIdx: index("daily_questions_created_at_idx").on(t.createdAt),
  })
);

export async function getTodayQuestion(
  userId: string
): Promise<DailyQuestionRecord | null> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = await db
    .select()
    .from(dailyQuestions)
    .where(
      and(
        eq(dailyQuestions.userId, userId),
        gte(dailyQuestions.createdAt, startOfDay)
      )
    )
    .orderBy(desc(dailyQuestions.createdAt))
    .limit(1);

  return result[0] ?? null;
}

export async function insertDailyQuestion(
  data: DailyQuestionInput
): Promise<DailyQuestionRecord> {
  const result = await db
    .insert(dailyQuestions)
    .values(data)
    .returning();

  return result[0];
}

export async function getDailyQuestionHistory(
  userId: string
): Promise<DailyQuestionRecord[]> {
  return db
    .select()
    .from(dailyQuestions)
    .where(eq(dailyQuestions.userId, userId))
    .orderBy(desc(dailyQuestions.createdAt))
    .limit(30);
}

export async function updateQuestionNotes(
  userId: string,
  questionId: number,
  notes: string
): Promise<void> {
  await db
    .update(dailyQuestions)
    .set({ userNotes: notes })
    .where(
      and(
        eq(dailyQuestions.id, questionId),
        eq(dailyQuestions.userId, userId)
      )
    );
}
