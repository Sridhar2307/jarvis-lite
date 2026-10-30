import os
import json
import time
import math
import random
import sys
import threading
import tkinter as tk
from collections import deque
from pathlib import Path
from PIL import Image, ImageTk, ImageDraw


def get_base_dir():
    return Path(sys.executable).parent if getattr(sys, "frozen", False) else Path(__file__).resolve().parent


BASE_DIR = get_base_dir()
CONFIG_DIR = BASE_DIR / "config"
API_FILE = CONFIG_DIR / "api_keys.json"

# Modern dark HUD palette
C_BG = "#050a11"
C_PANEL = "#0b1521"
C_PANEL2 = "#0e1c2a"
C_BORDER = "#20394c"
C_PRI = "#39d9f5"
C_MID = "#167c98"
C_TEXT = "#e8f5fc"
C_MUTED = "#8199aa"
C_DIM = "#294456"
C_GREEN = "#59e6a0"
C_AMBER = "#ffd166"
C_RED = "#ff657a"


class JarvisUI:
    """Updated UI; keeps write_log/start_speaking/stop_speaking API compatibility."""

    def __init__(self, face_path, size=None):
        self.root = tk.Tk()
        self.root.title("Voice Assistant — MARK XXX")
        self.root.configure(bg=C_BG)
        self.root.minsize(760, 620)

        sw, sh = self.root.winfo_screenwidth(), self.root.winfo_screenheight()
        W, H = size if size else (min(max(900, int(sw * .78)), 1180),
                                  min(max(680, int(sh * .84)), 880))
        W, H = min(W, sw - 30), min(H, sh - 70)
        self.root.geometry(f"{W}x{H}+{max(0,(sw-W)//2)}+{max(0,(sh-H)//2)}")
        self.root.resizable(True, True)

        self._api_key_event = threading.Event()
        self.speaking = False
        self.status_text = "READY"
        self.tick = 0
        self.scale = self.target_scale = 1.0
        self.halo_a = self.target_halo = 60.0
        self.last_t = time.time()
        self.scan_angle, self.scan2_angle = 0.0, 180.0
        self.rings_spin = [0.0, 120.0, 240.0]
        self.typing_queue = deque()
        self.is_typing = False
        self._closing = False
        self._face_pil = None
        self._has_face = False
        self._face_photo = None
        self._load_face(face_path)

        self._build_ui()
        self._api_key_ready = self._api_keys_exist()
        if not self._api_key_ready:
            self._show_setup_ui()
        else:
            self._api_key_event.set()
            self._append_message("system", "Voice interface ready. Waiting for your command.")
        self._animate()
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

    def _load_face(self, face_path):
        """Safely load face image if provided and exists."""
        self._has_face = False
        self._face_pil = None
        if not face_path:
            return
        p = Path(face_path)
        if not p.is_absolute():
            p = BASE_DIR / face_path
        if p.is_file():
            try:
                self._face_pil = Image.open(p).convert("RGBA")
                self._has_face = True
            except Exception as e:
                print(f"[UI] Failed to load face image from {p}: {e}")
                self._has_face = False

    def _api_keys_exist(self):
        """Check if Gemini API key is configured."""
        if not API_FILE.exists():
            return False
        try:
            with open(API_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return bool(data.get("gemini_api_key") and data.get("gemini_api_key").strip())
        except Exception:
            return False

    def wait_for_api_key(self):
        """Called by background runner to pause until API key is set."""
        self._api_key_event.wait()

    def _show_setup_ui(self):
        """Display setup modal when API key is missing."""
        setup_win = tk.Toplevel(self.root)
        setup_win.title("Gemini API Setup — MARK XXX")
        setup_win.configure(bg=C_PANEL)
        setup_win.geometry("520x260")
        setup_win.resizable(False, False)
        setup_win.transient(self.root)
        setup_win.grab_set()

        sw, sh = setup_win.winfo_screenwidth(), setup_win.winfo_screenheight()
        setup_win.geometry(f"+{(sw-520)//2}+{(sh-260)//2}")

        tk.Label(
            setup_win, text="GEMINI API KEY REQUIRED", bg=C_PANEL, fg=C_PRI,
            font=("Segoe UI", 12, "bold")
        ).pack(pady=(20, 8))

        tk.Label(
            setup_win,
            text="Please enter your Google Gemini API key to activate voice features.\n"
                 "Get a key at: https://aistudio.google.com/app/apikey",
            bg=C_PANEL, fg=C_MUTED, font=("Segoe UI", 9), justify="center"
        ).pack(padx=24, pady=(0, 16))

        entry_frame = tk.Frame(setup_win, bg=C_PANEL)
        entry_frame.pack(fill="x", padx=30, pady=5)

        key_entry = tk.Entry(
            entry_frame, bg=C_PANEL2, fg=C_TEXT, insertbackground=C_PRI,
            font=("Segoe UI", 10), relief="flat", highlightthickness=1,
            highlightbackground=C_BORDER, show="•"
        )
        key_entry.pack(fill="x", ipady=6)
        key_entry.focus()

        def _save():
            key = key_entry.get().strip()
            if not key:
                return
            CONFIG_DIR.mkdir(parents=True, exist_ok=True)
            existing = {}
            if API_FILE.exists():
                try:
                    with open(API_FILE, "r", encoding="utf-8") as f:
                        existing = json.load(f)
                except Exception:
                    existing = {}
            existing["gemini_api_key"] = key
            with open(API_FILE, "w", encoding="utf-8") as f:
                json.dump(existing, f, indent=4)

            self._api_key_ready = True
            self._api_key_event.set()
            setup_win.destroy()
            self._append_message("system", "Gemini API key configured. Darling online.")

        btn = tk.Button(
            setup_win, text="Save & Connect", bg=C_PRI, fg=C_BG,
            font=("Segoe UI", 10, "bold"), relief="flat", padx=16, pady=6,
            command=_save, cursor="hand2", activebackground=C_GREEN, activeforeground=C_BG
        )
        btn.pack(pady=18)
        setup_win.protocol("WM_DELETE_WINDOW", lambda: sys.exit(0))

    def _build_ui(self):
        self.root.grid_rowconfigure(1, weight=1)
        self.root.grid_columnconfigure(0, weight=1)

        header = tk.Frame(self.root, bg="#080f18", height=76,
                          highlightbackground=C_BORDER, highlightthickness=1)
        header.grid(row=0, column=0, sticky="ew")
        header.grid_propagate(False)
        header.grid_columnconfigure(1, weight=1)

        logo = tk.Canvas(header, width=42, height=42, bg="#080f18", highlightthickness=0)
        logo.grid(row=0, column=0, padx=(22, 12), pady=15)
        logo.create_oval(4, 4, 38, 38, outline=C_PRI, width=2)
        logo.create_arc(9, 9, 33, 33, start=35, extent=265, outline=C_GREEN, width=2)
        logo.create_oval(17, 17, 25, 25, fill=C_PRI, outline="")

        title = tk.Frame(header, bg="#080f18")
        title.grid(row=0, column=1, sticky="w", pady=12)
        tk.Label(title, text="VOICE INTERFACE", bg="#080f18", fg=C_TEXT,
                 font=("Segoe UI", 15, "bold")).pack(anchor="w")
        tk.Label(title, text="Hands-free assistant  •  Speech input and response",
                 bg="#080f18", fg=C_MUTED, font=("Segoe UI", 9)).pack(anchor="w", pady=(3, 0))
        self.clock_label = tk.Label(header, text="", bg="#080f18", fg=C_PRI,
                                    font=("Consolas", 14, "bold"))
        self.clock_label.grid(row=0, column=2, padx=24, sticky="e")

        body = tk.Frame(self.root, bg=C_BG)
        body.grid(row=1, column=0, sticky="nsew", padx=20, pady=18)
        body.grid_columnconfigure(0, weight=4, uniform="columns")
        body.grid_columnconfigure(1, weight=6, uniform="columns")
        body.grid_rowconfigure(0, weight=1)

        # Left column: Visualizer
        visual = tk.Frame(body, bg=C_PANEL, highlightbackground=C_BORDER, highlightthickness=1)
        visual.grid(row=0, column=0, sticky="nsew", padx=(0, 9))
        visual.grid_columnconfigure(0, weight=1)
        visual.grid_rowconfigure(1, weight=1)
        tk.Label(visual, text="SYSTEM VISUALIZER", bg=C_PANEL, fg=C_MUTED,
                 font=("Segoe UI", 9, "bold")).grid(row=0, column=0, sticky="w", padx=18, pady=(16, 0))
        self.visual_canvas = tk.Canvas(visual, bg=C_PANEL, highlightthickness=0)
        self.visual_canvas.grid(row=1, column=0, sticky="nsew", padx=8, pady=8)
        self.visual_canvas.bind("<Configure>", lambda _e: self._draw_visualizer())

        status = tk.Frame(visual, bg=C_PANEL)
        status.grid(row=2, column=0, sticky="ew", padx=18, pady=(2, 15))
        self.status_dot = tk.Label(status, text="●", bg=C_PANEL, fg=C_GREEN, font=("Segoe UI", 11))
        self.status_dot.pack(side="left")
        self.status_label = tk.Label(status, text="READY FOR VOICE INPUT", bg=C_PANEL, fg=C_GREEN,
                                      font=("Segoe UI", 9, "bold"))
        self.status_label.pack(side="left", padx=(7, 0))
        self.wave_canvas = tk.Canvas(status, width=112, height=24, bg=C_PANEL, highlightthickness=0)
        self.wave_canvas.pack(side="right")

        # Right column: Communication / Activity Log
        log_frame = tk.Frame(body, bg=C_PANEL, highlightbackground=C_BORDER, highlightthickness=1)
        log_frame.grid(row=0, column=1, sticky="nsew", padx=(9, 0))
        log_frame.grid_columnconfigure(0, weight=1)
        log_frame.grid_rowconfigure(1, weight=1)

        log_hdr = tk.Frame(log_frame, bg=C_PANEL)
        log_hdr.grid(row=0, column=0, columnspan=2, sticky="ew", padx=18, pady=(16, 8))
        tk.Label(log_hdr, text="ACTIVITY LOG", bg=C_PANEL, fg=C_MUTED,
                 font=("Segoe UI", 9, "bold")).pack(side="left")

        text_wrap = tk.Frame(log_frame, bg=C_PANEL2, highlightbackground=C_BORDER, highlightthickness=1)
        text_wrap.grid(row=1, column=0, sticky="nsew", padx=18, pady=(0, 15))
        text_wrap.grid_columnconfigure(0, weight=1)
        text_wrap.grid_rowconfigure(0, weight=1)

        self.log_text = tk.Text(text_wrap, bg=C_PANEL2, fg=C_TEXT, insertbackground=C_PRI,
                                font=("Segoe UI", 10), wrap="word", relief="flat",
                                padx=12, pady=10)
        scrollbar = tk.Scrollbar(text_wrap, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=scrollbar.set)
        self.log_text.grid(row=0, column=0, sticky="nsew")
        scrollbar.grid(row=0, column=1, sticky="ns")

        self.log_text.tag_config("user", foreground="#60cdff", font=("Segoe UI", 10, "bold"))
        self.log_text.tag_config("darling", foreground=C_PRI, font=("Segoe UI", 10, "bold"))
        self.log_text.tag_config("system", foreground=C_AMBER, font=("Segoe UI", 9, "italic"))
        self.log_text.tag_config("tool", foreground=C_GREEN, font=("Consolas", 9))
        self.log_text.tag_config("timestamp", foreground=C_MUTED, font=("Consolas", 9))
        self.log_text.tag_config("body", foreground=C_TEXT, font=("Segoe UI", 10))
        self.log_text.config(state="disabled")

    def _append_message(self, sender: str, text: str):
        """Post a message to log (thread-safe)."""
        self.root.after(0, lambda: self._safe_append_message(sender, text))

    def _safe_append_message(self, sender: str, text: str):
        if self._closing:
            return
        try:
            self.log_text.config(state="normal")
            ts = time.strftime("[%H:%M:%S] ")
            self.log_text.insert("end", ts, "timestamp")

            s_low = sender.lower()
            if s_low == "you":
                self.log_text.insert("end", "YOU: ", "user")
            elif s_low in ("jarvis", "darling"):
                self.log_text.insert("end", "DARLING: ", "darling")
            elif s_low == "tool":
                self.log_text.insert("end", "TOOL: ", "tool")
            else:
                self.log_text.insert("end", "SYSTEM: ", "system")

            self.log_text.insert("end", f"{text}\n\n", "body")
            self.log_text.see("end")
            self.log_text.config(state="disabled")
        except Exception:
            pass

    def write_log(self, text: str):
        """Thread-safe write log method for compatibility with actions and main engine."""
        if not text:
            return
        msg = str(text).strip()
        if msg.startswith("You:"):
            sender = "you"
            content = msg[4:].strip()
        elif msg.startswith("Jarvis:"):
            sender = "darling"
            content = msg[7:].strip()
        elif msg.startswith("Darling:"):
            sender = "darling"
            content = msg[8:].strip()
        elif msg.startswith("["):
            sender = "tool"
            content = msg
        else:
            sender = "system"
            content = msg.replace("JARVIS", "Darling").replace("Jarvis", "Darling")
        self._append_message(sender, content)

    def start_speaking(self):
        """Switch visual state to speaking."""
        self.speaking = True
        self.status_text = "SPEAKING"
        def _update():
            if not self._closing:
                self.status_dot.configure(fg=C_PRI)
                self.status_label.configure(text="SPEAKING...", fg=C_PRI)
        self.root.after(0, _update)

    def stop_speaking(self):
        """Switch visual state to ready."""
        self.speaking = False
        self.status_text = "READY"
        def _update():
            if not self._closing:
                self.status_dot.configure(fg=C_GREEN)
                self.status_label.configure(text="READY FOR VOICE INPUT", fg=C_GREEN)
        self.root.after(0, _update)

    def _draw_visualizer(self):
        canvas = self.visual_canvas
        w = canvas.winfo_width()
        h = canvas.winfo_height()
        if w < 20 or h < 20:
            w, h = 320, 320

        canvas.delete("all")
        cx, cy = w / 2, h / 2
        r_base = min(w, h) * 0.38

        if self._has_face and self._face_pil:
            try:
                face_size = int(r_base * 1.5 * self.scale)
                if face_size > 10:
                    img_resized = self._face_pil.resize((face_size, face_size), Image.Resampling.LANCZOS)
                    self._face_photo = ImageTk.PhotoImage(img_resized)
                    canvas.create_image(cx, cy, image=self._face_photo)
            except Exception:
                pass

        r1 = r_base * self.scale
        r2 = r_base * 0.82 * self.scale
        r3 = r_base * 0.58 * self.scale
        r4 = r_base * 0.28 * self.scale

        # Outer rings
        canvas.create_oval(cx - r1, cy - r1, cx + r1, cy + r1, outline=C_BORDER, width=1)
        canvas.create_oval(cx - r2, cy - r2, cx + r2, cy + r2, outline=C_DIM, width=1, dash=(4, 6))

        # Rotating arcs
        canvas.create_arc(cx - r1, cy - r1, cx + r1, cy + r1,
                          start=self.rings_spin[0], extent=70, style="arc", outline=C_PRI, width=2)
        canvas.create_arc(cx - r1, cy - r1, cx + r1, cy + r1,
                          start=self.rings_spin[0] + 180, extent=70, style="arc", outline=C_PRI, width=2)

        canvas.create_arc(cx - r2, cy - r2, cx + r2, cy + r2,
                          start=self.rings_spin[1], extent=110, style="arc", outline=C_MID, width=2)
        canvas.create_arc(cx - r2, cy - r2, cx + r2, cy + r2,
                          start=self.rings_spin[1] + 180, extent=50, style="arc", outline=C_MID, width=2)

        canvas.create_arc(cx - r3, cy - r3, cx + r3, cy + r3,
                          start=self.rings_spin[2], extent=90, style="arc", outline=C_PRI, width=1)

        # Crosshairs
        canvas.create_line(cx - r1 - 10, cy, cx - r1 + 6, cy, fill=C_BORDER, width=1)
        canvas.create_line(cx + r1 - 6, cy, cx + r1 + 10, cy, fill=C_BORDER, width=1)
        canvas.create_line(cx, cy - r1 - 10, cx, cy - r1 + 6, fill=C_BORDER, width=1)
        canvas.create_line(cx, cy + r1 - 6, cx, cy + r1 + 10, fill=C_BORDER, width=1)

        # Center core if no face loaded
        if not self._has_face:
            core_color = C_PRI if self.speaking else C_MID
            canvas.create_oval(cx - r4, cy - r4, cx + r4, cy + r4, fill=C_PANEL2, outline=core_color, width=2)
            canvas.create_text(cx, cy, text="DARLING", fill=core_color, font=("Segoe UI", 9, "bold"))

    def _draw_wave(self):
        canvas = self.wave_canvas
        w = canvas.winfo_width()
        h = canvas.winfo_height()
        if w < 10 or h < 10:
            w, h = 112, 24

        canvas.delete("all")
        mid_y = h / 2
        bars = 16
        gap = w / (bars + 1)

        for i in range(bars):
            bx = gap * (i + 1)
            if self.speaking:
                phase = self.tick * 0.3 + i * 0.5
                bar_h = (math.sin(phase) * 0.5 + 0.5) * (h * 0.8) + 4
                color = C_PRI
            else:
                bar_h = 3
                color = C_DIM
            top_y = max(1, mid_y - bar_h / 2)
            bot_y = min(h - 1, mid_y + bar_h / 2)
            canvas.create_line(bx, top_y, bx, bot_y, fill=color, width=2)

    def _animate(self):
        if self._closing:
            return
        self.tick += 1
        now = time.time()
        _dt = now - self.last_t
        self.last_t = now

        self.scan_angle = (self.scan_angle + 1.5) % 360
        self.scan2_angle = (self.scan2_angle - 1.0) % 360
        self.rings_spin[0] = (self.rings_spin[0] + 0.8) % 360
        self.rings_spin[1] = (self.rings_spin[1] - 1.2) % 360
        self.rings_spin[2] = (self.rings_spin[2] + 1.6) % 360

        if self.speaking:
            self.target_scale = 1.0 + 0.08 * math.sin(self.tick * 0.2)
        else:
            self.target_scale = 1.0
        self.scale += (self.target_scale - self.scale) * 0.2

        self._draw_visualizer()
        self._draw_wave()

        self.clock_label.configure(text=time.strftime("%H:%M:%S"))

        self.root.after(33, self._animate)

    def _on_close(self):
        self._closing = True
        try:
            self.root.destroy()
        except Exception:
            pass
        sys.exit(0)


DarlingUI = JarvisUI

