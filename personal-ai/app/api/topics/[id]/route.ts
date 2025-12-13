import { NextRequest, NextResponse } from "next/server";
import { deleteTopic } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

type Params = {
  params: { id: string };
};

export async function DELETE(
  _req: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  try {
    await auth.protect();
    await deleteTopic(params.id);
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
