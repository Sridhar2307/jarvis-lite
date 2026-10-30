# ⚡ Jarvis Lite — Comprehensive Features & Architecture

**Jarvis Lite** is a fully functional, production-ready AI executive command center and business operations platform built on **Next.js 14**, **React 18**, **TypeScript 5**, **Prisma ORM**, and **Tailwind CSS**. It combines a futuristic dark HUD glassmorphism interface with a verified server-side backend, database persistence, multi-tenant organization isolation, authentication, and live API integrations.

---

## 📋 Table of Contents
1. [Architecture & Stack](#-architecture--stack)
2. [Security & Authentication](#-security--authentication)
3. [The 6 Core Production Modules](#-the-6-core-production-modules)
   - [1. AI Command Center](#1-ai-command-center)
   - [2. Business Metrics & Revenue](#2-business-metrics--revenue)
   - [3. Social Media Hub](#3-social-media-hub)
   - [4. Meta Ads Manager](#4-meta-ads-manager)
   - [5. Subscriptions Management](#5-subscriptions-management)
   - [6. Customer Support Center](#6-customer-support-center)
4. [Database Models (Prisma ORM)](#-database-models-prisma-orm)
5. [API Routes Specification](#-api-routes-specification)
6. [Automated Verification & Testing](#-automated-verification--testing)
7. [Running & Deployment](#-running--deployment)

---

## 🏗 Architecture & Stack

- **Framework**: Next.js 14.2 (App Router with Server & Client components).
- **Language**: TypeScript 5 with strict typing and Zod schemas for all request validations.
- **ORM & Database**: Prisma ORM with SQLite (zero-config, high-performance local persistence in `dev.db`) and instant PostgreSQL compatibility for production.
- **Authentication**: Stateless, Edge-compatible JWT authentication signed with HMAC-SHA256 via `jose`, with passwords hashed using `bcryptjs` (cost factor 12) stored in `HttpOnly` secure cookies.
- **Multi-Tenancy**: Organization-level isolation on every query and mutation. Users can only access records belonging to their authorized organization.
- **UI & Design**: Frosted glassmorphism (`backdrop-blur-xl`), animated cyber scanlines, status dots, custom HUD scrollbars, and accessible dialogs.

---

## 🔒 Security & Authentication

- **Route Protection**: Next.js `middleware.ts` intercepts and validates JWT tokens on all protected routes (`/`, `/api/*`).
- **Input Sanitization & Validation**: 100% of mutation payloads are parsed against Zod schemas in `lib/validations.ts`.
- **Credential Protection**: Integration API keys and secrets are strictly server-side; passwords are never stored in plain text.
- **CSRF & Cookie Hardening**: Session cookies use `SameSite: Lax`, `HttpOnly`, and secure flags in production.

---

## 🚀 The 6 Core Production Modules

### 1. AI Command Center
- **Component**: [`app/components/CommandCenter.tsx`](file:///c:/Users/Sridhar's%20Nitro/Documents/jarvis%20lite/app/components/CommandCenter.tsx)
- **API Endpoint**: `POST /api/ai/chat`, `GET /api/ai/chat`
- **Capabilities**:
  - Grounded executive AI co-pilot that pulls real-time facts directly from your database (MRR, open tickets, queued social posts, ad ROAS).
  - Prevents financial hallucination by enforcing database-backed ground truth.
  - Full conversation thread persistence in the `Conversation` and `Message` database tables.
  - Supports OpenAI `gpt-4o-mini` when `OPENAI_API_KEY` is provided; automatically falls back to an offline rule-based business intelligence engine when unconfigured.

### 2. Business Metrics & Revenue
- **Component**: [`app/components/BusinessMetrics.tsx`](file:///c:/Users/Sridhar's%20Nitro/Documents/jarvis%20lite/app/components/BusinessMetrics.tsx)
- **API Endpoint**: `GET /api/metrics`, `POST /api/metrics`
- **Capabilities**:
  - Dynamically calculates **MRR** (Monthly Recurring Revenue), **ARR** (Annual Recurring Revenue), **Active Users**, and **Revenue MTD** from database `RevenueRecord` and `Subscriber` tables.
  - Interactive **"+ Add Record"** modal to log real cash transactions across Stripe, RevenueCat, or manual bank wire invoices.
  - Honest empty states when a brand new organization has zero records.

### 3. Social Media Hub
- **Component**: [`app/components/SocialMediaHub.tsx`](file:///c:/Users/Sridhar's%20Nitro/Documents/jarvis%20lite/app/components/SocialMediaHub.tsx)
- **API Endpoint**: `GET /api/social/posts`, `POST /api/social/posts`, `DELETE /api/social/posts/[id]`
- **Capabilities**:
  - Full CRUD operations with database persistence across Instagram, X (Twitter), and LinkedIn.
  - Live character limit counter (280 characters).
  - Schedule posts into the database queue with target timestamps.
  - Single-click deletion and real-time status pills (`SCHEDULED`, `DRAFT`, `PUBLISHED`).

### 4. Meta Ads Manager
- **Component**: [`app/components/MetaAdsManager.tsx`](file:///c:/Users/Sridhar's%20Nitro/Documents/jarvis%20lite/app/components/MetaAdsManager.tsx)
- **API Endpoint**: `GET /api/ads`
- **Capabilities**:
  - Tracks live campaigns (`Retargeting`, `Prospecting`, `Brand Awareness`) with individual spend, CTR, impressions, and ROAS.
  - Calculates blended ROAS and aggregated ad expenditure across campaigns.
  - "Manage Integration" dialog detailing required Meta Marketing API scopes (`ads_read`, `read_insights`, `business_management`).

### 5. Subscriptions Management
- **Component**: [`app/components/Subscriptions.tsx`](file:///c:/Users/Sridhar's%20Nitro/Documents/jarvis%20lite/app/components/Subscriptions.tsx)
- **API Endpoint**: `GET /api/subscriptions`
- **Webhooks**: `POST /api/webhooks/stripe`
- **Capabilities**:
  - Live breakdown of subscriber tiers: **Starter**, **Pro**, and **Enterprise**.
  - Dynamic progress bars reflecting percentage market share and subscriber counts.
  - Churn rate calculation based on active vs. cancelled subscriber records.
  - Verified Stripe webhook endpoint with signature verification for `invoice.payment_succeeded` and subscription lifecycle events.

### 6. Customer Support Center
- **Component**: [`app/components/SupportCenter.tsx`](file:///c:/Users/Sridhar's%20Nitro/Documents/jarvis%20lite/app/components/SupportCenter.tsx)
- **API Endpoint**: `GET /api/support/tickets`, `POST /api/support/tickets`, `PATCH /api/support/tickets/[id]`
- **Capabilities**:
  - Real-time helpdesk ticketing system.
  - Live keyword search across ticket subject and customer requester email.
  - Interactive **"+ New Ticket"** modal with priority levels (`HIGH`, `MEDIUM`, `LOW`).
  - Single-click status toggling (`Open` ⟷ `Resolved`) with database updates.

---

## 🗄 Database Models (Prisma ORM)

Located in [`prisma/schema.prisma`](file:///c:/Users/Sridhar's%20Nitro/Documents/jarvis%20lite/prisma/schema.prisma):
- `User`: Accounts, credentials, timestamps.
- `Organization`: Multi-tenant boundary for business data.
- `OrganizationMember`: Role-based membership (`OWNER`, `ADMIN`, `MANAGER`, `VIEWER`).
- `RevenueRecord`: Real financial transactions.
- `BusinessMetric`: Snapshot indicators with delta trends.
- `SocialAccount` & `SocialPost`: Broadcast queue and drafts.
- `AdAccount` & `AdCampaign`: Meta Ads performance metrics.
- `SubscriptionPlan` & `Subscriber`: Recurring revenue tiers.
- `SupportTicket` & `TicketNote`: Customer support workflows.
- `Conversation` & `Message`: AI chat logs.
- `IntegrationCredential`: Masked API keys and OAuth status.
- `ActivityLog`: Audit trail of executive actions.

---

## 🧪 Automated Verification & Testing

Jarvis Lite includes an automated end-to-end audit test suite:

```bash
# Run the test suite
npm test
```

Verifies:
1. Database connectivity and schema generation.
2. Bcrypt password hashing and salt verification.
3. JWT session token signing and verification.
4. Cross-tenant organization data isolation.
5. Social post validation and database persistence.
6. Support ticket creation, search, and lifecycle updates.
7. Subscription tier metrics and MRR calculations.
8. Meta ad campaign metrics and ROAS calculations.

---

## 💻 Running & Deployment

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000). If not logged in, you will be redirected to `/login`, where you can sign in, register a new workspace, or use **1-Click Executive Demo Access**.

### Production Build
```bash
npm run build
npm run start
```
