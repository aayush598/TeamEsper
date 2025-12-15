import { NextRequest, NextResponse } from "next/server";
import { deleteTopic } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  _req: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const topicId = Number(id);
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (Number.isNaN(topicId)) {
      return NextResponse.json(
        { error: "Invalid topic id" },
        { status: 400 }
      );
    }

    await deleteTopic(userId, topicId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to delete topic", details: message },
      { status: 500 }
    );
  }
}
