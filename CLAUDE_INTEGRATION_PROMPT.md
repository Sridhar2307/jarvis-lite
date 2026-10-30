# MASTER PROMPT: JARVIS LITE + NEXORA UNIFIED ARCHITECTURE & UPGRADE ROADMAP

> **Instructions for use:** Copy and paste the entire text block below into **Claude** (Claude 3.5 Sonnet / Claude 3.7). It provides full technical context on both projects, explains how they are currently connected, details the architectural mechanics, and asks Claude to resolve technical doubts and design the next generation upgrades.

```markdown
You are a Principal Software Architect, Senior Full-Stack Next.js Specialist, and Systems Integration Engineer with expertise in Python desktop automation and multimodal real-time AI.

I have combined two distinct repositories into a single unified operating system:
1. **JARVIS LITE** (Next.js 14 App Router, TypeScript, Tailwind CSS, Prisma ORM, SQLite/PostgreSQL) — An Executive Command Center & Business Management Dashboard.
2. **NEXORA** (Python 3.10+, PyAudio, Google Gemini Live Bidirectional Audio, PyAutoGUI, Playwright, Tkinter HUD) — An Intelligent Multimodal Voice Assistant with Windows PC and OS automation capabilities.

I want you to analyze the **combined architecture**, evaluate how they are currently connected, resolve critical integration questions/doubts, and provide a concrete, step-by-step upgrade roadmap to make this a seamless, world-class enterprise hybrid platform.

---

## 1. THE COMBINED SYSTEM ARCHITECTURE

```
                                      ┌────────────────────────────────┐
                                      │      User Microphone & Voice   │
                                      └───────────────┬────────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
         ┌───────────────────────────┐                                 ┌───────────────────────────┐
         │     Jarvis Lite Web       │                                 │    Nexora Desktop Agent   │
         │ (Next.js 14 App Router)   │ ◄────── HTTP Bridge ──────────► │ (Python Multimodal Agent) │
         │   http://localhost:3000   │         (REST / JSON)           │   Gemini Live Audio API   │
         └─────────────┬─────────────┘                                 └─────────────┬─────────────┘
                       │                                                             │
                       ▼                                                             ▼
         ┌───────────────────────────┐                                 ┌───────────────────────────┐
         │ Prisma Relational DB      │                                 │ Native Windows Automation │
         │ • MRR, ARR & Revenue      │                                 │ • Mouse, Keyboard, Window │
         │ • Support Tickets (CRUD)  │                                 │ • Volume, Brightness, OS  │
         │ • Social Post Queue       │                                 │ • App Launcher & Files    │
         │ • Meta Ads ROAS & Spend   │                                 │ • Screen Vision AI        │
         │ • Team Members & RBAC     │                                 │ • Background Task Queue   │
         └───────────────────────────┘                                 └───────────────────────────┘
```

---

## 2. DETAILED SPECS OF BOTH SIDES

### SIDE A: JARVIS LITE (Web Operating System)
- **Framework:** Next.js 14.2 App Router (Server Components & dynamic route handlers).
- **Database:** Prisma ORM 6.19 with 17 relational models (`User`, `Organization`, `OrganizationMember`, `RevenueRecord`, `BusinessMetric`, `SocialPost`, `AdAccount`, `AdCampaign`, `SubscriptionPlan`, `Subscriber`, `SupportTicket`, `Conversation`, `Message`, `IntegrationCredential`, `ActivityLog`).
- **Security:** Bcrypt password hashing (cost 12), Edge-compatible JWT session cookies (`jarvis_session`), and strict multi-tenant isolation (`where: { organizationId }` on every database query).
- **Core Modules:**
  1. *AI Command Center:* Grounded in real database metrics via Gemini 3.8 Flash, OpenAI, or built-in NLP.
  2. *Business Metrics:* Live MRR, ARR, MTD revenue, and active users.
  3. *Social Media Hub:* Multi-channel broadcast queue (X, Instagram, LinkedIn).
  4. *Meta Ads Manager:* Real ad spend, CTR, conversions, and blended ROAS.
  5. *Subscriptions:* Dynamic tier distribution and churn calculations.
  6. *Support Center:* Ticket issuance, priority tagging, and status toggle.
  7. *Executive Tooling:* One-click CSV exporter, morning briefing generator, team RBAC modal.

### SIDE B: NEXORA (Desktop Voice & OS Automation Agent)
- **Runtime:** Python 3.10–3.14 on Windows 11.
- **Audio Engine:** PyAudio capturing 16 kHz mono microphone input and playing back 24 kHz Gemini synthesized audio via WebSockets.
- **Model:** Google Gemini Live Multimodal (`models/gemini-2.5-flash-native-audio-preview-12-2025` or `gemini-2.0-flash-exp`).
- **OS Automation Capabilities:**
  - `open_app`: Launches Windows desktop software and websites.
  - `computer_control`: Native mouse clicks, cursor positioning, and keystrokes.
  - `computer_settings`: Volume adjustment, screen brightness, lock PC, taskbar controls.
  - `screen_process`: Computer vision and screenshot inspection.
  - `file_controller`: Safe filesystem search and document handling.
  - `task_queue`: Autonomous multi-step goal execution with priorities (`high`, `normal`, `low`).
- **UI:** Custom Tkinter HUD with vector radar animation, audio waveform visualization, and streaming communication logs.

---

## 3. HOW THEY ARE CURRENTLY CONNECTED

1. **Physical Layout:** Nexora is embedded directly inside the project root at `jarvis-lite/nexora/`.
2. **Shared Credentials:** Nexora's `_get_api_key()` automatically looks for `GEMINI_API_KEY` in the root `.env` before falling back to `nexora/config/api_keys.json`.
3. **Python-to-Web REST Bridge (`nexora/actions/jarvis_bridge.py`):**
   - Nexora has 5 tool functions exposed directly to Gemini Live:
     - `jarvis_get_metrics()` → `GET http://localhost:3000/api/metrics`
     - `jarvis_get_tickets()` → `GET http://localhost:3000/api/support/tickets`
     - `jarvis_get_morning_briefing()` → `GET http://localhost:3000/api/reports/briefing`
     - `jarvis_schedule_post(platform, content)` → `POST http://localhost:3000/api/social/posts`
     - `jarvis_create_ticket(subject, email, priority)` → `POST http://localhost:3000/api/support/tickets`
