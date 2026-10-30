# ⚡ Nexora Voice Assistant & Jarvis Lite Integration Guide

This guide explains how **Nexora** (Python Multimodal Voice AI & Windows OS Controller) is combined with **Jarvis Lite** (Next.js 14 Executive Command Center).

---

## 🏛️ System Architecture

```
                                    ┌────────────────────────────────┐
                                    │    Windows PC & Microphone     │
                                    └───────────────┬────────────────┘
                                                    │
                             ┌──────────────────────┴──────────────────────┐
                             ▼                                             ▼
                 ┌───────────────────────┐                     ┌───────────────────────┐
                 │    Web Browser HUD    │                     │  Nexora Python Agent  │
                 │   (Next.js App at     │ ◄── HTTP Bridge ──► │     (Tkinter HUD      │
                 │   localhost:3000)     │      (/api/*)       │   & Gemini Live API)  │
                 └───────────┬───────────┘                     └───────────┬───────────┘
                             │                                             │
                             ▼                                             ▼
                 ┌───────────────────────┐                     ┌───────────────────────┐
                 │ Prisma SQLite / Postg │                     │ Full PC & OS Controls │
                 │ • Financial Metrics   │                     │ • Launch Apps         │
                 │ • Support Tickets     │                     │ • Volume / Brightness │
                 │ • Social Post Queue   │                     │ • Mouse & Keyboard    │
                 │ • Ad Campaigns / ROAS │                     │ • Screen Inspection   │
                 └───────────────────────┘                     └───────────────────────┘
```

---

## 🚀 How to Run

### 1. Web Command Center (Next.js)
```powershell
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)**.  
The **Nexora Voice & OS Bridge** is located directly on your dashboard. Click the central microphone to speak with voice responses directly in your browser.

### 2. Desktop Multimodal Voice Agent (Python)
Double click `run-nexora.bat` or run:
```powershell
npm run nexora
```
*(Or `cd nexora && python main.py`)*

---

## 🎙️ Unified Voice Commands

When speaking to Nexora via microphone or web bridge, you can execute both **Executive Business Commands** and **OS Automation**:

### 📊 Jarvis Lite Business Commands
- *"What is our MRR?"* → Fetches live verified revenue metrics from database.
- *"Give me the morning briefing."* → Summarizes high-priority tickets, KPIs, and daily actions.
- *"What customer support tickets are open?"* → Reads recent tickets and priority levels.
- *"Schedule a post on X saying 'We just launched our new product version.'"* → Queues post in Jarvis Lite.
- *"Create a high priority support ticket for billing issues from client@acme.com."* → Ingests new ticket into database.

### 🖥️ Windows OS & Desktop Controls
- *"Open Notepad"* or *"Open Chrome and launch YouTube."*
- *"Increase volume by 20 percent."*
- *"Take a screenshot."*
- *"Find flights from New York to London next Friday."*
- *"Search the web for the latest AI tech news."*

---

## 🔑 Configuration

Nexora automatically loads your `GEMINI_API_KEY` from the project's root [`.env`](file:///c:/Users/Sridhar's%20Nitro/Documents/jarvis%20lite/.env) file or [`nexora/config/api_keys.json`](file:///c:/Users/Sridhar's%20Nitro/Documents/jarvis%20lite/nexora/config/api_keys.json). Zero manual configuration required.
