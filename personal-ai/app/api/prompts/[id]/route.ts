import { NextRequest, NextResponse } from "next/server";
import { getPromptById, deletePrompt } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _req: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    await auth.protect();
    const { id } = await context.params;
    const prompt = await getPromptById(id);
    return NextResponse.json({ prompt });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to fetch prompt", details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    await auth.protect();
    const { id } = await context.params;
    await deletePrompt(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to delete prompt", details: message },
      { status: 500 }
    );
  }
}
