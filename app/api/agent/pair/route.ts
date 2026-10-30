import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generatePairingCode,
  generateSecureToken,
  hashToken,
} from "@/lib/agent-auth";
import { publishEvent } from "@/lib/events";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // FLOW A: Nexora agent submits a pairing code to register itself
    if (body.code) {
      const code = String(body.code).trim().toUpperCase();
      const pairingRecord = await prisma.agentPairingCode.findUnique({
        where: { code },
      });

      if (!pairingRecord) {
        return NextResponse.json(
          { error: "Invalid pairing code" },
          { status: 400 }
        );
      }

      if (pairingRecord.used) {
        return NextResponse.json(
          { error: "Pairing code has already been used" },
          { status: 400 }
        );
      }

      if (new Date() > pairingRecord.expiresAt) {
        return NextResponse.json(
          { error: "Pairing code has expired. Please generate a new code." },
          { status: 400 }
        );
      }

      // Mark code as used
      await prisma.agentPairingCode.update({
        where: { id: pairingRecord.id },
        data: { used: true },
      });

      // Register or reactivate AgentDevice
      const deviceName = body.deviceName || "Nexora Desktop Agent";
      const platform = body.platform || "windows";
      const osVersion = body.osVersion || "Windows 11";
      const ipAddress =
        req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

      const device = await prisma.agentDevice.create({
        data: {
          organizationId: pairingRecord.organizationId,
          deviceName,
          platform,
          osVersion,
          ipAddress,
          status: "ONLINE",
          lastSeenAt: new Date(),
        },
      });

      // Generate access & refresh tokens
      const rawAccessToken = `jvt_${generateSecureToken()}`;
      const rawRefreshToken = `jvr_${generateSecureToken()}`;

      const tokenHash = hashToken(rawAccessToken);
      const refreshTokenHash = hashToken(rawRefreshToken);

      const scopes = [
        "metrics:read",
        "tickets:read",
        "tickets:write",
        "social:read",
        "social:write",
        "desktop:control",
        "vision:upload",
      ].join(",");

      // Access token expires in 24 hours
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.agentCredential.create({
        data: {
          deviceId: device.id,
          tokenHash,
          refreshTokenHash,
          scopes,
          expiresAt,
        },
      });

      // Create default device permissions
      const defaultScopes = scopes.split(",");
      for (const scope of defaultScopes) {
        await prisma.devicePermission.create({
          data: {
            deviceId: device.id,
            scope,
            granted: true,
          },
        });
      }

      // Publish real-time event
      await publishEvent(device.organizationId, "DEVICE_PAIRED", {
        deviceId: device.id,
        deviceName: device.deviceName,
        platform: device.platform,
        status: device.status,
      });

      return NextResponse.json({
        success: true,
        deviceId: device.id,
        organizationId: device.organizationId,
        deviceName: device.deviceName,
        accessToken: rawAccessToken,
        refreshToken: rawRefreshToken,
        expiresIn: 86400,
        scopes: defaultScopes,
      });
    }

    // FLOW B: Authenticated User generates a pairing code from the web dashboard
    const session = await getSession(req);
    if (!session?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const code = generatePairingCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.agentPairingCode.create({
      data: {
        code,
        organizationId: session.organizationId,
        userId: session.userId,
        expiresAt,
        used: false,
      },
    });

    return NextResponse.json({
      success: true,
      code,
      expiresAt: expiresAt.toISOString(),
      expiresInSeconds: 600,
      instructions: "Run Nexora and enter this pairing code to securely connect your desktop agent.",
    });
  } catch (error: unknown) {
    console.error("Device pairing error:", error);
    return NextResponse.json(
      {
        error: "Pairing process failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
