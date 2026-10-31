# JARVIS LITE + NEXORA SECURITY ARCHITECTURE

## 1. Multi-Tenant Organization Isolation

All database queries without exception are partitioned by `organizationId`. 
Data isolation is guaranteed through Prisma queries structured as:
```typescript
prisma.businessMetric.findMany({
  where: { organizationId: session.organizationId }
});
```
Organization identifiers supplied by client requests or desktop agents are never trusted. The `organizationId` is strictly derived from:
1. The cryptographically signed JWT payload in `jarvis_session` cookie (HS256 with server `AUTH_SECRET`).
2. The authenticated device record linked to the verified SHA-256 hash of the bearer token.

---

## 2. Agent Device Pairing & Token Hashing

1. **Short-Lived Single-Use Pairing Codes**:
   - Format: `JARVIS-XXXXXX` (cryptographically generated random integers).
   - Valid for 10 minutes only.
   - Enforces single-use: marked `used: true` immediately upon consumption.
2. **SHA-256 Token Storage**:
   - Raw tokens (`jvt_<64-hex-chars>`, `jvr_<64-hex-chars>`) are only provided once to the Nexora agent upon pairing.
   - The central database stores only the SHA-256 hash (`crypto.createHash("sha256").update(token).digest("hex")`).
   - If the database is compromised, plaintext tokens cannot be retrieved.
3. **Token Rotation**:
   - Access tokens expire after 24 hours.
   - Nexora auto-rotates tokens using `/api/agent/token/refresh` with hashed refresh tokens.
4. **Instant Revocation**:
   - Device revocation immediately deletes associated `AgentCredential` records and marks status as `REVOKED`.

---

## 3. Tool Execution Risk Engine

All tools registered in `lib/tool-registry.ts` are classified into 3 risk tiers:

| Tier | Tools | Behavior |
|------|-------|----------|
| **LOW** | `get_metrics`, `get_recent_tickets`, `get_social_overview`, `get_ad_campaigns`, `capture_screen` | Executed immediately with audit logging. |
| **MEDIUM** | `create_ticket`, `draft_social_post`, `open_application`, `type_text`, `press_hotkey` | Executed with visual notification in the dashboard. |
| **HIGH** | `publish_social_post`, `close_window`, `execute_shell_command`, `shutdown_system` | Requires explicit user confirmation via the Autonomous Task Inspector. |

---

## 4. Role-Based Access Control (RBAC)

Supported Roles:
- **OWNER**: Full administrative access, billing management, team invitations, and device revocation.
- **ADMIN**: Access to business operations, device pairing, and workflow execution.
- **MANAGER**: Read access to metrics and management of support tickets and social posts.
- **VIEWER**: Read-only dashboard access.

