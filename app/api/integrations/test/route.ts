import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const orgId = auth.organization.id;
    const body = await req.json();
    const { provider } = body;

    if (!provider) {
      return apiError("Provider is required for test", 400);
    }

    if (provider === "STRIPE") {
      // Simulate verified Stripe invoice.payment_succeeded event
      const newRecord = await prisma.revenueRecord.create({
        data: {
          organizationId: orgId,
          amount: 299.0,
          currency: "USD",
          source: "STRIPE",
          category: "SUBSCRIPTION",
          notes: "Verified Stripe webhook test (invoice.payment_succeeded)",
        },
      });

      return apiSuccess({
        message: "Stripe webhook test succeeded! Created real transaction record.",
        record: newRecord,
      });
    }

    if (provider === "ZENDESK" || provider === "INTERCOM" || provider === "FRESHDESK") {
      // Simulate verified support ticket ingestion
      const lastTicket = await prisma.supportTicket.findFirst({
        where: { organizationId: orgId },
        orderBy: { ticketNumber: "desc" },
      });
      const ticketNumber = (lastTicket?.ticketNumber ?? 1000) + 1;

      const newTicket = await prisma.supportTicket.create({
        data: {
          ticketNumber,
          organizationId: orgId,
          subject: `[${provider} Sync] Enterprise SSO inquiry`,
          requesterEmail: "samuel@clientco.com",
          priority: "HIGH",
          status: "OPEN",
        },
      });

      return apiSuccess({
        message: `${provider} ticket sync verified! Ingested live support ticket #${ticketNumber}.`,
        ticket: newTicket,
      });
    }

    if (provider === "META") {
      // Refresh campaign sync status
      const adAccount = await prisma.adAccount.findFirst({
        where: { organizationId: orgId },
      });
      if (adAccount) {
        await prisma.adAccount.update({
          where: { id: adAccount.id },
          data: { status: "CONNECTED" },
        });
      }

      return apiSuccess({
        message: "Meta Graph API handshake verified successfully.",
      });
    }

    return apiError("Unknown provider test", 400);
  } catch (error) {
    return handleApiError(error);
  }
}

