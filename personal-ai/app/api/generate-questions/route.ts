import { NextResponse, NextRequest } from "next/server";
import { generateQuestions } from "@/lib/gemini";
import { auth } from "@clerk/nextjs/server";
import { insertQuestionGeneration } from "@/lib/db";

interface GenerateQuestionsBody {
  prompt: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      finalPrompt,
      topics,
      promptTemplate,
      quizMode,
      questionType,
      numQuestions,
    } = body;

    if (!finalPrompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const output = await generateQuestions(finalPrompt);
    await insertQuestionGeneration({
      userId,
      topics,
      promptTemplate,
      quizMode,
      questionType,
      numQuestions,
      finalPrompt,
      output,
    });

    return NextResponse.json({ questions: output });
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
