# KNOWN LIMITATIONS & FUTURE ROADMAP

## 1. Known Operational Constraints

1. **Host Audio Hardware Dependency (PyAudio)**:
   - Nexora requires a physical or virtual audio input device (microphone) and output device (speakers) on the Windows host.
   - In headless server environments (e.g. cloud VMs without audio devices), run Nexora in `--headless` daemon mode.
2. **Gemini Live API Regional Availability**:
   - The native audio model `models/gemini-2.5-flash-native-audio-preview-12-2025` requires an active Google AI Studio API key with access to Live API preview endpoints.
3. **Local WebSocket Port (8765)**:
   - Nexora binds to `127.0.0.1:8765`. If another local process is utilizing port 8765, the bridge will log a warning and fallback gracefully to polling/REST.
4. **Windows Desktop Automation Sandbox**:
   - PyAutoGUI and window management require the user session to remain unlocked. In locked Windows sessions or RDP disconnects, screen capture may return a black frame.

---

## 2. Future Engineering Roadmap

- [ ] Support for native Linux (X11 / Wayland) desktop automation adapters.
- [ ] Redis cluster backend for distributed multi-server outbox scaling.
- [ ] End-to-end encrypted audio stream between web radar and Nexora daemon.
- [ ] Granular visual bounding-box overlays for interactive screen annotations.

