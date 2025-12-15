import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getQuestionGenerations } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const history = await getQuestionGenerations(userId);
  return NextResponse.json({ history });
}
