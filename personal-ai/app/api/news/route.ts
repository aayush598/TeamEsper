import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getNewsWithReadStatus } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || undefined;
    const source = searchParams.get("source") || undefined;
    const isRead = searchParams.get("isRead");
    const startDate = searchParams.get("startDate");
    
    const filters: any = {
      category,
      source,
      limit: 100,
    };
    
    if (isRead !== null) {
      filters.isRead = isRead === "true";
    }
    
    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    
    const articles = await getNewsWithReadStatus(userId, filters);
    
    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Get news error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}