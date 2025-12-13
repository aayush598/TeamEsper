import { NextRequest, NextResponse } from "next/server";
import { getPrompts, insertPrompt } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

interface PromptBody {
  title: string;
  prompt: string;
}

export async function GET(): Promise<NextResponse> {
  try {
    await auth.protect();
    const prompts = await getPrompts();
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

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    await auth.protect();

    const body = (await request.json()) as PromptBody;
    const { title, prompt } = body;

    if (!title || !prompt) {
      return NextResponse.json(
        { error: "Title and prompt are required" },
        { status: 400 }
      );
    }

    const result = await insertPrompt(title, prompt);
    return NextResponse.json({ success: true, prompt: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to add prompt", details: message },
      { status: 500 }
    );
  }
}
