import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  pgTable,
  serial,
  text,
  timestamp,
  index,
  json,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { eq, desc, and, gte, sql, inArray } from "drizzle-orm";

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
/* NEW: NEWS ARTICLES SCHEMA */
/* ------------------------------------------------------------------ */


export const newsArticles = pgTable(
  "news_articles",
  {
    id: serial("id").primaryKey(),
    
    // Article Info
    title: text("title").notNull(),
    description: text("description"),
    content: text("content"),
    url: text("url").notNull().unique(),
    imageUrl: text("image_url"),
    
    // Metadata
    category: text("category").notNull(), // 'tech' or 'general'
    source: text("source").notNull(), // 'techcrunch' or 'wired'
    author: text("author"),
    publishedAt: timestamp("published_at"),
    
    // Scraping metadata
    scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  },
  (t) => ({
    categoryIdx: index("news_category_idx").on(t.category),
    sourceIdx: index("news_source_idx").on(t.source),
    scrapedAtIdx: index("news_scraped_at_idx").on(t.scrapedAt),
    urlIdx: index("news_url_idx").on(t.url),
  })
);

export const userNewsReadStatus = pgTable(
  "user_news_read_status",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    articleId: serial("article_id").notNull().references(() => newsArticles.id, { onDelete: "cascade" }),
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userArticleIdx: index("user_article_idx").on(t.userId, t.articleId),
    userIdx: index("user_news_idx").on(t.userId),
  })
);

/* ------------------------------------------------------------------ */
/* NEWS ARTICLE FUNCTIONS */
/* ------------------------------------------------------------------ */

export interface NewsArticle {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  imageUrl: string | null;
  category: string;
  source: string;
  author: string | null;
  publishedAt: Date | null;
  scrapedAt: Date;
  lastUpdated: Date;
  isRead?: boolean;
}

export async function insertNewsArticles(articles: Array<{
  title: string;
  description?: string;
  content?: string;
  url: string;
  imageUrl?: string;
  category: string;
  source: string;
  author?: string;
  publishedAt?: Date;
}>) {
  const results = [];
  
  for (const article of articles) {
    const existing = await db
      .select()
      .from(newsArticles)
      .where(eq(newsArticles.url, article.url))
      .limit(1);
    
    if (existing.length === 0) {
      const result = await db
        .insert(newsArticles)
        .values(article)
        .returning();
      
      results.push(result[0]);
    } else {
      results.push(existing[0]);
    }
  }
  
  return results;
}

export async function getNewsArticles(filters?: {
  category?: string;
  source?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  let query = db.select().from(newsArticles);
  
  const conditions = [];
  
  if (filters?.category) {
    conditions.push(eq(newsArticles.category, filters.category));
  }
  
  if (filters?.source) {
    conditions.push(eq(newsArticles.source, filters.source));
  }
  
  if (filters?.startDate) {
    conditions.push(gte(newsArticles.scrapedAt, filters.startDate));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query
    .orderBy(desc(newsArticles.scrapedAt))
    .limit(filters?.limit || 100);
}

export async function getNewsWithReadStatus(userId: string, filters?: {
  category?: string;
  source?: string;
  startDate?: Date;
  isRead?: boolean;
  limit?: number;
}) {
  const conditions = [];
  
  if (filters?.category) {
    conditions.push(eq(newsArticles.category, filters.category));
  }
  
  if (filters?.source) {
    conditions.push(eq(newsArticles.source, filters.source));
  }
  
  if (filters?.startDate) {
    conditions.push(gte(newsArticles.scrapedAt, filters.startDate));
  }
  
  const articles = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      description: newsArticles.description,
      content: newsArticles.content,
      url: newsArticles.url,
      imageUrl: newsArticles.imageUrl,
      category: newsArticles.category,
      source: newsArticles.source,
      author: newsArticles.author,
      publishedAt: newsArticles.publishedAt,
      scrapedAt: newsArticles.scrapedAt,
      lastUpdated: newsArticles.lastUpdated,
      isRead: userNewsReadStatus.isRead,
    })
    .from(newsArticles)
    .leftJoin(
      userNewsReadStatus,
      and(
        eq(userNewsReadStatus.articleId, newsArticles.id),
        eq(userNewsReadStatus.userId, userId)
      )
    )
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(newsArticles.scrapedAt))
    .limit(filters?.limit || 100);
  
  // Filter by read status if specified
  if (filters?.isRead !== undefined) {
    return articles.filter(a => (a.isRead || false) === filters.isRead);
  }
  
  return articles;
}

