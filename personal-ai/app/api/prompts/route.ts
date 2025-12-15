import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrompts, insertPrompt } from "@/lib/db";

interface PromptBody {
  title: string;
  prompt: string;
}

/* ------------------------------------------------------------------ */
/* GET – Fetch prompts for authenticated user only */
/* ------------------------------------------------------------------ */

export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth(); // ✅ FIX

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const prompts = await getPrompts(userId); // ✅ FIX

    return NextResponse.json({ prompts });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to fetch prompts", details: message },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/* POST – Create prompt for authenticated user only */
/* ------------------------------------------------------------------ */

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { userId } = await auth(); // ✅ FIX

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as PromptBody;
    const { title, prompt } = body;

    if (!title?.trim() || !prompt?.trim()) {
      return NextResponse.json(
        { error: "Title and prompt are required" },
        { status: 400 }
      );
    }

    const result = await insertPrompt(
      userId,
      title.trim(),
      prompt.trim()
    ); // ✅ FIX

    return NextResponse.json({
      success: true,
      prompt: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to add prompt", details: message },
      { status: 500 }
    );
  }
}
