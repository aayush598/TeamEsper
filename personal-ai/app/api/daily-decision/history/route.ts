// app/api/daily-decision/history/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDailyQuestionHistory } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const history = await getDailyQuestionHistory(userId);

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Get history error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to fetch history", details: message },
      { status: 500 }
    );
  }
}