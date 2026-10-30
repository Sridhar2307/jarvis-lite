# GEMINI LIVE VOICE INTEGRATION ARCHITECTURE

## 1. Overview

Nexora connects directly to Google's Gemini Live API via bidirectional WebSockets using `google.genai.Client`:
- **Model**: `models/gemini-2.5-flash-native-audio-preview-12-2025`
- **Upstream Input**: 16,000 Hz, 1-channel, 16-bit PCM Audio (`audio/pcm`) captured continuously from the default microphone via PyAudio.
- **Downstream Output**: 24,000 Hz, 1-channel, 16-bit PCM Audio streamed back in real-time chunks and played through system speakers.
- **Latency**: Sub-second full duplex conversational response with native barge-in (interruption detection).

---

## 2. Audio Pipeline Flow

```mermaid
sequenceDiagram
    participant User as Executive User
    participant Mic as Microphone (PyAudio 16kHz)
    participant Nexora as Nexora Live Session
    participant Gemini as Gemini Live WebSocket
    participant Speaker as System Speaker (PyAudio 24kHz)
    participant Jarvis as Jarvis Lite Backend

    User->>Mic: "Jarvis, what is our MRR and do we have any open tickets?"
    Mic->>Nexora: 16kHz PCM Chunks
    Nexora->>Gemini: send_realtime_input(media=chunk)
    Gemini-->>Nexora: Tool Call: jarvis_get_metrics() & jarvis_get_tickets()
    Nexora->>Jarvis: GET /api/metrics & GET /api/support/tickets (Bearer Device Auth)
    Jarvis-->>Nexora: Verified Real-time Data
    Nexora->>Gemini: send_tool_response(result)
    Gemini-->>Nexora: 24kHz PCM Audio Stream
    Nexora->>Speaker: Play synthesized natural speech
    Speaker-->>User: "Sir, our current MRR is $48,200, and we have 2 open support tickets."
```

---

## 3. Web Radar Voice HUD (`NexoraVoiceBridge.tsx`)

In addition to the desktop Python voice engine, the web dashboard includes a built-in voice interface powered by Web Speech API:
- Visual animated HUD with frequency ripple radar.
- Real-time transcript display.
- One-click quick actions: "Executive Briefing", "Check MRR", "Show Ad ROAS", "Open Tickets".
- Direct integration with local Nexora WebSocket on `ws://127.0.0.1:8765`.
