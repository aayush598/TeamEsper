import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { markArticleAsRead } from "@/lib/db";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _req: NextRequest,
  context: Context
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = await context.params;
    
    await markArticleAsRead(userId, Number(id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark as read error:", error);
    return NextResponse.json(
      { error: "Failed to mark as read" },
      { status: 500 }
    );
  }
}