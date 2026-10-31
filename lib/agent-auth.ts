import crypto from "crypto";
import { prisma } from "./prisma";

export interface AgentDeviceAuth {
  deviceId: string;
  organizationId: string;
  deviceName: string;
  scopes: string[];
  status: string;
}

/**
 * Compute SHA-256 hash of a bearer token or refresh token.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

/**
 * Generate a cryptographically secure random token (64 hex characters).
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate a human-friendly pairing code format: JARVIS-XXXXXX
 */
export function generatePairingCode(): string {
  const num = crypto.randomInt(100000, 999999);
  return `JARVIS-${num}`;
}

/**
 * Authenticate incoming requests originating from a Python Nexora agent.
 * Checks the Authorization header: `Bearer <token>`.
 */
export async function authenticateAgentRequest(
  request: Request
): Promise<AgentDeviceAuth | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const rawToken = authHeader.substring(7).trim();
  if (!rawToken) {
    return null;
  }

  const tokenHash = hashToken(rawToken);

  try {
    const credential = await prisma.agentCredential.findFirst({
      where: {
        tokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        device: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!credential || !credential.device) {
      return null;
    }

    if (credential.device.status === "REVOKED") {
      return null;
    }

    // Update last seen timestamp asynchronously (don't block)
    prisma.agentDevice
      .update({
        where: { id: credential.device.id },
        data: { lastSeenAt: new Date(), status: "ONLINE" },
      })
      .catch((err) => console.error("Failed to update agent lastSeenAt:", err));

    const scopes = credential.scopes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      deviceId: credential.device.id,
      organizationId: credential.device.organizationId,
      deviceName: credential.device.deviceName,
      scopes,
      status: credential.device.status,
    };
  } catch (err) {
    console.error("Agent authentication error:", err);
    return null;
  }
}

/**
 * Verify whether an authenticated device has the required permission scope.
 */
export function hasAgentScope(
  auth: AgentDeviceAuth,
  requiredScope: string
): boolean {
  return auth.scopes.includes("*") || auth.scopes.includes(requiredScope);
}

