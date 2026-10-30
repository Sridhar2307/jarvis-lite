import os
import sys
import json
import requests
from pathlib import Path
from typing import Optional, Dict, Any

JARVIS_BASE_URL = os.environ.get("JARVIS_BASE_URL", "http://localhost:3000")
CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"
CREDENTIALS_FILE = CONFIG_DIR / "device_credentials.json"

def _ensure_config_dir():
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)

def load_credentials() -> Dict[str, Any]:
    """Load cached agent device authentication credentials."""
    _ensure_config_dir()
    if CREDENTIALS_FILE.exists():
        try:
            with open(CREDENTIALS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_credentials(creds: Dict[str, Any]):
    """Persist agent device authentication credentials."""
    _ensure_config_dir()
    with open(CREDENTIALS_FILE, "w", encoding="utf-8") as f:
        json.dump(creds, f, indent=2)

def get_auth_headers() -> Dict[str, str]:
    """Return HTTP headers with device bearer token if paired."""
    creds = load_credentials()
    headers = {"Content-Type": "application/json"}
    token = creds.get("accessToken")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers

def jarvis_pair_device(pairing_code: str, device_name: str = "Nexora Desktop Workstation") -> str:
    """
    Submit a single-use pairing code to Jarvis Lite to authenticate and link this Nexora desktop agent.
    """
    try:
        url = f"{JARVIS_BASE_URL}/api/agent/pair"
        payload = {
            "code": pairing_code.strip(),
            "deviceName": device_name,
            "platform": "windows",
            "osVersion": "Windows 11"
        }
        res = requests.post(url, json=payload, timeout=8)
        if res.ok:
            data = res.json()
            creds = {
                "deviceId": data.get("deviceId"),
                "organizationId": data.get("organizationId"),
                "deviceName": data.get("deviceName"),
                "accessToken": data.get("accessToken"),
                "refreshToken": data.get("refreshToken"),
                "scopes": data.get("scopes", [])
            }
            save_credentials(creds)
            return f"✅ Device successfully paired with Jarvis Lite! Device ID: {creds['deviceId']}"
        else:
            return f"❌ Pairing failed: {res.text}"
    except Exception as e:
        return f"❌ Error connecting to Jarvis Lite: {e}"

def jarvis_check_health() -> str:
    """Check connection status and token validity with Jarvis Lite."""
    try:
        url = f"{JARVIS_BASE_URL}/api/agent/health"
        headers = get_auth_headers()
        res = requests.get(url, headers=headers, timeout=5)
        if res.ok:
            data = res.json()
            return f"Jarvis Lite Health: {data.get('status')}. Paired Device: {data.get('deviceName', 'Unknown')}"
        return f"Jarvis Lite returned status code {res.status_code}"
    except Exception as e:
        return f"Unable to reach Jarvis Lite on {JARVIS_BASE_URL}: {e}"

def jarvis_get_metrics() -> str:
    """Fetch live business metrics (MRR, ARR, active users, MTD revenue) from Jarvis Lite."""
    try:
        headers = get_auth_headers()
        res = requests.get(f"{JARVIS_BASE_URL}/api/metrics", headers=headers, timeout=5)
        if res.ok:
            data = res.json().get("data", {})
            metrics = data.get("metrics", [])
            summary = ", ".join([f"{m['label']}: {m['value']}" for m in metrics])
            return f"Current Jarvis Lite business metrics: {summary}."
        return "Jarvis Lite server returned an error fetching metrics."
    except Exception as e:
        return f"Unable to reach Jarvis Lite on {JARVIS_BASE_URL}. Ensure the web dashboard is running. ({e})"

def jarvis_get_tickets() -> str:
    """Fetch open customer support tickets from Jarvis Lite."""
    try:
        headers = get_auth_headers()
        res = requests.get(f"{JARVIS_BASE_URL}/api/support/tickets", headers=headers, timeout=5)
        if res.ok:
            data = res.json().get("data", {})
            tickets = data.get("tickets", [])
            if not tickets:
                return "All customer support tickets are currently cleared in Jarvis Lite."
            summary = "; ".join([f"{t['id']} [{t['priority']}]: {t['subject']}" for t in tickets[:5]])
            return f"Jarvis Lite has {len(tickets)} open support ticket(s): {summary}."
        return "Failed to fetch tickets from Jarvis Lite."
    except Exception as e:
        return f"Unable to reach Jarvis Lite. ({e})"

def jarvis_get_morning_briefing() -> str:
    """Fetch the executive morning intelligence briefing from Jarvis Lite."""
    try:
        headers = get_auth_headers()
        res = requests.get(f"{JARVIS_BASE_URL}/api/reports/briefing", headers=headers, timeout=5)
        if res.ok:
            data = res.json().get("data", {}).get("briefing", {})
            kpis = data.get("kpis", {})
            actions = data.get("recommendedActions", [])
            action_text = " ".join([f"Priority {i+1}: {a}" for i, a in enumerate(actions)])
            return f"Morning Executive Briefing: MRR is {kpis.get('mrr')} ({kpis.get('mrrDelta')}). Active users: {kpis.get('activeUsers')}. ROAS: {kpis.get('adRoas')}. {action_text}"
        return "Unable to generate morning briefing from Jarvis Lite."
    except Exception as e:
        return f"Unable to reach Jarvis Lite briefing endpoint. ({e})"

def jarvis_schedule_post(platform: str, content: str, time_string: str = "Scheduled via Voice") -> str:
    """Schedule or queue a social media post in Jarvis Lite."""
    try:
        normalized_platform = "Instagram"
        if "twitter" in platform.lower() or "x" in platform.lower():
            normalized_platform = "X"
        elif "linkedin" in platform.lower():
            normalized_platform = "LinkedIn"

        payload = {
            "platform": normalized_platform,
            "content": content,
            "scheduledTimeString": time_string,
            "status": "SCHEDULED"
        }
        headers = get_auth_headers()
        res = requests.post(f"{JARVIS_BASE_URL}/api/social/posts", headers=headers, json=payload, timeout=5)
        if res.ok:
            return f"Successfully queued your post for {normalized_platform} in Jarvis Lite: '{content[:50]}...'"
        return f"Failed to queue post: {res.text}"
    except Exception as e:
        return f"Failed to connect to Jarvis Lite. ({e})"

def jarvis_create_ticket(subject: str, requester_email: str, priority: str = "MEDIUM") -> str:
    """Create a new support ticket in Jarvis Lite."""
    try:
        payload = {
            "subject": subject,
            "requesterEmail": requester_email,
            "priority": priority.upper() if priority.upper() in ["HIGH", "MEDIUM", "LOW"] else "MEDIUM",
            "status": "OPEN"
        }
        headers = get_auth_headers()
        res = requests.post(f"{JARVIS_BASE_URL}/api/support/tickets", headers=headers, json=payload, timeout=5)
        if res.ok:
            ticket = res.json().get("data", {})
            return f"Created support ticket {ticket.get('id')} for '{subject}' with priority {priority}."
        return "Failed to create ticket in Jarvis Lite."
    except Exception as e:
        return f"Failed to connect to Jarvis Lite. ({e})"

def jarvis_upload_vision_screenshot(image_base64: str, focus_window: str = "Desktop") -> str:
    """Upload a screenshot to Jarvis Lite Multimodal Vision Engine."""
    try:
        payload = {
            "imageBase64": image_base64,
            "focusWindow": focus_window,
            "mimeType": "image/png"
        }
        headers = get_auth_headers()
        res = requests.post(f"{JARVIS_BASE_URL}/api/agent/vision", headers=headers, json=payload, timeout=15)
        if res.ok:
            session = res.json().get("session", {})
            return f"Screen analyzed by Multimodal AI: {session.get('title')}. Analysis:\n{session.get('analysis')}"
        return f"Vision upload failed: {res.text}"
    except Exception as e:
        return f"Error sending vision data to Jarvis Lite: {e}"
