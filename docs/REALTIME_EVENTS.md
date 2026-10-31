# REAL-TIME TRANSACTIONAL OUTBOX & EVENT GATEWAY

## 1. Overview

To guarantee data consistency while providing instant zero-latency UI updates, JARVIS LITE + NEXORA implements the **Transactional Outbox Pattern** paired with **Server-Sent Events (SSE)**.

---

## 2. Architecture & Lifecycle

1. **Transactional Outbox Persistence**:
   - Whenever a business mutation occurs (e.g., ticket created, social post scheduled, metric updated, device paired), the backend writes an `OutboxEvent` record into the database with `status: "PUBLISHED"`.
   - Guaranteed audit trail in the primary database.
2. **In-Memory Organization-Scoped Event Bus**:
   - The event is immediately dispatched to all active subscribers filtered by `organizationId`.
3. **Server-Sent Events (SSE) Delivery**:
   - Connected browser clients listening on `/api/events` receive the event chunk within milliseconds.
   - The React dashboard state auto-refreshes the affected UI component without manual page reloads.

---

## 3. SSE Stream Specifications (`GET /api/events`)

- **Protocol**: HTTP/1.1 or HTTP/2 Server-Sent Events
- **MIME Type**: `text/event-stream; charset=utf-8`
- **Headers**:
  ```http
  Content-Type: text/event-stream
  Cache-Control: no-cache, no-transform
  Connection: keep-alive
  X-Accel-Buffering: no
  ```
- **Keep-Alive**: Pings `: ping\n\n` every 15 seconds to prevent intermediate proxy / firewall disconnects.
- **Client Auto-Reconnect**: Browser `EventSource` automatically re-establishes dropped connections with backoff.

