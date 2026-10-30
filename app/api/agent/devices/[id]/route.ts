import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishEvent } from "@/lib/events";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);
    if (!session?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const device = await prisma.agentDevice.findFirst({
      where: {
        id: params.id,
        organizationId: session.organizationId,
      },
      include: {
        permissions: true,
        tasks: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        visionSessions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, device });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Failed to fetch device",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);
    if (!session?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const device = await prisma.agentDevice.findFirst({
      where: {
        id: params.id,
        organizationId: session.organizationId,
      },
    });

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    // Revoke device status & delete credentials
    await prisma.agentDevice.update({
      where: { id: device.id },
      data: { status: "REVOKED" },
    });

    await prisma.agentCredential.deleteMany({
      where: { deviceId: device.id },
    });

    // Publish revoke event
    await publishEvent(session.organizationId, "DEVICE_REVOKED", {
      deviceId: device.id,
      deviceName: device.deviceName,
    });

    return NextResponse.json({
      success: true,
      message: `Device '${device.deviceName}' revoked successfully`,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Failed to revoke device",
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
    const session = await getSession(req);
    if (!session?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { permissions } = body; // Array of { scope: string, granted: boolean }

    const device = await prisma.agentDevice.findFirst({
      where: {
        id: params.id,
        organizationId: session.organizationId,
      },
    });

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    if (Array.isArray(permissions)) {
      for (const p of permissions) {
        if (p.scope) {
          await prisma.devicePermission.upsert({
            where: {
              deviceId_scope: {
                deviceId: device.id,
                scope: p.scope,
              },
            },
            create: {
              deviceId: device.id,
              scope: p.scope,
              granted: Boolean(p.granted),
            },
            update: {
              granted: Boolean(p.granted),
            },
          });
        }
      }
    }

    const updatedPermissions = await prisma.devicePermission.findMany({
      where: { deviceId: device.id },
    });

    return NextResponse.json({
      success: true,
      permissions: updatedPermissions,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Failed to update permissions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
