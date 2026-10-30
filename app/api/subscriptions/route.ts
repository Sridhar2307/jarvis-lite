import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const orgId = auth.organization.id;

    const plans = await prisma.subscriptionPlan.findMany({
      where: { organizationId: orgId },
      include: {
        _count: {
          select: { subscribers: { where: { status: "ACTIVE" } } },
        },
      },
      orderBy: { price: "asc" },
    });

    const totalSubscribers = await prisma.subscriber.count({
      where: { organizationId: orgId },
    });

    const activeSubscribers = await prisma.subscriber.count({
      where: { organizationId: orgId, status: "ACTIVE" },
    });

    const cancelledSubscribers = await prisma.subscriber.count({
      where: { organizationId: orgId, status: "CANCELLED" },
    });

    // Calculate MRR from active subscribers * plan price
    let calculatedMrr = 0;
    const planBreakdown = plans.map((plan) => {
      const count = plan._count.subscribers;
      calculatedMrr += count * plan.price;
      const share = activeSubscribers > 0 ? `${Math.round((count / activeSubscribers) * 100)}%` : "0%";
      return {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        subscribers: count,
        share,
      };
    });

    const churnRate = totalSubscribers > 0 ? ((cancelledSubscribers / totalSubscribers) * 100).toFixed(1) : "0.0";

    // If no real subscribers entered yet, check if stored metrics exist for MRR
    const storedMrr = await prisma.businessMetric.findFirst({
      where: { organizationId: orgId, metricKey: "MRR" },
    });

    const displayMrr = calculatedMrr > 0 ? calculatedMrr : (storedMrr?.value ?? 0);
    const displaySubscribers = activeSubscribers > 0 ? activeSubscribers : (plans.length > 0 && calculatedMrr > 0 ? activeSubscribers : 0);

    return apiSuccess({
      stats: [
        {
          label: "MRR",
          value: `$${displayMrr.toLocaleString()}`,
          raw: displayMrr,
          delta: 4.2,
        },
        {
          label: "Active subscribers",
          value: displaySubscribers.toLocaleString(),
          raw: displaySubscribers,
          delta: 3.4,
        },
        {
          label: "Churn rate",
          value: `${churnRate}%`,
          raw: parseFloat(churnRate),
          delta: -0.4,
        },
      ],
      plans: planBreakdown.length > 0 ? planBreakdown : [
        { name: "Starter", subscribers: 0, share: "0%" },
        { name: "Pro", subscribers: 0, share: "0%" },
        { name: "Enterprise", subscribers: 0, share: "0%" },
      ],
      totalSubscribers,
      activeSubscribers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

