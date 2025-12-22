
// app/api/notes/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { searchNotes } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const query = request.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ notes: [] });
  
  const notes = await searchNotes(userId, query);
  return NextResponse.json({ notes });
}
