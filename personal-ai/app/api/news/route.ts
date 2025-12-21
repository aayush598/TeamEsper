import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getNewsWithReadStatus } from "@/lib/db";

/**
 * GET /api/news
 * Fetch all news articles with read status for the authenticated user
 * 
 * Query Parameters:
 * - category: Filter by specific category (optional)
 * - isRead: Filter by read status - "true" or "false" (optional)
 * - startDate: Filter articles from this date onwards (ISO string) (optional)
 * 
 * Returns articles sorted with unread first, then by fetched date descending
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || undefined;
    const isRead = searchParams.get("isRead");
    const startDate = searchParams.get("startDate");
    
    const filters: any = {
      category,
      limit: 200,
    };
    
    if (isRead !== null && isRead !== undefined) {
      filters.isRead = isRead === "true";
    }
    
    if (startDate) {
      try {
        filters.startDate = new Date(startDate);
      } catch (error) {
        console.error("Invalid startDate:", startDate);
      }
    }
    
    const articles = await getNewsWithReadStatus(userId, filters);
    
    return NextResponse.json({ 
      articles,
      count: articles.length 
    });
  } catch (error) {
    console.error("Get news error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}