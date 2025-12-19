// app/api/daily-decision/ask/route.ts

import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { askAIAboutQuestion } from "@/lib/gemini";

interface AskBody {
  question: string;
  answer: string;
  userQuery: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as AskBody;
    const { question, answer, userQuery } = body;

    if (!question || !answer || !userQuery) {
      return NextResponse.json(
        { error: "Question, answer, and user query are required" },
        { status: 400 }
      );
    }

    // Build context-aware prompt
    const contextPrompt = `You are a helpful life coach and mentor for Indian students.

Context:
- Original Question: ${question}
- Original Answer: ${answer}

User's Follow-up Question: ${userQuery}

Please provide a detailed, practical response considering the student's background:
- Final year BTech ECE student from tier-3 college
- Family income: <25k INR/month
- OBC category
- Located in tier-2/3 city in India

Keep your response conversational, practical, and specific to the Indian context.`;

    const response = await askAIAboutQuestion(contextPrompt);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Ask AI error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to get AI response", details: message },
      { status: 500 }
    );
  }
}