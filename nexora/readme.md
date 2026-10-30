# ⚡ Nexora — Intelligent Multimodal Voice Assistant

**Nexora** (codenamed *Darling*) is a next-generation real-time voice AI assistant designed to control your Windows PC, understand context across multiple languages, process screen visuals, and autonomously execute complex multi-step workflows.

Powered by Google's native bidirectional audio streaming on Gemini Live (`models/gemini-2.5-flash-native-audio-preview-12-2025`), Nexora delivers lightning-fast voice-to-voice interaction paired with a futuristic HUD interface.

---

## ✨ Features

- 🎙️ **Real-Time Bidirectional Voice Chat**: Direct audio streaming with PyAudio and low-latency Gemini Live API for fluid, natural conversation.
- 🌐 **Multilingual Interaction**: Speaks and understands multiple languages (including English, Tamil, and more) naturally based on user input.
- 🖥️ **Full Desktop & OS Automation**:
  - Launch applications and programs (`open_app`).
  - Native mouse and keyboard actions, clicks, typing, and window focus (`computer_control`).
  - Volume, display brightness, lock, screenshot, and taskbar controls (`computer_settings`).
  - Search, open, and manage filesystem items safely (`file_controller`).
- 👁️ **Visual Screen Awareness**: Integrated computer vision and screen analysis module (`screen_process`) to inspect elements and guide you.
- 🤖 **Autonomous Multi-Step Agent**: Built-in task queue with priority management (`low`, `normal`, `high`) capable of orchestrating complex multi-tool goals.
- 🛠️ **Built-in Power Tools**:
  - **Web Search**: Gemini AI search with DuckDuckGo fallback and comparison engine.
  - **Flight Finder**: Automated flight queries via Google Flights with Notepad summaries.
  - **Reminders**: Native Windows desktop toast alerts with exact datetime scheduling.
  - **YouTube & Transcripts**: Search, launch videos, and inspect transcripts.
  - **Messaging**: Automated messaging workflows via Playwright.
- 🧠 **Dynamic Long-Term Memory**: Automatically extracts personal context (preferences, identity, facts) in the background with zero lag and maintains persistent memory across sessions.
- 🎨 **Futuristic Tkinter HUD**:
  - Animated vector radar HUD with rotating arcs and core pulsation.
  - Real-time audio waveform visualizer.
  - Interactive communication log with formatted tags and timestamps.

---

## 🏗️ How It Works

Nexora operates as an event-driven system connecting audio hardware, real-time Gemini streaming, desktop automation tools, and a Tkinter UI:

```
                  ┌────────────────────────┐
                  │      Microphone        │
                  └───────────┬────────────┘
                              │ 16kHz PCM
                              ▼
┌──────────────┐      ┌────────────────────────┐      ┌─────────────────────────┐
│              │      │       JarvisLive       │ ───► │  Google Gemini Live API │
│  Tkinter HUD │ ◄──► │  (Bidirectional Audio  │ ◄─── │  (Audio + Tool Calls)   │
│  Interface   │      │       Streaming)       │      └────────────┬────────────┘
└──────────────┘      └───────────┬────────────┘                   │
                                  │ 24kHz PCM                      │ Tool Call Request
                                  ▼                                ▼
                      ┌────────────────────────┐      ┌─────────────────────────┐
                      │    Speaker Output      │      │ Action Handlers & Queue │
                      └────────────────────────┘      │  • App Launch / OS      │
                                                      │  • Web Search / Flights │
                                                      │  • Memory Manager       │
                                                      │  • Computer Control     │
                                                      └─────────────────────────┘
```

1. **Microphone Capture**: Records 16 kHz 16-bit mono audio using PyAudio and feeds chunks into an asynchronous outbound queue.
2. **Gemini Live Stream**: Audio streams into the Gemini Live WebSocket connection. Gemini streams back synthesized speech audio (24 kHz) and realtime transcription.
3. **Tool Execution**: When you ask Nexora to take action (e.g., *"Open Chrome and search for flights to Paris"*), Gemini issues tool function calls. Nexora's asynchronous executor dispatches the appropriate action handlers.
4. **Interactive HUD**: Displays live status indicators, rotating HUD graphics, waveform animations, and activity logs.

