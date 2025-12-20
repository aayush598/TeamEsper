
// app/api/typing/snippets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCodeSnippets, getRandomCodeSnippet } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const topic = searchParams.get("topic") || undefined;
    const language = searchParams.get("language") || undefined;
    const difficulty = searchParams.get("difficulty") || undefined;
    const random = searchParams.get("random") === "true";
    
    if (random) {
      const snippet = await getRandomCodeSnippet({ topic, language, difficulty });
      return NextResponse.json({ snippet });
    }
    
    const snippets = await getCodeSnippets({ topic, language, difficulty });
    return NextResponse.json({ snippets });
  } catch (error) {
    console.error("Get snippets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch snippets" },
      { status: 500 }
    );
  }
}
