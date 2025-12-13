import { NextRequest, NextResponse } from "next/server";
import { getTopics, insertTopic } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

interface TopicBody {
  name: string;
}

export async function GET(): Promise<NextResponse> {
  try {
    await auth.protect();
    const topics = await getTopics();
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

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    await auth.protect();

    const body = (await request.json()) as TopicBody;

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Topic name is required" },
        { status: 400 }
      );
    }

    const result = await insertTopic(body.name.trim());
    return NextResponse.json({ success: true, topic: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to add topic", details: message },
      { status: 500 }
    );
  }
}