export async function markArticleAsRead(userId: string, articleId: number) {
  const existing = await db
    .select()
    .from(userNewsReadStatus)
    .where(
      and(
        eq(userNewsReadStatus.userId, userId),
        eq(userNewsReadStatus.articleId, articleId)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    return db
      .update(userNewsReadStatus)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(userNewsReadStatus.id, existing[0].id))
      .returning();
  } else {
    return db
      .insert(userNewsReadStatus)
      .values({
        userId,
        articleId,
        isRead: true,
        readAt: new Date(),
      })
      .returning();
  }
}

export async function deleteOldNews(daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  await db
    .delete(newsArticles)
    .where(gte(newsArticles.scrapedAt, cutoffDate));
}

// Keep all your existing functions below
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


/* ------------------------------------------------------------------ */
/* TASKS (TIME MANAGEMENT) */
/* ------------------------------------------------------------------ */

// 👇 NEW: Tasks Table for Time Management
export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    description: text("description").default(""),
    duration: integer("duration").notNull(), // in minutes
    status: text("status").notNull().default("pending"), // pending, started, finished, quit
    date: text("date").notNull(), // YYYY-MM-DD format
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("tasks_user_idx").on(table.userId),
    userDateIdx: index("tasks_user_date_idx").on(table.userId, table.date),
    statusIdx: index("tasks_status_idx").on(table.status),
  })
);

/**
 * Get all tasks for a user on a specific date
 */
export async function getTasks(userId: string, date: string) {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.date, date)))
    .orderBy(tasks.createdAt);
}

/**
 * Get a specific task by ID
 */
export async function getTaskById(userId: string, id: number) {
  const result = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.id, id)));

  return result[0] ?? null;
}

/**
 * Insert a new task
 */
export async function insertTask(data: {
  userId: string;
  title: string;
  description: string;
  duration: number;
  date: string;
}) {
  const result = await db
    .insert(tasks)
    .values({
      userId: data.userId,
      title: data.title,
      description: data.description,
      duration: data.duration,
      status: "pending",
      date: data.date,
    })
    .returning();

  return result[0];
}

/**
 * Update a task
 */
export async function updateTask(
  userId: string,
  id: number,
  data: {
    title: string;
    description: string;
    duration: number;
    date: string;
  }
) {
  const result = await db
    .update(tasks)
    .set({
      title: data.title,
      description: data.description,
      duration: data.duration,
      date: data.date,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.userId, userId), eq(tasks.id, id)))
    .returning();

  return result[0] ?? null;
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  userId: string,
  id: number,
  status: "pending" | "started" | "finished" | "quit"
) {
  const result = await db
    .update(tasks)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.userId, userId), eq(tasks.id, id)))
    .returning();

  return result[0] ?? null;
}

/**
 * Delete a task
 */
export async function deleteTask(userId: string, id: number) {
  await db
    .delete(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.id, id)));

  return { success: true };
}

/**
 * Get task statistics for a user
 */
export async function getTaskStats(userId: string, date: string) {
  const result = await db
    .select({
      total: sql<number>`count(*)`,
      pending: sql<number>`count(*) filter (where ${tasks.status} = 'pending')`,
      started: sql<number>`count(*) filter (where ${tasks.status} = 'started')`,
      finished: sql<number>`count(*) filter (where ${tasks.status} = 'finished')`,
      quit: sql<number>`count(*) filter (where ${tasks.status} = 'quit')`,
      totalDuration: sql<number>`sum(${tasks.duration})`,
      finishedDuration: sql<number>`sum(${tasks.duration}) filter (where ${tasks.status} = 'finished')`,
    })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.date, date)));

  return result[0] ?? {
    total: 0,
    pending: 0,
    started: 0,
    finished: 0,
    quit: 0,
    totalDuration: 0,
    finishedDuration: 0,
  };
}

/**
 * Get tasks for a date range
 */
export async function getTasksInRange(
  userId: string,
  startDate: string,
  endDate: string
) {
  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        gte(tasks.date, startDate),
        sql`${tasks.date} <= ${endDate}`
      )
    )
    .orderBy(tasks.date, tasks.createdAt);
}

// Add to lib/db.ts (append these tables to your existing schema)

