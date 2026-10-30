import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveIntegrationSchema } from "@/lib/validations";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const orgId = auth.organization.id;

    const credentials = await prisma.integrationCredential.findMany({
      where: { organizationId: orgId },
    });

    const statusMap: Record<
      string,
      {
        status: string;
        apiKeyMasked: string | null;
        lastSyncedAt: Date | null;
        metadata: Record<string, unknown> | null;
      }
    > = {
      OPENAI: {
        status: process.env.OPENAI_API_KEY ? "CONNECTED" : "NOT_CONFIGURED",
        apiKeyMasked: process.env.OPENAI_API_KEY ? "sk-••••••••" : null,
        lastSyncedAt: null,
        metadata: null,
      },
      GEMINI: {
        status: process.env.GEMINI_API_KEY ? "CONNECTED" : "NOT_CONFIGURED",
        apiKeyMasked: process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 4)}••••••••` : null,
        lastSyncedAt: null,
        metadata: null,
      },
      META: {
        status: process.env.META_APP_ID ? "CONNECTED" : "NOT_CONFIGURED",
        apiKeyMasked: null,
        lastSyncedAt: null,
        metadata: null,
      },
      STRIPE: {
        status: process.env.STRIPE_SECRET_KEY ? "CONNECTED" : "NOT_CONFIGURED",
        apiKeyMasked: null,
        lastSyncedAt: null,
        metadata: null,
      },
      REVENUECAT: {
        status: "NOT_CONFIGURED",
        apiKeyMasked: null,
        lastSyncedAt: null,
        metadata: null,
      },
      ZENDESK: {
        status: "NOT_CONFIGURED",
        apiKeyMasked: null,
        lastSyncedAt: null,
        metadata: null,
      },
      INTERCOM: {
        status: "NOT_CONFIGURED",
        apiKeyMasked: null,
        lastSyncedAt: null,
        metadata: null,
      },
    };

    credentials.forEach((c) => {
      let parsedMeta = null;
      if (c.metadataJson) {
        try {
          parsedMeta = JSON.parse(c.metadataJson);
        } catch {
          parsedMeta = null;
        }
      }
      statusMap[c.provider] = {
        status: c.status,
        apiKeyMasked: c.apiKeyMasked,
        lastSyncedAt: c.lastSyncedAt,
        metadata: parsedMeta,
      };
    });

    return apiSuccess({ integrations: statusMap });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const orgId = auth.organization.id;
    const body = await req.json();
    const data = saveIntegrationSchema.parse(body);

    const masked = data.apiKey
      ? `${data.apiKey.substring(0, 4)}••••••••${data.apiKey.slice(-4)}`
      : null;

    const metadata: Record<string, unknown> = {};
    if (data.webhookSecret) metadata.webhookSecret = `${data.webhookSecret.substring(0, 5)}••••`;
    if (data.subdomain) metadata.subdomain = data.subdomain;
    if (data.adAccountId) metadata.adAccountId = data.adAccountId;

    const credential = await prisma.integrationCredential.upsert({
      where: {
        organizationId_provider: {
          organizationId: orgId,
          provider: data.provider,
        },
      },
      update: {
        status: data.status,
        ...(masked && { apiKeyMasked: masked }),
        metadataJson: JSON.stringify(metadata),
        lastSyncedAt: new Date(),
      },
      create: {
        organizationId: orgId,
        provider: data.provider,
        status: data.status,
        apiKeyMasked: masked,
        metadataJson: JSON.stringify(metadata),
        lastSyncedAt: new Date(),
      },
    });

    // If provider is META, also update the AdAccount status
    if (data.provider === "META") {
      const adAccount = await prisma.adAccount.findFirst({
        where: { organizationId: orgId },
      });
      if (adAccount) {
        await prisma.adAccount.update({
          where: { id: adAccount.id },
          data: { status: data.status },
        });
      }
    }

    return apiSuccess({
      message: `${data.provider} integration updated successfully`,
      credential,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const orgId = auth.organization.id;
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");

    if (!provider) {
      return apiError("Provider is required", 400);
    }

    await prisma.integrationCredential.deleteMany({
      where: { organizationId: orgId, provider },
    });

    if (provider === "META") {
      const adAccount = await prisma.adAccount.findFirst({
        where: { organizationId: orgId },
      });
      if (adAccount) {
        await prisma.adAccount.update({
          where: { id: adAccount.id },
          data: { status: "DISCONNECTED" },
        });
      }
    }

    return apiSuccess({ message: `${provider} integration disconnected` });
  } catch (error) {
    return handleApiError(error);
  }
}
