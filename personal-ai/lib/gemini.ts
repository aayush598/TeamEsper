import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

export async function generateQuestions(
  prompt: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });

    const result = await model.generateContent(prompt);
    const response = result.response;

    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    throw new Error(`Failed to generate questions: ${message}`);
  }
}

/**
 * Generate daily decision question using Gemini 2.5 Flash
 */
export async function generateDailyQuestion(prompt: string): Promise<string> {
  try {
    // Use Gemini 2.5 Flash model (lite version)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",  // Latest flash model
      generationConfig: {
        temperature: 0.9,  // Higher creativity for diverse questions
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate question with Gemini");
  }
}

/**
 * Ask AI about the generated question for clarifications
 */
export async function askAIAboutQuestion(contextPrompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.7,  // More focused responses for Q&A
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    const result = await model.generateContent(contextPrompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to get AI response");
  }
}

// lib/gemini.ts - Add this function to your existing file

/**
 * Generate production-ready code snippets for typing practice
 */
export async function generateCodeSnippet(
  topic: string,
  language: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<string> {
  try {
    const difficultyGuidelines = {
      beginner: '15-25 lines, basic concepts, simple logic',
      intermediate: '25-40 lines, moderate complexity, real-world patterns',
      advanced: '40-60 lines, complex logic, advanced patterns, optimization'
    };

    const prompt = `You are a senior software engineer creating production-ready code examples for typing practice and learning.

TOPIC: ${topic}
LANGUAGE: ${language}
DIFFICULTY: ${difficulty} (${difficultyGuidelines[difficulty]})

REQUIREMENTS:
1. Generate COMPLETE, FUNCTIONAL code or some part of any functioanlity partially
2. Code must be production-ready, scalable, and follow industry best practices
3. Include proper error handling, edge cases, and validation
4. Use meaningful variable names and clear logic
5. Add minimal but essential comments for complex sections
6. Follow language-specific conventions and idioms
7. Include proper imports/includes if needed
8. Code should demonstrate real-world problem solving
9. Must be standalone and executable
10. Target length: ${difficultyGuidelines[difficulty]}
11. Code must different everytime and cover advanced concept not basic concept
12. Code be generated for interviews questions that they may ask

EXAMPLES OF GOOD TOPICS:
- API request handler with error handling
- Binary search tree implementation
- React component with hooks and state management
- Database query optimization function
- Authentication middleware
- Data processing pipeline
- Algorithm implementation (sorting, searching)
- Design pattern implementation

DO NOT:
- Use placeholder comments like "// TODO" or "// Add logic here"
- Leave incomplete functions
- Skip error handling
- Use overly simple "hello world" style code
- Include explanatory text outside the code

OUTPUT:
Return ONLY the code, nothing else. No markdown formatting, no explanation, just pure code.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let code = response.text();

    // Clean up the response - remove markdown code blocks if present
    code = code.replace(/```[\w]*\n/g, '').replace(/```/g, '').trim();

    return code;
  } catch (error) {
    console.error("Gemini code generation error:", error);
    throw new Error("Failed to generate code snippet");
  }
}

/**
 * Generate a descriptive title for a code snippet
 */
export async function generateCodeTitle(
  code: string,
  topic: string,
  language: string
): Promise<{ title: string; description: string }> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 200,
      }
    });

    const prompt = `Analyze this ${language} code about ${topic} and provide:
1. A concise, professional title (5-8 words)
2. A brief description (10-15 words)

Code:
${code.substring(0, 500)}...

Respond in JSON format:
{
  "title": "...",
  "description": "..."
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean JSON response
    text = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(text);
    return {
      title: parsed.title || `${topic} Implementation`,
      description: parsed.description || `Professional ${language} code for ${topic}`
    };
  } catch (error) {
    console.error("Title generation error:", error);
    return {
      title: `${topic} Implementation in ${language}`,
      description: `Professional ${language} code demonstrating ${topic}`
    };
  }
}



/* ------------------------------------------------------------------ */
/* NEWS SEARCH WITH GOOGLE SEARCH GROUNDING */
/* ------------------------------------------------------------------ */

interface NewsResult {
  title: string;
  summary: string;
  url: string;
  publishedDate?: string;
  sourceName?: string;
}

/**
 * Search for latest news using Gemini with Google Search grounding
 */
function extractJsonArrays(text: string): NewsResult[] {
  const results: NewsResult[] = [];

  const matches = text.match(/\[[\s\S]*?\]/g);
  if (!matches) return results;

  for (const block of matches) {
    try {
      const parsed = JSON.parse(block);
      if (Array.isArray(parsed)) {
        results.push(...parsed);
      }
    } catch {
      // ignore invalid blocks
    }
  }

  return results;
}

export async function searchNewsWithGemini(
  category: string
): Promise<NewsResult[]> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });

    const groundingTool = {
      googleSearch: {},
    };

    const currentDate = new Date().toISOString().split('T')[0];

    const prompt = `Find the latest news articles about "${category}" from the past 24-48 hours (today is ${currentDate}).

For each article, provide:
1. Title: The headline of the article
2. Summary: A brief 2-3 sentence summary of the article content
3. URL: The direct link to the article
4. Published Date: When the article was published (extract from the source if available)
5. Source Name: The website/publication name

Return EXACTLY 10 recent, relevant news articles. Format your response as a JSON array:

[
  {
    "title": "Article headline",
    "summary": "Brief summary of the article content in 2-3 sentences",
    "url": "https://example.com/article",
    "publishedDate": "2024-12-21",
    "sourceName": "TechCrunch"
  }
]

IMPORTANT:
- Only include articles from the last 48 hours
- Ensure all URLs are valid and accessible
- Summaries should be informative but concise
- Return ONLY the JSON array, no other text
- No markdown formatting
- If publishedDate is not available, use today's date`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [groundingTool],
    });

    const response = result.response;
    let text = response.text();

    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();

    try {
      // Parse the JSON response
      const articles: NewsResult[] = extractJsonArrays(text);

      // Validate and filter results
      const validArticles = articles.filter(article => 
        article.title && 
        article.summary && 
        article.url &&
        article.url.startsWith('http')
      );

      console.log(`✓ Found ${validArticles.length} valid articles for "${category}"`);
      return validArticles;
    } catch (parseError) {
      console.error(`Failed to parse JSON for category "${category}":`, text);
      return [];
    }
  } catch (error) {
    console.error(`Error searching news for category "${category}":`, error);
    return [];
  }
}

