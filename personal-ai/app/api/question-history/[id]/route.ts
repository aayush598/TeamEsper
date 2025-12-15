import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getQuestionGenerationById, deleteQuestionGeneration } from "@/lib/db";

type Context = {
  params: Promise<{ id: string }>;
};

/* ------------------------------------------------------------------ */
/* GET single history item */
/* ------------------------------------------------------------------ */
export async function GET(
  _req: NextRequest,
  context: Context
): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params; // ✅ unwrap params

  const record = await getQuestionGenerationById(
    userId,
    Number(id)
  );

  if (!record) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ record });
}

/* ------------------------------------------------------------------ */
/* DELETE history item */
/* ------------------------------------------------------------------ */
export async function DELETE(
  _req: NextRequest,
  context: Context
): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  await deleteQuestionGeneration(userId, Number(id));

  return NextResponse.json({ success: true });
}
