// app/api/tasks/[id]/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateTaskStatus } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

interface UpdateStatusBody {
  status: "pending" | "started" | "finished" | "quit";
}

/* ------------------------------------------------------------------ */
/* PATCH – Update task status */
/* ------------------------------------------------------------------ */

export async function PATCH(
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

    const body = (await req.json()) as UpdateStatusBody;
    const { status } = body;

    const validStatuses = ["pending", "started", "finished", "quit"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const task = await updateTaskStatus(userId, taskId, status);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to update task status", details: message },
      { status: 500 }
    );
  }
}