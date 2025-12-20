// app/api/tasks/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getTaskById, updateTask, deleteTask } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

interface UpdateTaskBody {
  title: string;
  description: string;
  duration: number;
  date: string;
}

/* ------------------------------------------------------------------ */
/* GET – Fetch single task */
/* ------------------------------------------------------------------ */

export async function GET(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const taskId = Number(id);

    if (Number.isNaN(taskId)) {
      return NextResponse.json(
        { error: "Invalid task id" },
        { status: 400 }
      );
    }

    const task = await getTaskById(userId, taskId);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to fetch task", details: message },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/* PUT – Update task */
/* ------------------------------------------------------------------ */

export async function PUT(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const taskId = Number(id);

    if (Number.isNaN(taskId)) {
      return NextResponse.json(
        { error: "Invalid task id" },
        { status: 400 }
      );
    }

    const body = (await req.json()) as UpdateTaskBody;
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

    const task = await updateTask(userId, taskId, {
      title: title.trim(),
      description: description?.trim() || "",
      duration,
      date,
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to update task", details: message },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/* DELETE – Delete task */
/* ------------------------------------------------------------------ */

export async function DELETE(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const taskId = Number(id);

    if (Number.isNaN(taskId)) {
      return NextResponse.json(
        { error: "Invalid task id" },
        { status: 400 }
      );
    }

    await deleteTask(userId, taskId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to delete task", details: message },
      { status: 500 }
    );
  }
}