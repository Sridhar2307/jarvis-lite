import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { authenticateAgentRequest } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { publishEvent } from "@/lib/events";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let organizationId: string | null = null;
    const session = await getSession(req);
    if (session?.organizationId) {
      organizationId = session.organizationId;
    } else {
      const agentAuth = await authenticateAgentRequest(req);
      if (agentAuth?.organizationId) {
        organizationId = agentAuth.organizationId;
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.agentTask.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        steps: {
          orderBy: { stepNumber: "asc" },
        },
        device: {
          select: {
            deviceName: true,
            platform: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, task });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Failed to fetch task",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let organizationId: string | null = null;
    const session = await getSession(req);
    if (session?.organizationId) {
      organizationId = session.organizationId;
    } else {
      const agentAuth = await authenticateAgentRequest(req);
      if (agentAuth?.organizationId) {
        organizationId = agentAuth.organizationId;
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.agentTask.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: { steps: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, confirmed, result, error, stepUpdates } = body;

    const dataToUpdate: Record<string, unknown> = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (confirmed !== undefined) dataToUpdate.confirmed = Boolean(confirmed);
    if (result !== undefined) dataToUpdate.result = result;
    if (error !== undefined) dataToUpdate.error = error;

    // If confirmed is set to true and task was WAITING_CONFIRMATION, transition to QUEUED or RUNNING
    if (confirmed === true && task.status === "WAITING_CONFIRMATION") {
      dataToUpdate.status = "RUNNING";
    }

    const updatedTask = await prisma.agentTask.update({
      where: { id: task.id },
      data: dataToUpdate,
      include: {
        steps: {
          orderBy: { stepNumber: "asc" },
        },
      },
    });

    // Update specific step status if provided
    if (Array.isArray(stepUpdates)) {
      for (const stepUpdate of stepUpdates) {
        if (stepUpdate.stepId) {
          await prisma.agentTaskStep.update({
            where: { id: stepUpdate.stepId },
            data: {
              status: stepUpdate.status,
              outputJson: stepUpdate.output ? JSON.stringify(stepUpdate.output) : undefined,
              error: stepUpdate.error,
            },
          });
        }
      }
    }

    // Publish event
    const eventType =
      updatedTask.status === "COMPLETED"
        ? "TASK_COMPLETED"
        : updatedTask.status === "FAILED"
        ? "TASK_FAILED"
        : "TASK_UPDATED";

    await publishEvent(organizationId, eventType, {
      taskId: updatedTask.id,
      title: updatedTask.title,
      status: updatedTask.status,
      result: updatedTask.result,
      error: updatedTask.error,
    });

    return NextResponse.json({
      success: true,
      task: updatedTask,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Failed to update task",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
