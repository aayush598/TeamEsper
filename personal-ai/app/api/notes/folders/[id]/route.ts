
// app/api/notes/folders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateFolder, deleteFolder } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Context) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id } = await context.params;
  const data = await req.json();
  
  const folder = await updateFolder(userId, Number(id), data);
  return NextResponse.json({ folder });
}

export async function DELETE(_req: NextRequest, context: Context) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id } = await context.params;
  await deleteFolder(userId, Number(id));
  return NextResponse.json({ success: true });
}
