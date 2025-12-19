// app/api/daily-decision/today/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getTodayQuestion } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const question = await getTodayQuestion(userId);

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Get today's question error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to fetch today's question", details: message },
      { status: 500 }
    );
  }
}