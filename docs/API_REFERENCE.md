# JARVIS LITE + NEXORA API REFERENCE

## Base URL
- Local: `http://localhost:3000`
- Production: `https://your-domain.com`

---

## 1. Authentication & Session

### `POST /api/auth/login`
- **Body**: `{ "email": "admin@jarvislite.io", "password": "..." }`
- **Response**: Sets `jarvis_session` HTTP-only cookie. Returns `{ "success": true, "user": {...} }`.

### `POST /api/auth/register`
- **Body**: `{ "email": "...", "password": "...", "name": "...", "organizationName": "..." }`
- **Response**: Creates organization, owner membership, and signs session cookie.

### `GET /api/auth/me`
- **Response**: Current user, role (`OWNER`, `ADMIN`, `MANAGER`, `VIEWER`), and organization details.

### `POST /api/auth/logout`
- **Response**: Clears `jarvis_session` cookie.

---

## 2. Agent Device Pairing & Authentication

### `POST /api/agent/pair`
- **Flow A (Generate Code from Dashboard)**:
  - Header: Session Cookie
  - Body: `{}`
  - Response: `{ "success": true, "code": "JARVIS-948210", "expiresAt": "...", "expiresInSeconds": 600 }`
- **Flow B (Nexora Submits Code)**:
  - Body: `{ "code": "JARVIS-948210", "deviceName": "Nexora Workstation", "platform": "windows", "osVersion": "Windows 11" }`
  - Response: `{ "success": true, "deviceId": "...", "accessToken": "jvt_...", "refreshToken": "jvr_...", "expiresIn": 86400, "scopes": [...] }`

### `POST /api/agent/token/refresh`
- **Body**: `{ "deviceId": "...", "refreshToken": "jvr_..." }`
- **Response**: Rotates tokens and returns `{ "accessToken": "jvt_new...", "refreshToken": "jvr_new...", "expiresIn": 86400 }`.

### `GET /api/agent/devices`
- **Header**: Session Cookie or Bearer Device Token
- **Response**: List of paired devices with status, permissions, IP, and activity stats.

### `DELETE /api/agent/devices/[id]`
- **Header**: Session Cookie
- **Response**: Revokes device, purges stored credentials, and emits `DEVICE_REVOKED` outbox event.

### `GET /api/agent/health`
- **Header**: `Authorization: Bearer <accessToken>`
- **Response**: `{ "status": "healthy", "deviceId": "...", "deviceName": "...", "serverTime": "..." }`

---

## 3. Real-Time Events & Transactional Outbox

### `GET /api/events`
- **Headers**: `Accept: text/event-stream` + Session Cookie or Device Bearer Token
- **Protocol**: Server-Sent Events (SSE)
- **Streams**:
  - `METRIC_UPDATED`: Revenue or metric change
  - `TICKET_CREATED` / `TICKET_UPDATED`: Customer support events
  - `SOCIAL_POST_PUBLISHED`: Broadcast completed
  - `DEVICE_PAIRED` / `DEVICE_REVOKED`: Agent workstation status
  - `TASK_CREATED` / `TASK_COMPLETED`: Autonomous workflow events
  - `VISION_ANALYZED`: Multimodal screen capture results

---

## 4. Multimodal Screen Intelligence

### `POST /api/agent/vision`
- **Header**: Session Cookie or Device Bearer Token
- **Body**: `{ "imageBase64": "...", "mimeType": "image/png", "focusWindow": "...", "prompt": "..." }`
- **Response**: `{ "success": true, "session": { "id": "...", "title": "...", "ocrText": "...", "analysis": "...", "status": "ANALYZED" } }`

### `GET /api/agent/vision`
- **Response**: Lists recent visual screen capture sessions for the organization.

---

## 5. Autonomous Tasks & Workflows

### `GET /api/agent/tasks`
- **Response**: Lists queued, running, waiting, and completed multi-step tasks with steps and risk levels.

### `POST /api/agent/tasks`
- **Body**: `{ "title": "...", "goal": "...", "priority": "HIGH", "steps": [{ "toolName": "...", "parameters": {...} }] }`
- **Response**: Creates task. If any step is HIGH risk, transitions to `WAITING_CONFIRMATION` and notifies user.

### `PATCH /api/agent/tasks/[id]`
- **Body**: `{ "confirmed": true, "status": "RUNNING" }` or `{ "status": "COMPLETED", "result": "..." }`
- **Response**: Updates task execution and emits `TASK_COMPLETED` / `TASK_UPDATED` event.

---

## 6. Business Operations (Metrics, Support, Social, Ads)

- `GET /api/metrics` & `POST /api/metrics`
- `GET /api/support/tickets` & `POST /api/support/tickets`
- `GET /api/social/posts` & `POST /api/social/posts`
- `GET /api/meta/campaigns` & `POST /api/meta/campaigns`
- `GET /api/reports/briefing` (Morning executive brief)
- `GET /api/export/csv` (Full business data export)
- `GET /api/team` & `POST /api/team` (RBAC management)
