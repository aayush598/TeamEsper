import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getTopics, insertTopic } from "@/lib/db";

/* ------------------------------------------------------------------ */
/* GET – Fetch topics for authenticated user only */
/* ------------------------------------------------------------------ */

export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const topics = await getTopics(userId);

    return NextResponse.json({ topics });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to fetch topics", details: message },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/* POST – Create topic for authenticated user only */
/* ------------------------------------------------------------------ */

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const name = body?.name?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Topic name is required" },
        { status: 400 }
      );
    }

    const topic = await insertTopic(userId, name);

    return NextResponse.json({
      success: true,
      topic,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to create topic", details: message },
      { status: 500 }
    );
  }
}