---

## 📋 Prerequisites

- **Operating System**: Windows 10 or Windows 11 (64-bit)
- **Python**: Python 3.10 to 3.12 installed and added to `PATH`
- **Audio Devices**: Working microphone and speaker/headphones
- **Gemini API Key**: Free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## 🚀 Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Ramakrishna218/Nexora.git
cd Nexora
```

### 2. Create and Activate Virtual Environment (Recommended)
```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Run Automated Setup
Run the setup script to automatically install all dependencies and browser drivers:
```bash
python setup.py
```

*Or manually install requirements:*
```bash
pip install -r requirements.txt
playwright install
```

> **Note on PyAudio**: If installing `pyaudio` fails on your system, install `pipwin` or install a precompiled wheel:
> ```bash
> pip install pipwin
> pipwin install pyaudio
> ```

---

## 🔑 API Key Configuration

Nexora requires a Google Gemini API key. You can provide it in either of two ways:

### Option A: Via GUI on First Launch (Easiest)
Simply start Nexora:
```bash
python main.py
```
If no key is found, a configuration dialog will pop up automatically. Paste your Gemini API key and click **Save & Connect**.

### Option B: Manual Configuration
Create a file at `config/api_keys.json` (or copy `config/api_keys.json.example`):
```json
{
    "gemini_api_key": "YOUR_GEMINI_API_KEY_HERE"
}
```

---

## 🎮 Usage & Voice Command Examples

Start Nexora by running:
```bash
python main.py
```

Once you see the green **READY FOR VOICE INPUT** indicator, speak naturally into your microphone.

### Example Commands

#### 1. System & App Control
- *"Open Notepad."*
- *"Open Chrome and launch YouTube."*
- *"Increase master volume by 20 percent."*
- *"Take a screenshot."*

#### 2. Multilingual Conversation
- *"வணக்கம், எனக்கு இன்றைய செய்தி சொல்."* (Tamil)
- *"What's the weather in Tokyo right now?"*
- *"Translate 'Have a great day' to French and Japanese."*

#### 3. Travel & Search
- *"Find one-way flights from New York to London next Friday."*
- *"Compare the M3 MacBook Air and Dell XPS 13."*

#### 4. Reminders & Productivity
- *"Remind me to drink water in 15 minutes."*
- *"Search YouTube for Python async tutorial."*

#### 5. Complex Tasks
- *"Find the latest stock price of Google, take a screenshot of the browser, and summarize it."*

---

## 📁 Project Structure

```
Nexora/
├── actions/                   # Tool actions called by the assistant
│   ├── browser_control.py     # Web automation & browser interactions
│   ├── cmd_control.py         # Shell command execution
│   ├── code_helper.py         # Code snippets and explanation
│   ├── computer_control.py    # GUI automation (mouse, keyboard, click)
│   ├── computer_settings.py   # Volume, brightness, system settings
│   ├── dev_agent.py           # Developer agent helper
│   ├── file_controller.py     # Filesystem search, open, trash
│   ├── flight_finder.py       # Google Flights queries
│   ├── open_app.py            # Windows application launcher
│   ├── reminder.py            # Scheduled desktop toast alerts
│   ├── screen_processor.py    # Screen capture & visual analysis
│   ├── send_message.py        # Automated messaging
│   ├── weather_report.py      # Real-time weather lookup
│   └── youtube_video.py       # YouTube search & transcripts
├── agent/                     # Autonomous task queue & priority workers
│   └── task_queue.py
├── config/                    # Configurations & credentials
│   └── api_keys.json.example  # Example config file
├── core/                      # System prompts & definitions
│   └── prompt.txt             # Assistant personality & rules
├── memory/                    # Persistent long-term memory
│   ├── memory_manager.py      # Memory read/write/prompt formatter
│   └── config_manager.py
├── main.py                    # Main orchestrator & Gemini Live client
├── ui.py                      # Modern Tkinter visualizer & activity console
├── setup.py                   # Automated dependency installer
├── requirements.txt           # Python packages
└── README.md                  # Project documentation
```

---

## 🛡️ License

This project is licensed for personal and educational use. Please review third-party service terms and Google Generative AI API terms of service when using Gemini Live features.
