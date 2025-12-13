import { NextResponse, NextRequest } from "next/server";
import { generateQuestions } from "@/lib/gemini";
import { auth } from "@clerk/nextjs/server";

interface GenerateQuestionsBody {
  prompt: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await auth.protect();

    const body = (await request.json()) as GenerateQuestionsBody;
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const questions = await generateQuestions(prompt);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Generate questions error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to generate questions", details: message },
      { status: 500 }
    );
  }
}
