import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { scrapeAllNews } from "@/lib/scrapers";
import { insertNewsArticles } from "@/lib/db";

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const articles = await scrapeAllNews();
    
    if (articles.length === 0) {
      return NextResponse.json(
        { error: "No articles scraped" },
        { status: 500 }
      );
    }
    
    const savedArticles = await insertNewsArticles(articles);
    
    return NextResponse.json({
      success: true,
      count: savedArticles.length,
      articles: savedArticles,
    });
  } catch (error) {
    console.error("News scraping error:", error);
    return NextResponse.json(
      { error: "Failed to scrape news" },
      { status: 500 }
    );
  }
}