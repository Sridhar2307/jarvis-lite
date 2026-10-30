import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const devices = await prisma.agentDevice.findMany({
      where: {
        organizationId: session.organizationId,
      },
      include: {
        permissions: true,
        _count: {
          select: {
            tasks: true,
            visionSessions: true,
          },
        },
      },
      orderBy: {
        lastSeenAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      devices: devices.map((d) => ({
        id: d.id,
        deviceName: d.deviceName,
        platform: d.platform,
        osVersion: d.osVersion,
        ipAddress: d.ipAddress,
        status: d.status,
        lastSeenAt: d.lastSeenAt,
        createdAt: d.createdAt,
        permissions: d.permissions.map((p) => ({
          scope: p.scope,
          granted: p.granted,
        })),
        stats: {
          taskCount: d._count.tasks,
          visionSessionCount: d._count.visionSessions,
        },
      })),
    });
  } catch (error: unknown) {
    console.error("List devices error:", error);
    return NextResponse.json(
      {
        error: "Failed to list devices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
