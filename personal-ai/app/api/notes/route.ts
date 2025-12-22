
// app/api/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getNotesPreview, insertNote } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const searchParams = request.nextUrl.searchParams;
  const folderId = searchParams.get("folderId");
  const isPinned = searchParams.get("isPinned");
  const isFavorite = searchParams.get("isFavorite");
  const search = searchParams.get("search");
  
  const filters: any = {};
  if (folderId) filters.folderId = Number(folderId);
  if (isPinned !== null) filters.isPinned = isPinned === "true";
  if (isFavorite !== null) filters.isFavorite = isFavorite === "true";
  if (search) filters.search = search;
  
  const notes = await getNotesPreview(userId, filters);
  return NextResponse.json({ notes });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const data = await request.json();
  if (!data.title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
  
  const note = await insertNote({ ...data, userId });
  return NextResponse.json({ note });
}