4. **Web-to-Voice HUD (`app/components/NexoraVoiceBridge.tsx`):**
   - Embedded directly in the web dashboard header.
   - Provides an animated radar HUD matching Nexora's aesthetics.
   - Uses browser Web Speech API (SpeechRecognition + SpeechSynthesis) for speech interaction directly in the web browser.
5. **Launcher:** Root `run-nexora.bat` and `npm run nexora` script.

---

## 4. DOUBTS & ARCHITECTURAL QUESTIONS I NEED YOU TO ANSWER

Please analyze and give definitive architectural recommendations for:

1. **Authentication Between Nexora & Jarvis Lite:**
   - Currently, `jarvis_bridge.py` calls the local Next.js APIs directly via HTTP. If Jarvis Lite requires authentication (JWT session cookie or Bearer token), how should Nexora securely authenticate its requests so multi-tenant organization boundaries are preserved?
2. **Real-Time Two-Way Synchronization (Eliminating Polling):**
   - Right now, when a user tells Nexora by voice: *"Create a ticket for billing issue"*, Nexora sends an HTTP POST. But the user looking at the Next.js web dashboard won't see the new ticket appear unless they manually refresh or poll.
   - What is the best pattern to push real-time updates from Python to the Next.js React frontend (e.g. Server-Sent Events, WebSockets, Local IPC, or Pusher)?
3. **Gemini Live WebSocket vs. Browser Web Speech:**
   - Nexora streams raw 16kHz PCM audio directly over WebSockets to Google Gemini Live API for sub-second voice-to-voice conversation.
   - The Next.js frontend uses browser Web Speech API.
   - How can we bridge the actual Gemini Live audio stream into the web browser interface without needing Python Tkinter open, or run Nexora as a headless local daemon?
4. **Unified Process Orchestration:**
   - Currently, the user runs `npm run dev` in one terminal and `python nexora/main.py` in another.
   - How can we package or orchestrate this so a single command (or desktop shell like Tauri or Electron) launches both services smoothly in Windows 11?

---

## 5. REQUESTED UPGRADE ROADMAP & IMPLEMENTATION SPECIFICATIONS

Provide a phased upgrade plan with concrete code examples:

### Phase 1: Secure Service-to-Service API Key Authentication
- Design a machine-to-machine (M2M) API key or service token mechanism in Jarvis Lite (`/api/voice/bridge`) that validates Nexora and maps it to the user's active Organization.

### Phase 2: Real-Time Event Bus (Python Agent → Web Dashboard)
- Implement Server-Sent Events (SSE) or a lightweight WebSocket bridge route (`/api/events`) in Next.js so that any action performed by Nexora immediately updates React state in the dashboard in real time.

### Phase 3: Headless Daemon Mode with Unified CLI
- Refactor Nexora so it can run either with its Tkinter GUI (`--gui`) or as a background headless service (`--headless`) managed by Next.js or a Windows tray utility.

### Phase 4: Full Multi-Modal Expansion
- How to route screenshots taken by Nexora (`screen_processor.py`) into Jarvis Lite's AI Command Center to allow visual debugging of business workflows.

Please provide thorough explanations, architecture diagrams, and production-ready code snippets for these enhancements.
```

