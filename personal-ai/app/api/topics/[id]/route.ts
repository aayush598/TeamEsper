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
    await auth.protect();

    const { id } = await context.params;
    const topicId = Number(id);

    if (Number.isNaN(topicId)) {
      return NextResponse.json(
        { error: "Invalid topic id" },
        { status: 400 }
      );
    }

    await deleteTopic(topicId);

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
