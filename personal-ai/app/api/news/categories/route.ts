import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getNewsCategories, insertNewsCategory } from "@/lib/db";

/**
 * GET /api/news/categories
 * Fetch all news categories for the authenticated user
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const categories = await getNewsCategories(userId);
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/news/categories
 * Create a new news category for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { name } = await request.json();
    
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }
    
    const category = await insertNewsCategory(userId, name.trim());
    
    if (!category) {
      return NextResponse.json(
        { error: "Category already exists or failed to create" },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ category });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}