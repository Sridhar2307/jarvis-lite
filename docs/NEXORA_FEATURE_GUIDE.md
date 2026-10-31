# NEXORA COMPLETE FEATURE GUIDE & COMMAND DIRECTORY

Nexora is your multimodal Windows desktop AI assistant integrated directly with the Jarvis Lite Executive Command Center.

---

## 1. How to Launch Nexora

You can run Nexora in three ways:

### Method A: Interactive Voice HUD (Recommended for Voice Control)
Double-click `run-nexora.bat` or run:
```powershell
cd "C:\Users\Sridhar's Nitro\Documents\jarvis lite"
run-nexora.bat
```
- Opens the glowing AI Face HUD.
- Listens continuously to your microphone.
- Speaks natural voice responses in real time.

### Method B: Background Desktop Daemon
```powershell
cd "C:\Users\Sridhar's Nitro\Documents\jarvis lite"
run-nexora.bat --headless
```
- Runs quietly in the background without opening a window.
- Listens for voice and handles commands sent from the web dashboard.

### Method C: All-In-One Unified Startup
```powershell
cd "C:\Users\Sridhar's Nitro\Documents\jarvis lite"
npm run dev:all
```
- Launches both the Next.js Executive Web Dashboard and the Nexora desktop daemon together.

---

## 2. Pairing with Jarvis Lite (One-Time Setup)

To give Nexora access to your live business database:
1. Open the dashboard at `http://localhost:3000`.
2. Click **"Desktop Devices"** in the top navigation bar.
3. Click **"Generate Pairing Code"** (e.g., `JARVIS-948210`).
4. In your terminal, run:
   ```powershell
   run-nexora.bat --pair JARVIS-948210
   ```
5. Nexora will securely authenticate, store hashed credentials in `nexora/config/device_credentials.json`, and connect.

---

## 3. Complete Voice & Action Directory

### 📊 Business Intelligence & Jarvis Bridge
Speak naturally to Nexora:
- **"What is our current MRR?"** → Fetches live MRR, ARR, and active users from the database.
- **"Give me the morning executive briefing."** → Summarizes financial KPIs, top priority actions, and customer churn.
- **"Do we have any open support tickets?"** → Lists recent open support tickets and priorities.
- **"Create a ticket for client@enterprise.com regarding payment invoice error."** → Creates ticket #100x in the database.
- **"Schedule a post on LinkedIn: 'Excited to announce our Q4 enterprise release!'"** → Queues post in the Social Media Hub.
- **"Check Jarvis connection health."** → Verifies communication with the central Next.js server.

---

### 🖥️ Windows Application & Window Control
- **"Open Chrome"** / **"Launch VSCode"** / **"Open Notepad"** / **"Open Spotify"**
- **"Open Calculator"** / **"Open Terminal"**
- **"Close window Notepad"**
- **"Minimize window"** / **"Maximize window"**
- **"Press hotkey Ctrl+C"** / **"Press Alt+Tab"**
- **"Type 'Meeting confirmed for 2 PM'"**

---

### 👁️ Multimodal Screen Intelligence & Vision
- **"Analyze my screen"**
- **"What is on my display right now?"**
- **"Inspect this error message on my screen"**
Nexora captures the screen buffer, uploads it to the Multimodal Gemini Vision Engine, extracts text/OCR, diagnoses errors, and logs recommendations into your dashboard's **Vision HUD**.

---

### 🌐 Web & Browser Automation (Playwright)
- **"Search the web for the latest AI model benchmarks"**
- **"Compare prices between M3 MacBook Pro and Dell XPS 15"**
- **"Open browser and go to github.com"**

---

### 🎵 YouTube & Entertainment
- **"Play lo-fi hip hop on YouTube"**
- **"Play classical piano music"**
- **"Search YouTube for Next.js 15 tutorials"**

---

### 📁 File Operations & Management
- **"Find all PDF files on my Desktop"**
- **"Create a new folder called Q4_Reports on Desktop"**
- **"Read file notes.txt on my Desktop"**

---

### 💻 Computer & Hardware Controls
- **"Set volume to 50%"** / **"Mute volume"** / **"Unmute volume"**
- **"Set brightness to 70%"**
- **"Lock my computer"**
- **"Put PC to sleep"**

---

### 🤖 AI Developer & Project Builder (`dev_agent`)
- **"Dev agent: build a FastAPI REST API project on my Desktop"**
  - Nexora plans the multi-file architecture with Gemini.
  - Automatically creates directories and writes files.
  - Opens VS Code and runs the entry point.
  - Detects syntax errors, auto-fixes code, and announces completion!
- **"Code helper: write a Python script to monitor website uptime"**

---

### ✈️ Flight Finder
- **"Find flights from New York to London on December 15th"**
- **"Check round-trip flights from San Francisco to Tokyo departing next Friday"**

---

### ⏰ Timers & Reminders
- **"Remind me to review the financial report in 25 minutes"**
- **"Set a timer for 10 minutes"**
- **"Set an alarm for 9:00 AM tomorrow"**

---

## 4. Web Dashboard Radar HUD Integration

You don't need a terminal open to talk to Nexora:
1. Open `http://localhost:3000`.
2. Look at the **Nexora Voice Bridge Radar** card on the right side of the screen.
3. Click the cyan **Microphone** button to speak directly from your browser.
4. Click the quick-action pills:
   - **Morning Briefing**
   - **Check MRR**
   - **Show Ad ROAS**
   - **Open Tickets**
The radar HUD connects to your local Nexora daemon via `ws://127.0.0.1:8765` for zero-latency local execution!

