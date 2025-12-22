
// app/api/notes/bulk-delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { bulkDeleteNotes } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { noteIds } = await request.json();
  if (!Array.isArray(noteIds) || noteIds.length === 0) {
    return NextResponse.json({ error: "Invalid noteIds" }, { status: 400 });
  }
  
  await bulkDeleteNotes(userId, noteIds);
  return NextResponse.json({ success: true });
}