// app/api/daily-decision/generate/route.ts

import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateDailyQuestion } from "@/lib/gemini";
import { insertDailyQuestion, getTodayQuestion } from "@/lib/db";

interface GenerateBody {
  prompt: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already generated a question today
    const existingQuestion = await getTodayQuestion(userId);
    if (existingQuestion) {
      return NextResponse.json(
        { error: "You can only generate one question per day" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as GenerateBody;
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Generate question using Gemini
    const result = await generateDailyQuestion(prompt);

    // Parse the JSON response
    let questionData;
    try {
      // Remove markdown code blocks if present
      const cleanedResult = result.replace(/```json\n?|\n?```/g, '').trim();
      questionData = JSON.parse(cleanedResult);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Save to database
    const savedQuestion = await insertDailyQuestion({
      userId,
      question: questionData.question,
      answer: questionData.answer,
      category: questionData.category,
      promptUsed: prompt,
    });

    return NextResponse.json({ question: savedQuestion });
  } catch (error) {
    console.error("Generate daily question error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to generate question", details: message },
      { status: 500 }
    );
  }
}