/* ------------------------------------------------------------------ */
/* CODE TYPING TEST TABLES */
/* ------------------------------------------------------------------ */

export const codeSnippets = pgTable(
  "code_snippets",
  {
    id: serial("id").primaryKey(),
    topic: text("topic").notNull(),
    language: text("language").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    code: text("code").notNull(),
    difficulty: text("difficulty").notNull(), // 'beginner', 'intermediate', 'advanced'
    lineCount: serial("line_count").notNull(),
    characterCount: serial("character_count").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    topicIdx: index("code_snippets_topic_idx").on(t.topic),
    languageIdx: index("code_snippets_language_idx").on(t.language),
    difficultyIdx: index("code_snippets_difficulty_idx").on(t.difficulty),
  })
);

export const typingTestResults = pgTable(
  "typing_test_results",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    snippetId: serial("snippet_id").notNull().references(() => codeSnippets.id, { onDelete: "cascade" }),
    
    // Test metrics
    wpm: serial("wpm").notNull(), // words per minute
    accuracy: serial("accuracy").notNull(), // percentage
    timeTaken: serial("time_taken").notNull(), // seconds
    totalCharacters: serial("total_characters").notNull(),
    correctCharacters: serial("correct_characters").notNull(),
    incorrectCharacters: serial("incorrect_characters").notNull(),
    
    // Additional stats
    topic: text("topic").notNull(),
    language: text("language").notNull(),
    difficulty: text("difficulty").notNull(),
    
    completedAt: timestamp("completed_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("typing_results_user_idx").on(t.userId),
    completedAtIdx: index("typing_results_completed_at_idx").on(t.completedAt),
  })
);

/* ------------------------------------------------------------------ */
/* CODE SNIPPET FUNCTIONS */
/* ------------------------------------------------------------------ */

export async function insertCodeSnippet(data: {
  topic: string;
  language: string;
  title: string;
  description: string;
  code: string;
  difficulty: string;
}) {
  const lineCount = data.code.split('\n').length;
  const characterCount = data.code.length;
  
  const result = await db
    .insert(codeSnippets)
    .values({
      ...data,
      lineCount,
      characterCount,
    })
    .returning();
  
  return result[0];
}

export async function getCodeSnippets(filters?: {
  topic?: string;
  language?: string;
  difficulty?: string;
  limit?: number;
}) {
  const conditions = [];
  
  if (filters?.topic) {
    conditions.push(eq(codeSnippets.topic, filters.topic));
  }
  
  if (filters?.language) {
    conditions.push(eq(codeSnippets.language, filters.language));
  }
  
  if (filters?.difficulty) {
    conditions.push(eq(codeSnippets.difficulty, filters.difficulty));
  }
  
  let query = db.select().from(codeSnippets);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query
    .orderBy(desc(codeSnippets.createdAt))
    .limit(filters?.limit || 50);
}

export async function getCodeSnippetById(id: number) {
  const result = await db
    .select()
    .from(codeSnippets)
    .where(eq(codeSnippets.id, id))
    .limit(1);
  
  return result[0] ?? null;
}

export async function getRandomCodeSnippet(filters?: {
  topic?: string;
  language?: string;
  difficulty?: string;
}) {
  const snippets = await getCodeSnippets(filters);
  
  if (snippets.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * snippets.length);
  return snippets[randomIndex];
}

/* ------------------------------------------------------------------ */
/* TYPING TEST RESULT FUNCTIONS */
/* ------------------------------------------------------------------ */

export async function insertTypingTestResult(data: {
  userId: string;
  snippetId: number;
  wpm: number;
  accuracy: number;
  timeTaken: number;
  totalCharacters: number;
  correctCharacters: number;
  incorrectCharacters: number;
  topic: string;
  language: string;
  difficulty: string;
}) {
  const result = await db
    .insert(typingTestResults)
    .values(data)
    .returning();
  
  return result[0];
}

export async function getTypingTestResults(userId: string, limit = 50) {
  return db
    .select()
    .from(typingTestResults)
    .where(eq(typingTestResults.userId, userId))
    .orderBy(desc(typingTestResults.completedAt))
    .limit(limit);
}

