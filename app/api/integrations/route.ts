import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const orgId = auth.organization.id;

    const credentials = await prisma.integrationCredential.findMany({
      where: { organizationId: orgId },
    });

    const statusMap: Record<string, string> = {
      OPENAI: process.env.OPENAI_API_KEY ? "CONNECTED" : "NOT_CONFIGURED",
      META: process.env.META_APP_ID ? "CONFIGURED" : "NOT_CONFIGURED",
      STRIPE: process.env.STRIPE_SECRET_KEY ? "CONFIGURED" : "NOT_CONFIGURED",
      REVENUECAT: "NOT_CONFIGURED",
      ZENDESK: "NOT_CONFIGURED",
    };

    credentials.forEach((c) => {
      statusMap[c.provider] = c.status;
    });

    return apiSuccess({ integrations: statusMap });
  } catch (error) {
    return handleApiError(error);
  }
}