/**
 * Fetch news for multiple categories in parallel
 */
export async function fetchNewsForCategories(
  categories: string[]
): Promise<Map<string, NewsResult[]>> {
  const results = new Map<string, NewsResult[]>();

  console.log(`Starting parallel fetch for ${categories.length} categories...`);

  // Fetch all categories in parallel for speed
  const promises = categories.map(async (category) => {
    const articles = await searchNewsWithGemini(category);
    return { category, articles };
  });

  const settled = await Promise.allSettled(promises);

  settled.forEach((result, index) => {
    const category = categories[index];
    if (result.status === 'fulfilled') {
      results.set(category, result.value.articles);
      console.log(`✓ Fetched ${result.value.articles.length} articles for "${category}"`);
    } else {
      console.error(`✗ Failed to fetch news for "${category}":`, result.reason);
      results.set(category, []);
    }
  });

  const totalArticles = Array.from(results.values()).reduce((sum, articles) => sum + articles.length, 0);
  console.log(`Total articles fetched: ${totalArticles}`);

  return results;
}

/**
 * Alternative: Search with more control over grounding metadata
 * This function extracts articles from Gemini's grounding chunks
 */
export async function searchNewsWithGroundingMetadata(
  category: string
): Promise<{
  articles: NewsResult[];
  searchQueries: string[];
  sources: Array<{ url: string; title: string }>;
}> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });

    const groundingTool = {
      googleSearch: {},
    };

    const currentDate = new Date().toISOString().split('T')[0];

    const prompt = `Find and summarize 10 latest news articles about "${category}" from the past 24-48 hours (today is ${currentDate}).

Provide a comprehensive overview of recent developments in this topic, with specific details about each article including titles, key points, and sources.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [groundingTool],
    });

    const response = result.response;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

    // Extract articles from grounding metadata
    const articles: NewsResult[] = [];
    const searchQueries: string[] = [];
    const sources: Array<{ url: string; title: string }> = [];

    if (groundingMetadata) {
      // Get search queries used
      if (groundingMetadata.webSearchQueries) {
        searchQueries.push(...groundingMetadata.webSearchQueries);
      }

      // Get source chunks
      if (groundingMetadata.groundingChunks) {
        groundingMetadata.groundingChunks.forEach((chunk: any, index: number) => {
          if (chunk.web) {
            sources.push({
              url: chunk.web.uri,
              title: chunk.web.title || `Source ${index + 1}`,
            });

            // Create article from chunk
            const responseText = response.text();
            const chunkText = responseText.substring(index * 200, (index + 1) * 200);

            articles.push({
              title: chunk.web.title || `${category} News Update`,
              summary: chunkText || 'Click to read more details from the source.',
              url: chunk.web.uri,
              sourceName: chunk.web.title,
            });
          }
        });
      }
    }

    console.log(`✓ Extracted ${articles.length} articles from grounding metadata for "${category}"`);
    return { articles, searchQueries, sources };
  } catch (error) {
    console.error(`Error searching with grounding metadata for "${category}":`, error);
    return { articles: [], searchQueries: [], sources: [] };
  }
}