export async function getUserTypingStats(userId: string) {
  const results = await db
    .select()
    .from(typingTestResults)
    .where(eq(typingTestResults.userId, userId));
  
  if (results.length === 0) {
    return {
      totalTests: 0,
      averageWpm: 0,
      averageAccuracy: 0,
      bestWpm: 0,
      totalTime: 0,
    };
  }
  
  const totalTests = results.length;
  const averageWpm = Math.round(
    results.reduce((sum, r) => sum + r.wpm, 0) / totalTests
  );
  const averageAccuracy = Math.round(
    results.reduce((sum, r) => sum + r.accuracy, 0) / totalTests
  );
  const bestWpm = Math.max(...results.map(r => r.wpm));
  const totalTime = results.reduce((sum, r) => sum + r.timeTaken, 0);
  
  return {
    totalTests,
    averageWpm,
    averageAccuracy,
    bestWpm,
    totalTime,
  };
}

// Add to lib/db.ts - High-performance Notes System

/* ------------------------------------------------------------------ */
/* NOTES SYSTEM - OPTIMIZED FOR SPEED */
/* ------------------------------------------------------------------ */

export const noteFolders = pgTable(
  "note_folders",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    color: text("color").default("#6366f1"),
    icon: text("icon").default("📁"),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("note_folders_user_idx").on(t.userId),
    userPositionIdx: index("note_folders_user_position_idx").on(t.userId, t.position),
  })
);

export const notes = pgTable(
  "notes",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    folderId: serial("folder_id").references(() => noteFolders.id, { onDelete: "cascade" }),
    
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    
    // For quick preview without loading full content
    preview: text("preview").notNull().default(""),
    
    // Tags for filtering
    tags: json("tags").$type<string[]>().default([]),
    
    // Metadata
    isPinned: boolean("is_pinned").default(false),
    isFavorite: boolean("is_favorite").default(false),
    color: text("color"),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastViewedAt: timestamp("last_viewed_at"),
  },
  (t) => ({
    userIdx: index("notes_user_idx").on(t.userId),
    folderIdx: index("notes_folder_idx").on(t.folderId),
    pinnedIdx: index("notes_pinned_idx").on(t.isPinned),
    favoriteIdx: index("notes_favorite_idx").on(t.isFavorite),
    updatedAtIdx: index("notes_updated_at_idx").on(t.updatedAt),
    // Composite index for common queries
    userFolderIdx: index("notes_user_folder_idx").on(t.userId, t.folderId),
  })
);

/* ------------------------------------------------------------------ */
/* FOLDER FUNCTIONS - OPTIMIZED */
/* ------------------------------------------------------------------ */

export async function getFolders(userId: string) {
  return db
    .select()
    .from(noteFolders)
    .where(eq(noteFolders.userId, userId))
    .orderBy(noteFolders.position, noteFolders.name);
}

export async function insertFolder(data: {
  userId: string;
  name: string;
  color?: string;
  icon?: string;
}) {
  // Get max position for ordering
  const maxPos = await db
    .select({ max: noteFolders.position })
    .from(noteFolders)
    .where(eq(noteFolders.userId, data.userId));
  
  const position = (maxPos[0]?.max || 0) + 1;
  
  const result = await db
    .insert(noteFolders)
    .values({ ...data, position })
    .returning();
  
  return result[0];
}

export async function updateFolder(
  userId: string,
  folderId: number,
  data: { name?: string; color?: string; icon?: string }
) {
  const result = await db
    .update(noteFolders)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(noteFolders.id, folderId),
        eq(noteFolders.userId, userId)
      )
    )
    .returning();
  
  return result[0];
}

export async function deleteFolder(userId: string, folderId: number) {
  await db
    .delete(noteFolders)
    .where(
      and(
        eq(noteFolders.id, folderId),
        eq(noteFolders.userId, userId)
      )
    );
  
  return { success: true };
}

/* ------------------------------------------------------------------ */
/* NOTES FUNCTIONS - ULTRA FAST */
/* ------------------------------------------------------------------ */

