# ⚡ Jarvis Lite — Comprehensive Features & Capabilities

**Jarvis Lite** is a centralized executive command center and business dashboard built with Next.js 14, React 18, TypeScript, and Tailwind CSS. It features a futuristic dark-mode HUD (Heads-Up Display) with glassmorphism visual styling, real-time responsive widgets, and an AI conversational interface.

---

## 📋 Table of Contents
1. [Overview & Architecture](#-overview--architecture)
2. [Current Out-of-the-Box Features](#-current-out-of-the-box-features)
   - [1. AI Command Center](#1-ai-command-center)
   - [2. Business Metrics Monitoring](#2-business-metrics-monitoring)
   - [3. Social Media Hub](#3-social-media-hub)
   - [4. Meta Ads Manager](#4-meta-ads-manager)
   - [5. Subscriptions & Recurring Revenue](#5-subscriptions--recurring-revenue)
   - [6. Support Center (Ticket Inbox)](#6-support-center-ticket-inbox)
   - [7. Design System & HUD Glassmorphism](#7-design-system--hud-glassmorphism)
3. [Running & Developing Jarvis Lite](#-running--developing-jarvis-lite)
4. [Production & Deployment](#-production--deployment)
5. [Future Roadmap & Live API Integrations](#-future-roadmap--live-api-integrations)

---

## 🏗 Overview & Architecture

- **Framework**: [Next.js 14](https://nextjs.org/) using the **App Router** (`app/` directory).
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) for strict type safety.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom extended utilities for glassmorphism, ambient glows, and scanline animations.
- **Icons**: [Lucide React](https://lucide.dev/) for crisp, modern icons.
- **Typography**: [Geist Sans & Geist Mono](https://vercel.com/font) variable fonts.
- **Layout**: 12-column adaptive CSS Grid responsive across mobile devices, tablets, and wide desktop displays.

---

## 🚀 Current Out-of-the-Box Features

### 1. AI Command Center
Located prominently at the top-left of the dashboard (`app/components/CommandCenter.tsx`):
- **Conversational Chat Interface**: An interactive chat console simulating an executive AI business co-pilot.
- **Real-time Messaging**: Type any query or command, press `Enter` (or click the send button), and receive simulated AI responses.
- **Interactive Thinking Indicator**: Animated three-dot pulse simulating AI inference/reasoning latency.
- **Morning Briefing Logs**: Pre-seeded with operational briefings summarizing MRR changes, priority tickets, and queued marketing content.
- **HUD Laser Scan Animation**: A sweeping cyan laser scanline integrated into the card header.
- **Auto-Scrolling Feed**: Automatically scrolls to the newest message upon receiving new updates.

### 2. Business Metrics Monitoring
Located at the top-right of the dashboard (`app/components/BusinessMetrics.tsx`):
- **Snapshot Across All Revenue Streams**: Key financial and user metrics summarized at a glance.
- **Metric Cards**:
  - **MRR (Monthly Recurring Revenue)**: Displays current recurring revenue (e.g., `$48,200`).
  - **ARR (Annual Recurring Revenue)**: Displays annualized recurring revenue (e.g., `$578,400`).
  - **Active Users**: Current user base count (e.g., `12,480`).
  - **Revenue (MTD)**: Month-to-date gross revenue (e.g., `$61,900`).
- **Trend Indicators (`TrendPill`)**: Color-coded percentage delta badges (green `▲` for positive growth, red `▼` for declines) reflecting week-over-week performance.

### 3. Social Media Hub
Located in the middle-left grid (`app/components/SocialMediaHub.tsx`):
- **Cross-Platform Scheduling**: Manage queued and drafted posts across major channels:
  - **Instagram** (Fuchsia brand styling)
  - **X / Twitter** (Sky blue brand styling)
  - **LinkedIn** (Blue brand styling)
- **Live Post Composer**:
  - Multi-line text editor with real-time 280-character counter (`0/280`).
  - Platform selector dropdown.
  - Custom scheduling field (e.g., `Fri, 10:00 AM`, `Tomorrow, 9:00 AM`).
  - Single-click **"Schedule post"** button that immediately prepends the post to the active queue.
- **Queue & Draft Viewer**: Displays queued items with time tags and `Scheduled` or `Draft` status tags.

### 4. Meta Ads Manager
Located in the middle-right grid (`app/components/MetaAdsManager.tsx`):
- **Campaign Performance Overview**:
  - **Total Spend**: Aggregated ad expenditure across campaigns (e.g., `$284.20`).
  - **Average CTR**: Blended click-through rate across ad sets (e.g., `2.7%`).
  - **Blended ROAS**: Overall return on advertising spend (e.g., `3.1x`).
- **Campaign Breakdown**:
  - Details for individual campaigns (`Retargeting — Cart Abandoners`, `Prospecting — Lookalike 1%`, `Brand Awareness — Reels`).
  - Real-time status tags (`Active` in emerald, `Paused` in slate).
  - Metrics per campaign: Spend, CTR, and ROAS.
- **Integration Trigger**: "Connect Meta Ads" action button with interactive "Coming soon" tooltip.

### 5. Subscriptions & Recurring Revenue
Located in the bottom-left grid (`app/components/Subscriptions.tsx`):
- **Subscription Health Metrics**:
  - **MRR**: Recurring revenue breakdown.
  - **Active Subscribers**: Current subscriber count (e.g., `1,842`) with growth delta (+3.4%).
  - **Churn Rate**: Real-time churn tracking (e.g., `2.1%`, delta -0.4%).
- **Plan Tier Distribution**:
  - Visual distribution bars with glowing gradient progress tracks (`Starter`, `Pro`, `Enterprise`).
  - Subscriber counts and exact percentage market share (56%, 33%, 11%).
- **Integration Trigger**: "Connect RevenueCat" button for mobile/web app subscription synchronization.

### 6. Support Center (Ticket Inbox)
Located in the bottom-right grid (`app/components/SupportCenter.tsx`):
- **Multi-Channel Inbox Overview**: Unified list of customer support conversations.
- **Ticket Attributes**:
  - Unique Ticket ID (e.g., `#1042`, `#1041`).
  - Subject and customer inquiry description.
  - Customer email address / requester identifier.
  - Dynamic Priority Tags: `High` (Rose), `Medium` (Amber), and `Low` (Slate).
  - Status Tags: `Open` (Cyan), `In progress` (Amber), and `Resolved` (Emerald).
  - Relative timestamp (e.g., `12m ago`, `48m ago`, `2h ago`, `1d ago`).
- **Integration Trigger**: "Connect support inbox" button for ticketing platforms (Zendesk, Intercom, Crisp, Freshdesk).

### 7. Design System & HUD Glassmorphism
Configured across `app/globals.css`, `tailwind.config.ts`, and `app/components/ui.tsx`:
- **Glass Card Component (`GlassCard`)**: Ultra-modern frosted-glass finish using `backdrop-blur-xl`, `bg-white/[0.04]`, and subtle border highlighting (`border-white/10`).
- **HUD Grid Background**: Custom CSS radial gradient mesh with subtle geometric grid lines.
- **Ambient Glow**: Dynamic radial background lighting illuminating key dashboard sectors.
- **Status Indicators**:
  - Pulsing amber `Demo data` badge.
  - Glowing emerald `All systems nominal` status dot.
- **Custom Scrollbar**: Sleek, slim `.hud-scroll` styling tailored for dark interfaces.

---

## 💻 Running & Developing Jarvis Lite

### Prerequisites
- **Node.js**: v18.0.0 or later (installed: v24.18.0)
- **npm**: v9.0.0 or later (installed: 12.0.2)

### Commands
In your terminal from the project root (`c:\Users\Sridhar's Nitro\Documents\jarvis lite`):

1. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

2. **Create an optimized production build**:
   ```bash
   npm run build
   ```

3. **Start the production server**:
   ```bash
   npm run start
   ```

4. **Run code linting**:
   ```bash
   npm run lint
   ```

---

## 🌐 Production & Deployment

- **Vercel**: Configured out of the box with `vercel.json` for one-click deployment.
- **Docker / Self-Hosting**: Easily containerized using standard Next.js standalone output.

---

## 🔮 Future Roadmap & Live API Integrations

Jarvis Lite has been architected to readily connect with live production APIs:
- **LLM Command Engine**: Connect the chat interface in `CommandCenter.tsx` to OpenAI (`gpt-4o`), Anthropic Claude, or Google Gemini via Next.js Route Handlers (`app/api/chat/route.ts`).
- **Payment & Invoicing**: Connect `BusinessMetrics.tsx` and `Subscriptions.tsx` directly to the **Stripe API** or **RevenueCat API**.
- **Ad Campaigns**: Fetch live metrics in `MetaAdsManager.tsx` via the **Meta Graph Marketing API** or Google Ads API.
- **Social Media Automation**: Publish queued posts via the **Twitter/X API v2** and **LinkedIn Marketing Developer Platform**.
- **Customer Tickets**: Sync real-time tickets in `SupportCenter.tsx` with **Zendesk**, **Intercom**, or **Slack**.
