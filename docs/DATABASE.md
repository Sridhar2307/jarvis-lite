# JARVIS LITE + NEXORA DATABASE ARCHITECTURE

## 1. Overview
- **ORM**: Prisma 6.19
- **Local Dev Engine**: SQLite (`prisma/dev.db`)
- **Production Engine**: PostgreSQL 16 (via Docker / Cloud SQL)
- **Total Models**: 26 models providing full relational integrity and cascade deletes.

---

## 2. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    ORGANIZATION ||--o{ USER_MEMBER : has
    USER ||--o{ USER_MEMBER : belongs_to
    ORGANIZATION ||--o{ REVENUE_RECORD : tracks
    ORGANIZATION ||--o{ BUSINESS_METRIC : calculates
    ORGANIZATION ||--o{ SOCIAL_ACCOUNT : owns
    ORGANIZATION ||--o{ SOCIAL_POST : schedules
    ORGANIZATION ||--o{ AD_ACCOUNT : manages
    AD_ACCOUNT ||--o{ AD_CAMPAIGN : runs
    ORGANIZATION ||--o{ SUBSCRIPTION_PLAN : offers
    SUBSCRIPTION_PLAN ||--o{ SUBSCRIBER : enrolls
    ORGANIZATION ||--o{ SUPPORT_TICKET : services
    SUPPORT_TICKET ||--o{ TICKET_NOTE : contains
    ORGANIZATION ||--o{ AGENT_DEVICE : pairs
    AGENT_DEVICE ||--o{ AGENT_CREDENTIAL : authenticates
    AGENT_DEVICE ||--o{ DEVICE_PERMISSION : grants
    AGENT_DEVICE ||--o{ AGENT_TASK : executes
    AGENT_TASK ||--o{ AGENT_TASK_STEP : steps
    ORGANIZATION ||--o{ VISION_SESSION : analyzes
    ORGANIZATION ||--o{ OUTBOX_EVENT : publishes
    ORGANIZATION ||--o{ AI_USAGE_LOG : logs
```

---

## 3. Core Models

### Agent Pairing & Devices
- `AgentDevice`: Physical desktop client paired with Jarvis Lite (`deviceName`, `platform`, `osVersion`, `ipAddress`, `status`, `lastSeenAt`).
- `AgentCredential`: Token authentication record storing SHA-256 hashes of access and refresh tokens.
- `AgentPairingCode`: Single-use 6-digit code with 10-minute expiry.
- `DevicePermission`: Specific granular permission scopes per device (`metrics:read`, `tickets:write`, `desktop:control`, `vision:upload`).

### Workflows & Vision
- `AgentTask`: Multi-step automated task record (`goal`, `status`, `priority`, `riskLevel`, `confirmed`, `result`).
- `AgentTaskStep`: Ordered execution steps with tool name, parameters, and status.
- `VisionSession`: Multimodal screen capture results, OCR summary, and Gemini analysis.
- `OutboxEvent`: Transactional outbox event record for real-time SSE event publishing.
- `AIUsageLog`: Tracks model token consumption, latency, and operational cost.

---

## 4. PostgreSQL Production Migration

To migrate from local SQLite to production PostgreSQL:
```bash
# 1. Start PostgreSQL container
docker-compose up -d postgres

# 2. Update .env to DATABASE_URL="postgresql://jarvis:jarvis_secure_pass_2026@localhost:5432/jarvis_lite?schema=public"

# 3. Push schema to PostgreSQL
npx prisma db push

# 4. Migrate existing SQLite data
npx tsx scripts/migrate-to-postgres.ts
```