// Get notes with minimal data for list view (fastest)
export async function getNotesPreview(
  userId: string,
  filters?: {
    folderId?: number;
    isPinned?: boolean;
    isFavorite?: boolean;
    search?: string;
  }
) {
  const conditions = [eq(notes.userId, userId)];
  
  if (filters?.folderId) {
    conditions.push(eq(notes.folderId, filters.folderId));
  }
  
  if (filters?.isPinned !== undefined) {
    conditions.push(eq(notes.isPinned, filters.isPinned));
  }
  
  if (filters?.isFavorite !== undefined) {
    conditions.push(eq(notes.isFavorite, filters.isFavorite));
  }
  
  let query = db
    .select({
      id: notes.id,
      title: notes.title,
      preview: notes.preview,
      folderId: notes.folderId,
      isPinned: notes.isPinned,
      isFavorite: notes.isFavorite,
      color: notes.color,
      tags: notes.tags,
      updatedAt: notes.updatedAt,
      createdAt: notes.createdAt,
    })
    .from(notes)
    .where(and(...conditions))
    .orderBy(
      desc(notes.isPinned),
      desc(notes.updatedAt)
    )
    .limit(100);
  
  const results = await query;
  
  // Client-side search for speed (if needed)
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    return results.filter(
      note =>
        note.title.toLowerCase().includes(searchLower) ||
        note.preview.toLowerCase().includes(searchLower)
    );
  }
  
  return results;
}

// Get single note with full content
export async function getNote(userId: string, noteId: number) {
  const result = await db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.id, noteId),
        eq(notes.userId, userId)
      )
    )
    .limit(1);
  
  if (result[0]) {
    // Update last viewed (async, don't wait)
    db.update(notes)
      .set({ lastViewedAt: new Date() })
      .where(eq(notes.id, noteId))
      .execute();
  }
  
  return result[0] || null;
}

// Create note (optimized)
export async function insertNote(data: {
  userId: string;
  folderId?: number;
  title: string;
  content?: string;
  tags?: string[];
  color?: string;
}) {
  const content = data.content || "";
  const preview = content.substring(0, 200); // First 200 chars for preview
  
  const result = await db
    .insert(notes)
    .values({
      userId: data.userId,
      folderId: data.folderId,
      title: data.title,
      content,
      preview,
      tags: data.tags || [],
      color: data.color,
    })
    .returning();
  
  return result[0];
}

// Update note (optimized - only update changed fields)
export async function updateNote(
  userId: string,
  noteId: number,
  data: {
    title?: string;
    content?: string;
    folderId?: number;
    tags?: string[];
    isPinned?: boolean;
    isFavorite?: boolean;
    color?: string;
  }
) {
  const updateData: any = {
    ...data,
    updatedAt: new Date(),
  };
  
  // Update preview if content changed
  if (data.content !== undefined) {
    updateData.preview = data.content.substring(0, 200);
  }
  
  const result = await db
    .update(notes)
    .set(updateData)
    .where(
      and(
        eq(notes.id, noteId),
        eq(notes.userId, userId)
      )
    )
    .returning();
  
  return result[0];
}

// Delete note
export async function deleteNote(userId: string, noteId: number) {
  await db
    .delete(notes)
    .where(
      and(
        eq(notes.id, noteId),
        eq(notes.userId, userId)
      )
    );
  
  return { success: true };
}

// Bulk delete notes
export async function bulkDeleteNotes(userId: string, noteIds: number[]) {
  await db
    .delete(notes)
    .where(
      and(
        eq(notes.userId, userId),
        inArray(notes.id, noteIds)
      )
    );
  
  return { success: true };
}

// Get note stats (cached on client)
export async function getNoteStats(userId: string) {
  const allNotes = await db
    .select({
      id: notes.id,
      folderId: notes.folderId,
      isPinned: notes.isPinned,
      isFavorite: notes.isFavorite,
    })
    .from(notes)
    .where(eq(notes.userId, userId));
  
  return {
    total: allNotes.length,
    pinned: allNotes.filter(n => n.isPinned).length,
    favorites: allNotes.filter(n => n.isFavorite).length,
    byFolder: allNotes.reduce((acc, note) => {
      const folderId = note.folderId || 0;
      acc[folderId] = (acc[folderId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>),
  };
}

// Search notes (fast preview search)
export async function searchNotes(userId: string, query: string) {
  const searchLower = query.toLowerCase();
  
  const results = await db
    .select({
      id: notes.id,
      title: notes.title,
      preview: notes.preview,
      folderId: notes.folderId,
      tags: notes.tags,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt))
    .limit(50);
  
  // Fast client-side filtering
  return results.filter(
    note =>
      note.title.toLowerCase().includes(searchLower) ||
      note.preview.toLowerCase().includes(searchLower) ||
      note.tags?.some(tag => tag.toLowerCase().includes(searchLower))
  );
}