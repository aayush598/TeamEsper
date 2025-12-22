
// app/api/notes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getNote, updateNote, deleteNote } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: Context) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id } = await context.params;
  const note = await getNote(userId, Number(id));
  
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ note });
}

export async function PATCH(req: NextRequest, context: Context) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id } = await context.params;
  const data = await req.json();
  
  const note = await updateNote(userId, Number(id), data);
  return NextResponse.json({ note });
}

export async function DELETE(_req: NextRequest, context: Context) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id } = await context.params;
  await deleteNote(userId, Number(id));
  return NextResponse.json({ success: true });
}
