import { NextRequest, NextResponse } from "next/server";
import { authenticateAgentRequest } from "@/lib/agent-auth";
import { publishEvent } from "@/lib/events";

export async function GET(req: NextRequest) {
  const auth = await authenticateAgentRequest(req);
  if (!auth) {
    return NextResponse.json({
      status: "unauthenticated",
      message: "Device requires authentication. Provide Authorization: Bearer <agent_token>",
      serverTime: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    status: "healthy",
    deviceId: auth.deviceId,
    organizationId: auth.organizationId,
    deviceName: auth.deviceName,
    scopes: auth.scopes,
    serverTime: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateAgentRequest(req);
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized device" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));

  // Publish heartbeat event if requested
  if (body.heartbeat) {
    await publishEvent(auth.organizationId, "DEVICE_HEARTBEAT", {
      deviceId: auth.deviceId,
      deviceName: auth.deviceName,
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    status: "ok",
    deviceId: auth.deviceId,
    organizationId: auth.organizationId,
    serverTime: new Date().toISOString(),
  });
}

