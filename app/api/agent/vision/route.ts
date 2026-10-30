import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { authenticateAgentRequest } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { analyzeScreenWithGemini } from "@/lib/vision-service";
import { publishEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let organizationId: string | null = null;
    let deviceId: string | null = null;

    // Check user session
    const session = await getSession(req);
    if (session?.organizationId) {
      organizationId = session.organizationId;
    } else {
      // Check device authorization
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
    const { imageBase64, mimeType = "image/png", focusWindow, prompt } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 is required" },
        { status: 400 }
      );
    }

    // Perform multimodal Gemini vision analysis
    const result = await analyzeScreenWithGemini(
      imageBase64,
      mimeType,
      focusWindow,
      prompt
    );

    // Save session to database
    const visionSession = await prisma.visionSession.create({
      data: {
        organizationId,
        deviceId,
        title: result.title,
        ocrText: result.ocrText,
        analysis: result.analysis,
        status: "ANALYZED",
        metadataJson: JSON.stringify(result.metadata),
      },
    });

    // Publish real-time event to SSE listeners
    await publishEvent(organizationId, "VISION_ANALYZED", {
      sessionId: visionSession.id,
      title: visionSession.title,
      focusWindow: focusWindow || "Desktop Screen",
      createdAt: visionSession.createdAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      session: {
        id: visionSession.id,
        title: visionSession.title,
        ocrText: visionSession.ocrText,
        analysis: visionSession.analysis,
        status: visionSession.status,
        createdAt: visionSession.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error("Vision processing error:", error);
    return NextResponse.json(
      {
        error: "Failed to process visual capture",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

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

    const sessions = await prisma.visionSession.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        device: {
          select: {
            deviceName: true,
            platform: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Failed to list vision sessions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
