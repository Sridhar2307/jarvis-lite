# Jarvis Lite + Nexora: Complete Architectural Audit (Phase Zero)

**Audit Date:** 2026-10-30  
**Audit Scope:** Full repository inspection (Next.js 14 Web Command Center + Embedded Python Nexora Multimodal Voice Agent)  
**Lead Architects:** Principal Software Architect & Senior Systems Engineering Team

---

## 1. Executive Summary

Jarvis Lite and Nexora represent two complementary halves of a modern AI-powered enterprise operating system:
1. **Jarvis Lite** operates as the **Executive Business Brain**, handling real relational business metrics, financial transaction records, multi-platform social queues, ad spend / blended ROAS tracking, customer support ticketing, multi-tenant RBAC, and executive data exports.
2. **Nexora** operates as the **Desktop & Multimodal Voice Brain**, handling microphone capture, real-time Gemini streaming, speech synthesis, Windows OS manipulation (mouse, keyboard, window focus), screen inspection, and autonomous desktop task execution.

Prior to this engineering pass, both projects co-existed with basic REST endpoints connecting them, but lacked:
- Cryptographic device pairing and machine-to-machine (M2M) authentication.
- Real-time event propagation (Server-Sent Events / WebSockets) from Python actions to the Next.js React UI.
- Headless daemon execution mode for background Windows service operation without the Tkinter GUI.
- Enterprise permission boundaries separating low-risk actions from destructive OS commands.
- Unified multimodal screenshot ingestion and visual AI debugging.

---

## 2. Complete Repository Audit & Findings Matrix

| Finding ID | Component | Description & Current State | Classification | Recommended Action |
|---|---|---|---|---|
| **SEC-01** | Device Auth | Nexora REST bridge (`jarvis_bridge.py`) makes unauthenticated local calls to Next.js routes. | **CRITICAL** | Implement pairing code handshake (`/api/agent/pair`), token hashing, and device-scoped RBAC permissions. |
| **EVT-01** | Event Layer | When Nexora creates a ticket or schedules a post, the web dashboard requires a manual reload to reflect changes. | **HIGH** | Build a real-time Server-Sent Events (SSE) event gateway (`/api/events`) with a Transactional Outbox. |
| **VOI-01** | Voice Engine | Web browser uses Web Speech API while Python uses Gemini Live audio streaming; no headless daemon socket bridge. | **HIGH** | Implement local WebSocket audio bridge (`nexora/services/websocket_server.py`) and unified voice HUD. |
| **MOD-01** | Nexora Daemon | Nexora currently requires the Tkinter GUI thread to run; cannot run as a headless background daemon or tray icon. | **HIGH** | Add `--headless`, `--gui`, `--tray`, and `--debug` execution flags with decoupled asynchronous event loop. |
| **VIS-01** | Vision / OCR | Screen capture exists in Python (`screen_processor.py`) but has no API ingestion or private storage in Jarvis Lite. | **MEDIUM** | Implement `/api/agent/vision` endpoints with OCR and visual AI analysis history. |
| **DB-01** | Prisma Models | Database lacks formal schemas for paired devices, task checkpoints, vision sessions, and outbox events. | **HIGH** | Expand Prisma schema with `AgentDevice`, `AgentCredential`, `AgentPairingCode`, `AgentTask`, `VisionSession`, `OutboxEvent`. |
| **DEV-01** | Orchestration | User has to open two separate terminals to start Next.js and Python. | **MEDIUM** | Add `npm run dev:all` orchestrator script and unified `run-jarvis.bat`. |
| **SEC-02** | Risk Control | Desktop tools in Nexora do not distinguish between low-risk (e.g. read time) and high-risk actions (e.g. file deletion). | **CRITICAL** | Implement a deterministic Permission Engine with explicit confirmation thresholds. |

---

## 3. Existing Working Features (Preserved Intact)

1. **Authentication & Multi-Tenant Security**: Bcrypt password hashing (cost 12), `jose` Edge JWT session cookies (`jarvis_session`), multi-tenant database isolation on all queries (`where: { organizationId }`), and 1-Click Executive Demo Access.
2. **Business Metrics Monitoring**: Live calculation of MRR, ARR, MTD revenue, and active users with "+ Add Record" modal directly saving to `RevenueRecord` table.
3. **Social Media Broadcast Queue**: Platform-specific limits (X 280, IG 2200, LinkedIn 3000), Post actions ("Publish Now", "Draft", "Schedule"), expandable post cards, and channel modal with handshake tests.
4. **Meta Ads Manager**: Spend, Impressions, Clicks, CTR, ROAS, "Configure Meta Marketing" modal with credentials and test handshake.
5. **Subscriptions Management**: Tier breakdown, active subscribers, churn rate, "Configure Billing Integrations" modal with Stripe webhook secret setup & simulated webhook test.
6. **Customer Support Center**: Search filter, priority tags, status toggle (Open ↔ Resolved), "+ New Ticket" modal, and helpdesk integration manager (Zendesk / Intercom / Freshdesk).
7. **AI Command Center**: Real-time database grounding with Gemini 3.8 Flash & high-speed conversational NLP engine. Conversation history persists in DB.
8. **Executive Tooling**: One-click Executive CSV Exporter (`/api/export/csv`), Executive Morning Intelligence Briefing (`/api/reports/briefing`), and Team Members & RBAC Management Modal.
9. **Desktop OS Automation Tools**: `open_app`, `computer_control`, `computer_settings`, `file_controller`, `screen_processor`, `flight_finder`, `reminder`.

---

## 4. Prioritized Implementation Plan

- **Phase 1: Database Architecture Upgrade (Prisma Schema)**
  - Add `AgentDevice`, `AgentCredential`, `AgentPairingCode`, `AgentTask`, `AgentTaskStep`, `VisionSession`, `OutboxEvent`, `AIUsageLog`, `DevicePermission`.
  - Push schema and generate Prisma client.
- **Phase 2: Secure Device Pairing & Token Authentication**
  - Implement `/api/agent/pair`, `/api/agent/token/refresh`, `/api/agent/devices`, `/api/agent/health`.
  - Update `nexora/actions/jarvis_bridge.py` to authenticate using device service tokens.
- **Phase 3: Real-Time Event Gateway & Transactional Outbox**
  - Implement `/api/events` (SSE streaming endpoint).
  - Outbox publisher that broadcasts `ticket.created`, `revenue.created`, `social.post.created`, `agent.task.*`.
  - Connect React dashboard to listen for live SSE events and update state without page refresh.
- **Phase 4: Permission & Risk Registry**
  - Implement shared Tool & Risk Registry with Risk Levels (`LOW`, `MEDIUM`, `HIGH`) and user confirmation requirements.
- **Phase 5: Headless Daemon & WebSocket Bridge for Nexora**
  - Add `--headless` and `--gui` flags to `nexora/main.py`.
  - Implement WebSocket server in Nexora (`nexora/services/websocket_server.py`) for streaming audio and device commands.
- **Phase 6: Multimodal Screen Intelligence**
  - Implement `/api/agent/vision` endpoints and dashboard UI for visual inspection and AI analysis.
- **Phase 7: Autonomous Workflow Engine & Task Queue**
  - Implement `/api/agent/tasks` with checkpoint recovery, status tracking, and step-by-step logs.
- **Phase 8: Unified Launcher & Verification Suite**
  - Create `npm run dev:all` orchestrator script.
  - Run comprehensive test suite across web, pairing, events, and desktop tools.
  - Complete all documentation in `docs/`.
