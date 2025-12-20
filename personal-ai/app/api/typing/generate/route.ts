// app/api/typing/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateCodeSnippet, generateCodeTitle } from "@/lib/gemini";
import { insertCodeSnippet } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { topic, language, difficulty } = await request.json();
    
    if (!topic || !language || !difficulty) {
      return NextResponse.json(
        { error: "Topic, language, and difficulty are required" },
        { status: 400 }
      );
    }
    
    // Generate code
    const code = await generateCodeSnippet(topic, language, difficulty);
    
    // Generate title and description
    const { title, description } = await generateCodeTitle(code, topic, language);
    
    // Save to database
    const snippet = await insertCodeSnippet({
      topic,
      language,
      title,
      description,
      code,
      difficulty,
    });
    
    return NextResponse.json({ snippet });
  } catch (error) {
    console.error("Code generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate code" },
      { status: 500 }
    );
  }
}
