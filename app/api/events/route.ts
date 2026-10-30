import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { authenticateAgentRequest } from "@/lib/agent-auth";
import { subscribeToOrgEvents, SystemEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Check user session
  let organizationId: string | null = null;
  const session = await getSession(req);

  if (session?.organizationId) {
    organizationId = session.organizationId;
  } else {
    // Check device token
    const agentAuth = await authenticateAgentRequest(req);
    if (agentAuth?.organizationId) {
      organizationId = agentAuth.organizationId;
    }
  }

  if (!organizationId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | null = null;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connected event
      const initialMessage = `data: ${JSON.stringify({
        type: "CONNECTED",
        organizationId,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initialMessage));

      // 2. Register organization event listener
      unsubscribe = subscribeToOrgEvents(organizationId!, (event: SystemEvent) => {
        try {
          const sseChunk = `id: ${event.id}\nevent: ${event.eventType}\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(sseChunk));
        } catch (err) {
          console.error("Failed to enqueue SSE event:", err);
        }
      });

      // 3. Heartbeat ping every 15s to keep connection alive
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          // Stream might be closed
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      }, 15000);
    },
    cancel() {
      if (unsubscribe) unsubscribe();
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
