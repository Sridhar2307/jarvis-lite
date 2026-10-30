import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSecureToken, hashToken } from "@/lib/agent-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, refreshToken } = body;

    if (!deviceId || !refreshToken) {
      return NextResponse.json(
        { error: "deviceId and refreshToken are required" },
        { status: 400 }
      );
    }

    const refreshTokenHash = hashToken(refreshToken);

    const credential = await prisma.agentCredential.findFirst({
      where: {
        deviceId,
        refreshTokenHash,
      },
      include: {
        device: true,
      },
    });

    if (!credential || !credential.device || credential.device.status === "REVOKED") {
      return NextResponse.json(
        { error: "Invalid or revoked refresh token" },
        { status: 401 }
      );
    }

    // Generate rotated tokens
    const newAccessToken = `jvt_${generateSecureToken()}`;
    const newRefreshToken = `jvr_${generateSecureToken()}`;

    const newTokenHash = hashToken(newAccessToken);
    const newRefreshTokenHash = hashToken(newRefreshToken);

    const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.agentCredential.update({
      where: { id: credential.id },
      data: {
        tokenHash: newTokenHash,
        refreshTokenHash: newRefreshTokenHash,
        expiresAt: newExpiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 86400,
    });
  } catch (error: unknown) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      {
        error: "Failed to refresh token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
