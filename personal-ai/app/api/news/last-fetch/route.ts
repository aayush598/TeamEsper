import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getLastNewsFetch } from "@/lib/db";

/**
 * GET /api/news/last-fetch
 * Get information about the last news fetch operation for the authenticated user
 * 
 * Returns:
 * - lastFetch: Object with fetch details or null if never fetched
 *   - id: Fetch log ID
 *   - fetchedAt: Timestamp of the fetch
 *   - categoriesCount: Number of categories processed
 *   - articlesCount: Number of articles fetched
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const lastFetch = await getLastNewsFetch(userId);
    
    return NextResponse.json({ 
      lastFetch,
      hasFetchedToday: lastFetch ? isToday(new Date(lastFetch.fetchedAt)) : false
    });
  } catch (error) {
    console.error("Get last fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch last fetch info" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to check if a date is today
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}