import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { authenticateAgentRequest } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { publishEvent } from "@/lib/events";
import { validateToolExecution, RiskLevel } from "@/lib/tool-registry";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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

    const tasks = await prisma.agentTask.findMany({
      where: { organizationId },
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
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Failed to list tasks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let organizationId: string | null = null;
    let deviceId: string | null = null;

    const session = await getSession(req);
    if (session?.organizationId) {
      organizationId = session.organizationId;
    } else {
      const agentAuth = await authenticateAgentRequest(req);
      if (agentAuth?.organizationId) {
        organizationId = agentAuth.organizationId;
        deviceId = agentAuth.deviceId;
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      goal,
      priority = "MEDIUM",
      steps = [],
      confirmed = false,
    } = body;

    if (!title || !goal) {
      return NextResponse.json(
        { error: "Title and goal are required" },
        { status: 400 }
      );
    }

    // Determine highest risk level among steps
    let highestRisk: RiskLevel = "LOW";
    let requiresConfirmation = false;

    for (const step of steps) {
      const toolCheck = validateToolExecution(
        step.toolName,
        ["*"],
        confirmed
      );
      if (toolCheck.riskLevel === "HIGH") {
        highestRisk = "HIGH";
        if (!confirmed) {
          requiresConfirmation = true;
        }
      } else if (toolCheck.riskLevel === "MEDIUM" && highestRisk === "LOW") {
        highestRisk = "MEDIUM";
      }
    }

    const initialStatus = requiresConfirmation
      ? "WAITING_CONFIRMATION"
      : "QUEUED";

    // Create task
    const task = await prisma.agentTask.create({
      data: {
        organizationId,
        deviceId,
        title,
        goal,
        status: initialStatus,
        priority,
        riskLevel: highestRisk,
        confirmed,
        steps: {
          create: steps.map(
            (
              s: { toolName?: string; parameters?: Record<string, unknown> },
              idx: number
            ) => ({
              stepNumber: idx + 1,
              toolName: s.toolName || "system_action",
              parametersJson: JSON.stringify(s.parameters || {}),
              status: "PENDING",
            })
          ),
        },
      },
      include: {
        steps: true,
      },
    });

    // Publish event
    await publishEvent(organizationId, "TASK_CREATED", {
      taskId: task.id,
      title: task.title,
      goal: task.goal,
      status: task.status,
      riskLevel: task.riskLevel,
      stepCount: task.steps.length,
    });

    return NextResponse.json({
      success: true,
      task,
      requiresConfirmation,
    });
  } catch (error: unknown) {
    console.error("Task creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create task",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
