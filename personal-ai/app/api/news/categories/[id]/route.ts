import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { deleteNewsCategory } from "@/lib/db";

type Context = {
  params: Promise<{ id: string }>;
};

/**
 * DELETE /api/news/categories/[id]
 * Delete a specific news category
 */
export async function DELETE(
  _req: NextRequest,
  context: Context
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = await context.params;
    
    const categoryId = Number(id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }
    
    await deleteNewsCategory(userId, categoryId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}