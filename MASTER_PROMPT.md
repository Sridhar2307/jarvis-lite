# MASTER PROMPT: JARVIS LITE COMPLETE SYSTEM EXPLANATION & ARCHITECTURAL BREAKDOWN

> **Instructions for use:** Copy and paste the entire block below into ChatGPT (GPT-4o / GPT-4) or any AI assistant. It provides complete, verified context of the Jarvis Lite codebase and instructs the model to give an exhaustive, professional breakdown.

```markdown
You are a Principal Software Architect, Senior Full-Stack Next.js Engineer, and Tech Product Advisor.

I am sharing the complete codebase specifications, architecture, database schemas, API routes, and operational workflows of my project: **JARVIS LITE**.

I want you to provide an **exhaustive, deep-dive technical and architectural explanation** of my entire application.

---

## 1. PROJECT OVERVIEW & VALUE PROPOSITION

- **Project Name:** Jarvis Lite
- **GitHub Repository:** https://github.com/Sridhar2307/jarvis-lite.git
- **Type:** AI-Powered Executive Command Center & Cross-Channel Business Operating System
- **Core Purpose:** Consolidates multi-platform business operations (Stripe billing, Meta Ads, social media broadcasting, customer support ticketing, and real-time database intelligence) into a unified, glassmorphism dark-mode HUD dashboard for startup founders and executive leadership.
- **Key Philosophy:** Zero fake metrics, zero static mock repetition. All revenue, subscriber tiers, support tickets, and queued posts are backed by a real relational database with strict multi-tenant organization isolation.

---

## 2. COMPLETE TECHNICAL STACK

- **Framework:** Next.js 14.2 (App Router with Server Components & Route Handlers)
- **Language:** TypeScript 5 (Strict type checking, end-to-end type safety)
- **Styling:** Tailwind CSS (Custom dark glassmorphism HUD design system, CSS backdrop filters, responsive grid layout)
- **Database & ORM:** Prisma ORM 6.19 with dual SQLite (`dev.db`) zero-config local development and PostgreSQL enterprise readiness
- **Authentication & Sessions:** 
  - Password hashing with `bcryptjs` (salt cost 12)
  - Edge-compatible JSON Web Tokens via `jose` signed with HS256
  - `HttpOnly`, `SameSite=Lax`, secure session cookie (`jarvis_session`)
  - Next.js Edge Middleware for route protection and multi-tenant authorization
- **AI Engine:**
  - Direct integration with Google Gemini (`models/gemini-3.8-flash:generateContent`) via user API keys
  - Secondary fallback to OpenAI API (`gpt-4o-mini`)
  - Built-in natural language processing (NLP) conversational fallback engine supporting 13 conversational intent categories with database metric grounding
  - Latency resilience with `AbortSignal.timeout(6000)`
- **Validation:** Type-safe runtime input validation across all mutations using `zod`
- **Containerization & Deployment:** Multi-stage production `Dockerfile`, `docker-compose.yml` for PostgreSQL 16, and `vercel.json` with enterprise HTTP security headers

---

## 3. DATABASE SCHEMA & DATA MODELS (Prisma ORM - 17 Models)

1. **User**: Unique `email`, `passwordHash`, `name`, timestamps, relationships to memberships, activity logs, tickets, and notes.
2. **Organization**: Multi-tenant container with unique `slug`, `name`, and cascading relations to all business data.
3. **OrganizationMember**: Multi-tenant RBAC linking `User` and `Organization` with roles: `OWNER`, `ADMIN`, `MANAGER`, `VIEWER`.
4. **RevenueRecord**: Transaction records with `amount`, `currency`, `source` (`STRIPE`, `REVENUECAT`, `MANUAL`), `category` (`SUBSCRIPTION`, `ONE_TIME`, `AD_REVENUE`), `notes`, and `recordedAt`.
5. **BusinessMetric**: Pre-computed metrics for fast dashboard rendering (`MRR`, `ARR`, `ACTIVE_USERS`, `REVENUE_MTD`) with percentage delta tracking.
6. **SocialAccount**: Integration records for social networks (`X`, `INSTAGRAM`, `LINKEDIN`).
7. **SocialPost**: Multi-platform post queue (`platform`, `content`, `scheduledTimeString`, `status`: `DRAFT`, `SCHEDULED`, `PUBLISHED`, `FAILED`, `publishedAt`).
8. **AdAccount**: Advertising accounts (`platform`: `META`, `accountName`, `status`: `CONNECTED`/`DISCONNECTED`, `totalSpend`, `avgCtr`, `blendedRoas`).
9. **AdCampaign**: Individual ad campaigns (`spend`, `impressions`, `clicks`, `ctr`, `roas`, `status`: `ACTIVE`/`PAUSED`).
10. **SubscriptionPlan**: Tiers (`name`: Starter, Pro, Enterprise, `price`, `interval`: month).
11. **Subscriber**: Customer subscriptions (`customerEmail`, `status`: `ACTIVE`, `CANCELLED`, `PAST_DUE`, renewal dates).
12. **SupportTicket**: Customer tickets with auto-incrementing `ticketNumber`, `subject`, `requesterEmail`, `priority`: `HIGH`/`MEDIUM`/`LOW`, `status`: `OPEN`/`IN_PROGRESS`/`RESOLVED`/`CLOSED`.
13. **TicketNote**: Internal discussion notes on tickets with `isInternal` flags.
14. **Conversation**: AI conversational threads scoped to organizations.
15. **Message**: Individual chat entries (`role`: `user`/`ai`, `text`, timestamps).
16. **IntegrationCredential**: Unified credential vault (`provider`, `status`, `apiKeyMasked`, `metadataJson`, `lastSyncedAt`).
17. **ActivityLog**: Comprehensive audit trail recording user and system actions.

---

## 4. COMPLETE APPLICATION ROUTING (24 Routes)

### Frontend Pages
- `/`: Main Executive Command Center Dashboard (Protected)
- `/login`: Authentication portal with 1-Click Executive Demo Access
- `/register`: Organization provisioning & owner account creation

### Authentication & Tenant Endpoints
- `POST /api/auth/register`: Creates User, Organization, and Owner membership in a single transaction.
- `POST /api/auth/login`: Verifies bcrypt hash, signs JWT, sets `jarvis_session` cookie.
- `POST /api/auth/logout`: Clears session cookie.
- `GET /api/auth/me`: Returns current user identity, organization context, and RBAC role.
- `POST /api/auth/demo-seed`: Ingests starter business records for testing.

### Business & Analytics Endpoints
- `GET /api/metrics`: Dynamically computes MRR, ARR, MTD revenue, and active users.
- `POST /api/metrics`: Logs real transaction records into the database.
- `GET /api/subscriptions`: Aggregates active subscribers across tiers and computes churn rate.
- `GET /api/ads`: Aggregates Meta ad spend, impressions, clicks, CTR, and blended ROAS.

### Social Media & Broadcast Queue
- `GET /api/social/posts`: Retrieves scheduled and draft broadcasts.
- `POST /api/social/posts`: Creates new posts with platform-specific character limits (X 280, IG 2200, LinkedIn 3000).
- `PATCH /api/social/posts/[id]`: Immediate publish or rescheduling trigger.
- `DELETE /api/social/posts/[id]`: Removes post from queue.
- `POST /api/cron/social-broadcast`: Background cron runner that broadcasts due scheduled posts and writes audit logs.

### Customer Support & Ticketing
- `GET /api/support/tickets`: Full-text search and filtering by priority and status.
- `POST /api/support/tickets`: Issues new tickets with auto-incrementing numbering.
- `PATCH /api/support/tickets/[id]`: Status and priority lifecycle updates.
- `DELETE /api/support/tickets/[id]`: Removes ticket from database.

### AI Command Center
- `GET /api/ai/chat`: Fetches conversation history.
- `POST /api/ai/chat`: Real-time chat endpoint grounded in live business metrics via Google Gemini 3.8 Flash, OpenAI, or built-in conversational NLP.

### Integrations, Webhooks & OAuth
- `GET /api/integrations`: Returns connection status and masked keys for all third-party channels.
- `POST /api/integrations`: Saves API tokens and webhook secrets securely.
- `POST /api/integrations/test`: Simulates real-time webhook ingestion and API handshakes.
- `GET /api/auth/oauth/[provider]`: Generates signed OAuth 2.0 URLs for Meta, Twitter, LinkedIn.
- `POST /api/auth/oauth/[provider]`: Handles OAuth code exchange and credential storage.
- `POST /api/webhooks/stripe`: Ingests `invoice.payment_succeeded` and `customer.subscription.deleted`.

### Advanced Executive Services
- `GET /api/export/csv`: Generates and streams a comprehensive multi-section CSV export of the organization's business records.
- `GET /api/reports/briefing`: Generates the daily Executive Morning Intelligence Briefing.
- `GET /api/team`: Lists organization team members and roles.
- `POST /api/team`: Invites new team members with RBAC (`ADMIN`, `MANAGER`, `VIEWER`).
- `PATCH /api/team/[id]`: Updates team member roles.
- `DELETE /api/team/[id]`: Removes team members with Owner protection.

---

## 5. WHAT I WANT YOU TO EXPLAIN IN FULL DETAIL

Please provide a structured, in-depth breakdown covering:

1. **Executive Architecture Summary:** What makes Jarvis Lite an enterprise-grade Next.js App Router platform?
2. **Security & Multi-Tenancy Architecture:** How is multi-tenant isolation enforced at the database and middleware layers to guarantee that no user or company can ever access another organization's records?
3. **Data Flow Walkthrough:** Pick one complex user journey (e.g. Logging a new revenue record or Scheduling and Broadcasting a social post) and trace it step-by-step from UI component -> Zod validation -> Next.js API Route -> Prisma ORM -> Database -> UI state update.
4. **AI Grounding Mechanism:** Explain how the AI Command Center prevents hallucinations and answers financial and operational questions with real database figures.
5. **Interview & Pitch Readiness:**
   - How should I present this project in a **Senior Full-Stack Engineer / Software Architect interview**? (Highlight the technical decisions, challenges overcome, and patterns used).
   - How should I pitch this as a **commercial SaaS product to investors or executive customers**?
6. **Future Scalability Roadmap:** What are the recommended next architectural steps if scaling this application to 100,000 active organizations?
```

