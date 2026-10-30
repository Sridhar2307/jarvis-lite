import requests
import json

JARVIS_BASE_URL = "http://localhost:3000"

def jarvis_get_metrics() -> str:
    """Fetch live business metrics (MRR, ARR, active users, MTD revenue) from Jarvis Lite."""
    try:
        res = requests.get(f"{JARVIS_BASE_URL}/api/metrics", timeout=5)
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
        res = requests.get(f"{JARVIS_BASE_URL}/api/support/tickets", timeout=5)
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
        res = requests.get(f"{JARVIS_BASE_URL}/api/reports/briefing", timeout=5)
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
        res = requests.post(f"{JARVIS_BASE_URL}/api/social/posts", json=payload, timeout=5)
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
        res = requests.post(f"{JARVIS_BASE_URL}/api/support/tickets", json=payload, timeout=5)
        if res.ok:
            ticket = res.json().get("data", {})
            return f"Created support ticket {ticket.get('id')} for '{subject}' with priority {priority}."
        return "Failed to create ticket in Jarvis Lite."
    except Exception as e:
        return f"Failed to connect to Jarvis Lite. ({e})"
