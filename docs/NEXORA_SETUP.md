# NEXORA MULTIMODAL DESKTOP AGENT SETUP

## 1. System Requirements
- **OS**: Windows 10 / Windows 11 (64-bit)
- **Python**: 3.10 to 3.14 (Verified working on Python 3.14.6)
- **Audio Hardware**: Working microphone and speaker output (for PyAudio)
- **Dependencies**: `google-genai`, `pyaudio`, `requests`, `websockets`, `pyautogui`, `pillow`, `mss`

---

## 2. Environment Configuration

Nexora automatically reads `GEMINI_API_KEY` from the root `.env` or `nexora/config/api_keys.json`.

Ensure your `.env` contains:
```env
GEMINI_API_KEY="AIzaSy..."
JARVIS_BASE_URL="http://localhost:3000"
```

---

## 3. Running Nexora

Nexora supports three operational modes via the launcher `run-nexora.bat`:

### Mode 1: Interactive Face HUD (Default)
```bash
run-nexora.bat
# Or directly:
cd nexora
python main.py
```
Opens the animated glowing AI face HUD and establishes Gemini Live bidirectional voice streaming.

### Mode 2: Headless Desktop Daemon Mode
```bash
run-nexora.bat --headless
# Or:
cd nexora
python main.py --headless
```
Runs quietly in the background as a Windows desktop automation daemon without opening any Tkinter windows. Ideal for dev orchestration and background monitoring.

### Mode 3: Pairing with Jarvis Lite
```bash
# 1. Click "Desktop Devices" in the Jarvis Lite web dashboard and click "Generate Pairing Code"
# 2. Run Nexora with the single-use pairing code:
run-nexora.bat --pair JARVIS-948210
```
Nexora securely authenticates with Jarvis Lite, caches its hashed access tokens in `nexora/config/device_credentials.json`, and links the workstation.

---

## 4. Local WebSocket Bridge

When Nexora runs, it hosts a local WebSocket server on `ws://127.0.0.1:8765`.
The Jarvis Lite web dashboard connects to this local port automatically via `NexoraVoiceBridge.tsx` to stream status, audio radar waves, and trigger local desktop actions directly from the browser!
