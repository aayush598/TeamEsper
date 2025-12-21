import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getNewsCategories, insertNewsArticles, insertNewsFetchLog } from "@/lib/db";
import { fetchNewsForCategories } from "@/lib/gemini";

/**
 * POST /api/news/fetch
 * Fetch latest news for all user categories using Gemini Search
 * 
 * This endpoint:
 * 1. Gets all user's news categories
 * 2. Fetches news for each category in parallel using Gemini
 * 3. Saves all articles to the database
 * 4. Logs the fetch operation
 */
export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log(`Starting news fetch for user: ${userId}`);
    
    // Get user's news categories
    const categories = await getNewsCategories(userId);
    
    if (categories.length === 0) {
      return NextResponse.json(
        { error: "No categories found. Please add categories first." },
        { status: 400 }
      );
    }
    
    console.log(`Fetching news for ${categories.length} categories:`, categories.map(c => c.name));
    
    const categoryNames = categories.map(c => c.name);
    
    // Fetch news for all categories in parallel using Gemini Search
    const newsMap = await fetchNewsForCategories(categoryNames);
    
    // Flatten and prepare articles for insertion
    const allArticles: any[] = [];
    
    newsMap.forEach((articles, category) => {
      articles.forEach((article) => {
        allArticles.push({
          title: article.title,
          summary: article.summary,
          url: article.url,
          category,
          publishedDate: article.publishedDate || new Date().toISOString().split('T')[0],
          sourceName: article.sourceName || 'Unknown Source',
          searchQuery: `latest ${category} news`,
        });
      });
    });
    
    if (allArticles.length === 0) {
      return NextResponse.json(
        { 
          error: "No articles found. Please try again or check your categories.",
          categories: categoryNames 
        },
        { status: 500 }
      );
    }
    
    console.log(`Saving ${allArticles.length} articles to database...`);
    
    // Insert all articles into the database
    const savedArticles = await insertNewsArticles(allArticles);
    
    console.log(`Successfully saved ${savedArticles.length} articles`);
    
    // Log the fetch operation
    await insertNewsFetchLog(userId, categories.length, savedArticles.length);
    
    return NextResponse.json({
      success: true,
      count: savedArticles.length,
      categories: categoryNames,
      articles: savedArticles,
      message: `Successfully fetched ${savedArticles.length} articles from ${categoryNames.length} categories`,
    });
  } catch (error) {
    console.error("News fetch error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { 
        error: "Failed to fetch news",
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}