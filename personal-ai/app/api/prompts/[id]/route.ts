import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPromptById, deletePrompt } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/* ------------------------------------------------------------------ */
/* GET – Fetch single prompt (user-owned) */
/* ------------------------------------------------------------------ */

export async function GET(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params; // ✅ await params
    const promptId = Number(id);

    if (Number.isNaN(promptId)) {
      return NextResponse.json(
        { error: "Invalid prompt id" },
        { status: 400 }
      );
    }

    const prompt = await getPromptById(userId, promptId);

    return NextResponse.json({ prompt });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to fetch prompt", details: message },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/* DELETE – Delete prompt (user-owned) */
/* ------------------------------------------------------------------ */

export async function DELETE(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params; // ✅ await params
    const promptId = Number(id);

    if (Number.isNaN(promptId)) {
      return NextResponse.json(
        { error: "Invalid prompt id" },
        { status: 400 }
      );
    }

    await deletePrompt(userId, promptId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to delete prompt", details: message },
      { status: 500 }
    );
  }
}
