import { prisma } from "./prisma";

export type OutboxEventType =
  | "METRIC_UPDATED"
  | "TICKET_CREATED"
  | "TICKET_UPDATED"
  | "SOCIAL_POST_CREATED"
  | "SOCIAL_POST_PUBLISHED"
  | "DEVICE_PAIRED"
  | "DEVICE_REVOKED"
  | "DEVICE_HEARTBEAT"
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_COMPLETED"
  | "TASK_FAILED"
  | "VISION_ANALYZED"
  | "AI_COMMAND_EXECUTED";

export interface SystemEvent {
  id: string;
  organizationId: string;
  eventType: OutboxEventType | string;
  payload: Record<string, unknown>;
  createdAt: string;
}

type EventCallback = (event: SystemEvent) => void;

// In-memory subscribers registry mapped by organizationId
const subscribers = new Map<string, Set<EventCallback>>();

/**
 * Register an active SSE listener for an organization.
 * Returns an unregister cleanup function.
 */
export function subscribeToOrgEvents(
  organizationId: string,
  callback: EventCallback
): () => void {
  if (!subscribers.has(organizationId)) {
    subscribers.set(organizationId, new Set());
  }

  const orgSubscribers = subscribers.get(organizationId)!;
  orgSubscribers.add(callback);

  return () => {
    orgSubscribers.delete(callback);
    if (orgSubscribers.size === 0) {
      subscribers.delete(organizationId);
    }
  };
}

/**
 * Publish an event via Transactional Outbox.
 * Persists event to the database and broadcasts in real-time to active listeners.
 */
export async function publishEvent(
  organizationId: string,
  eventType: OutboxEventType | string,
  payload: Record<string, unknown>
): Promise<SystemEvent> {
  const payloadJson = JSON.stringify(payload);

  // 1. Persist to database OutboxEvent table
  const outboxRecord = await prisma.outboxEvent.create({
    data: {
      organizationId,
      eventType,
      payloadJson,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  const systemEvent: SystemEvent = {
    id: outboxRecord.id,
    organizationId,
    eventType,
    payload,
    createdAt: outboxRecord.createdAt.toISOString(),
  };

  // 2. Dispatch immediately to in-memory real-time SSE listeners
  const orgSubscribers = subscribers.get(organizationId);
  if (orgSubscribers && orgSubscribers.size > 0) {
    orgSubscribers.forEach((listener) => {
      try {
        listener(systemEvent);
      } catch (err) {
        console.error("Error dispatching event to subscriber:", err);
      }
    });
  }

  return systemEvent;
}
