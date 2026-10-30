import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return apiError("Stripe webhook secret is not configured on the server", 503);
  }

  if (!signature) {
    return apiError("Missing stripe-signature header", 400);
  }

  try {
    const rawBody = await req.text();
    // Verify event payload structure
    const event = JSON.parse(rawBody);

    // Handle subscription events
    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data?.object;
        const customerEmail = invoice?.customer_email;
        const amountPaid = (invoice?.amount_paid || 0) / 100;

        if (customerEmail && amountPaid > 0) {
          // Find subscriber or default organization
          const subscriber = await prisma.subscriber.findFirst({
            where: { customerEmail },
          });

          if (subscriber) {
            await prisma.revenueRecord.create({
              data: {
                organizationId: subscriber.organizationId,
                amount: amountPaid,
                category: "SUBSCRIPTION",
                source: "STRIPE",
                notes: `Stripe invoice ${invoice.id}`,
              },
            });
          }
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data?.object;
        const customerEmail = sub?.customer_email;
        if (customerEmail) {
          await prisma.subscriber.updateMany({
            where: { customerEmail },
            data: { status: "CANCELLED", cancelledAt: new Date() },
          });
        }
        break;
      }
    }

    return apiSuccess({ received: true });
  } catch (err) {
    console.error("[STRIPE_WEBHOOK_ERROR]", err);
    return apiError("Webhook processing failed", 400);
  }
}

