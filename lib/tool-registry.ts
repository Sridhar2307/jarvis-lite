export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface ToolDefinition {
  name: string;
  category: "BUSINESS" | "DESKTOP" | "SYSTEM" | "VISION";
  description: string;
  riskLevel: RiskLevel;
  requiredScope: string;
  parameters: Record<
    string,
    {
      type: string;
      description: string;
      required: boolean;
    }
  >;
}

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  // Business Tools
  get_metrics: {
    name: "get_metrics",
    category: "BUSINESS",
    description: "Retrieve real-time business metrics including MRR, ARR, active users, and revenue.",
    riskLevel: "LOW",
    requiredScope: "metrics:read",
    parameters: {
      period: { type: "string", description: "Optional time period (MONTHLY, ANNUAL)", required: false },
    },
  },
  get_recent_tickets: {
    name: "get_recent_tickets",
    category: "BUSINESS",
    description: "Fetch recent customer support tickets and their statuses.",
    riskLevel: "LOW",
    requiredScope: "tickets:read",
    parameters: {
      status: { type: "string", description: "Filter by status (OPEN, IN_PROGRESS, RESOLVED)", required: false },
    },
  },
  create_ticket: {
    name: "create_ticket",
    category: "BUSINESS",
    description: "Create a new customer support ticket in Jarvis Lite.",
    riskLevel: "MEDIUM",
    requiredScope: "tickets:write",
    parameters: {
      subject: { type: "string", description: "Ticket subject or problem summary", required: true },
      requesterEmail: { type: "string", description: "Customer email address", required: true },
      priority: { type: "string", description: "Priority level (LOW, MEDIUM, HIGH)", required: false },
    },
  },
  get_social_overview: {
    name: "get_social_overview",
    category: "BUSINESS",
    description: "Fetch connected social accounts and scheduled/draft posts.",
    riskLevel: "LOW",
    requiredScope: "social:read",
    parameters: {},
  },
  draft_social_post: {
    name: "draft_social_post",
    category: "BUSINESS",
    description: "Draft a new social media post for Instagram, X, or LinkedIn.",
    riskLevel: "MEDIUM",
    requiredScope: "social:write",
    parameters: {
      platform: { type: "string", description: "Platform name (Instagram, X, LinkedIn)", required: true },
      content: { type: "string", description: "The content text of the post", required: true },
      scheduledTimeString: { type: "string", description: "Optional schedule time string", required: false },
    },
  },
  publish_social_post: {
    name: "publish_social_post",
    category: "BUSINESS",
    description: "Publish a drafted social media post immediately to live social channels.",
    riskLevel: "HIGH",
    requiredScope: "social:write",
    parameters: {
      postId: { type: "string", description: "The ID of the post to publish", required: true },
    },
  },
  get_ad_campaigns: {
    name: "get_ad_campaigns",
    category: "BUSINESS",
    description: "Fetch active Meta Ads campaigns, spend, and ROAS performance.",
    riskLevel: "LOW",
    requiredScope: "metrics:read",
    parameters: {},
  },

  // Desktop & OS Automation Tools
  capture_screen: {
    name: "capture_screen",
    category: "VISION",
    description: "Capture the desktop screen and analyze it with Multimodal AI.",
    riskLevel: "LOW",
    requiredScope: "vision:upload",
    parameters: {
      focusWindow: { type: "string", description: "Optional window title to focus", required: false },
    },
  },
  open_application: {
    name: "open_application",
    category: "DESKTOP",
    description: "Launch or switch to a Windows desktop application (e.g., chrome, notepad, calc).",
    riskLevel: "MEDIUM",
    requiredScope: "desktop:control",
    parameters: {
      appName: { type: "string", description: "Application name or executable command", required: true },
    },
  },
  type_text: {
    name: "type_text",
    category: "DESKTOP",
    description: "Type keyboard text into the currently active Windows application.",
    riskLevel: "MEDIUM",
    requiredScope: "desktop:control",
    parameters: {
      text: { type: "string", description: "Text content to simulate typing", required: true },
    },
  },
  press_hotkey: {
    name: "press_hotkey",
    category: "DESKTOP",
    description: "Send keyboard shortcut combination (e.g. ['ctrl', 'c'], ['alt', 'tab']).",
    riskLevel: "MEDIUM",
    requiredScope: "desktop:control",
    parameters: {
      keys: { type: "string", description: "Comma-separated key names", required: true },
    },
  },
  close_window: {
    name: "close_window",
    category: "DESKTOP",
    description: "Close an active desktop application window or terminate process.",
    riskLevel: "HIGH",
    requiredScope: "desktop:control",
    parameters: {
      windowTitle: { type: "string", description: "Title or process name to close", required: true },
    },
  },
  execute_shell_command: {
    name: "execute_shell_command",
    category: "SYSTEM",
    description: "Execute a command line or powershell script on the host system.",
    riskLevel: "HIGH",
    requiredScope: "desktop:control",
    parameters: {
      command: { type: "string", description: "The exact shell command line", required: true },
    },
  },
  shutdown_system: {
    name: "shutdown_system",
    category: "SYSTEM",
    description: "Request system shutdown, reboot, or sleep mode.",
    riskLevel: "HIGH",
    requiredScope: "desktop:control",
    parameters: {
      action: { type: "string", description: "shutdown, restart, or sleep", required: true },
    },
  },
};

export interface ToolValidationResult {
  allowed: boolean;
  requiresConfirmation: boolean;
  reason?: string;
  riskLevel: RiskLevel;
}

/**
 * Validates whether an agent or user is authorized to execute a tool,
 * and whether high-risk execution requires explicit user confirmation.
 */
export function validateToolExecution(
  toolName: string,
  grantedScopes: string[],
  isConfirmed: boolean = false
): ToolValidationResult {
  const tool = TOOL_REGISTRY[toolName];
  if (!tool) {
    return {
      allowed: false,
      requiresConfirmation: false,
      reason: `Unknown tool: ${toolName}`,
      riskLevel: "LOW",
    };
  }

  // Check permission scope
  const hasScope =
    grantedScopes.includes("*") || grantedScopes.includes(tool.requiredScope);
  if (!hasScope) {
    return {
      allowed: false,
      requiresConfirmation: false,
      reason: `Device lacks required permission scope: '${tool.requiredScope}'`,
      riskLevel: tool.riskLevel,
    };
  }

  // Check risk level confirmation
  if (tool.riskLevel === "HIGH" && !isConfirmed) {
    return {
      allowed: false,
      requiresConfirmation: true,
      reason: `Tool '${toolName}' has HIGH risk level and requires explicit user confirmation before execution.`,
      riskLevel: "HIGH",
    };
  }

  return {
    allowed: true,
    requiresConfirmation: false,
    riskLevel: tool.riskLevel,
  };
}

