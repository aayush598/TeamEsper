// app/api/tasks/route.ts

import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getTasks, insertTask } from "@/lib/db";

interface CreateTaskBody {
  title: string;
  description: string;
  duration: number;
  date: string;
}

/* ------------------------------------------------------------------ */
/* GET – Fetch tasks for a specific date */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    const tasks = await getTasks(userId, date);

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Get tasks error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to fetch tasks", details: message },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/* POST – Create a new task */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateTaskBody;
    const { title, description, duration, date } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!duration || duration < 1) {
      return NextResponse.json(
        { error: "Valid duration is required" },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    const task = await insertTask({
      userId,
      title: title.trim(),
      description: description?.trim() || "",
      duration,
      date,
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Create task error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to create task", details: message },
      { status: 500 }
    );
  }
}