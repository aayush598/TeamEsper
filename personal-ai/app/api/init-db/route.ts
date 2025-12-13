import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  try {
    const result = await initDb();
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to initialize database", details: message },
      { status: 500 }
    );
  }
}
