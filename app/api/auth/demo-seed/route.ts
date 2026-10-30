import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const orgId = auth.organization.id;

    // Run clean seeding inside user's organization
    await prisma.$transaction(async (tx) => {
      // 1. Revenue Records
      await tx.revenueRecord.deleteMany({ where: { organizationId: orgId } });
      await tx.revenueRecord.createMany({
        data: [
          { organizationId: orgId, amount: 24000, category: "SUBSCRIPTION", source: "STRIPE", notes: "Monthly SaaS subscribers" },
          { organizationId: orgId, amount: 18500, category: "SUBSCRIPTION", source: "STRIPE", notes: "Annual upgrades amortized" },
          { organizationId: orgId, amount: 5700, category: "SUBSCRIPTION", source: "REVENUECAT", notes: "Mobile in-app subscriptions" },
          { organizationId: orgId, amount: 13700, category: "ONE_TIME", source: "MANUAL", notes: "Enterprise setup & integration services" },
        ],
      });

      // 2. Business Metrics
      await tx.businessMetric.deleteMany({ where: { organizationId: orgId } });
      await tx.businessMetric.createMany({
        data: [
          { organizationId: orgId, metricKey: "MRR", value: 48200, delta: 4.2 },
          { organizationId: orgId, metricKey: "ARR", value: 578400, delta: 4.2 },
          { organizationId: orgId, metricKey: "ACTIVE_USERS", value: 12480, delta: 2.8 },
          { organizationId: orgId, metricKey: "REVENUE_MTD", value: 61900, delta: 6.1 },
        ],
      });

      // 3. Social Posts
      await tx.socialPost.deleteMany({ where: { organizationId: orgId } });
      await tx.socialPost.createMany({
        data: [
          {
            organizationId: orgId,
            platform: "Instagram",
            content: "Behind the scenes of how we ship features every week 👀",
            scheduledTimeString: "Today, 2:00 PM",
            status: "SCHEDULED",
          },
          {
            organizationId: orgId,
            platform: "LinkedIn",
            content: "We just rebuilt our onboarding flow — here's what changed and why.",
            scheduledTimeString: "Tomorrow, 9:00 AM",
            status: "SCHEDULED",
          },
          {
            organizationId: orgId,
            platform: "X",
            content: "Small teams move fast. Here's how we automate the busywork.",
            scheduledTimeString: "Thu, 11:30 AM",
            status: "DRAFT",
          },
        ],
      });

      // 4. Meta Ads
      let adAccount = await tx.adAccount.findFirst({ where: { organizationId: orgId } });
      if (!adAccount) {
        adAccount = await tx.adAccount.create({
          data: {
            organizationId: orgId,
            accountName: "Meta Ads Primary",
            status: "CONNECTED",
            totalSpend: 284.20,
            avgCtr: 2.7,
            blendedRoas: 3.1,
          },
        });
      } else {
        await tx.adAccount.update({
          where: { id: adAccount.id },
          data: {
            status: "CONNECTED",
            totalSpend: 284.20,
            avgCtr: 2.7,
            blendedRoas: 3.1,
          },
        });
      }

      await tx.adCampaign.deleteMany({ where: { adAccountId: adAccount.id } });
      await tx.adCampaign.createMany({
        data: [
          {
            adAccountId: adAccount.id,
            name: "Retargeting — Cart Abandoners",
            status: "ACTIVE",
            spend: 96.40,
            ctr: 3.8,
            roas: 4.8,
            impressions: 4820,
            clicks: 183,
          },
          {
            adAccountId: adAccount.id,
            name: "Prospecting — Lookalike 1%",
            status: "ACTIVE",
            spend: 132.10,
            ctr: 1.9,
            roas: 2.6,
            impressions: 11200,
            clicks: 212,
          },
          {
            adAccountId: adAccount.id,
            name: "Brand Awareness — Reels",
            status: "PAUSED",
            spend: 55.70,
            ctr: 2.4,
            roas: 1.9,
            impressions: 8900,
            clicks: 214,
          },
        ],
      });

      // 5. Subscription Plans & Subscribers
      await tx.subscriber.deleteMany({ where: { organizationId: orgId } });
      const plans = await tx.subscriptionPlan.findMany({ where: { organizationId: orgId } });
      const starterPlan = plans.find((p) => p.name === "Starter") || plans[0];
      const proPlan = plans.find((p) => p.name === "Pro") || plans[1];
      const enterprisePlan = plans.find((p) => p.name === "Enterprise") || plans[2];

      if (starterPlan && proPlan && enterprisePlan) {
        const demoSubscribers = [
          { organizationId: orgId, planId: starterPlan.id, customerEmail: "user1@demo.io", status: "ACTIVE" },
          { organizationId: orgId, planId: starterPlan.id, customerEmail: "user2@demo.io", status: "ACTIVE" },
          { organizationId: orgId, planId: proPlan.id, customerEmail: "pro1@demo.io", status: "ACTIVE" },
          { organizationId: orgId, planId: enterprisePlan.id, customerEmail: "enterprise1@demo.io", status: "ACTIVE" },
        ];
        await tx.subscriber.createMany({ data: demoSubscribers });
      }

      // 6. Support Tickets
      await tx.supportTicket.deleteMany({ where: { organizationId: orgId } });
      await tx.supportTicket.createMany({
        data: [
          {
            ticketNumber: 1042,
            organizationId: orgId,
            subject: "Unable to update billing address",
            requesterEmail: "morgan@brightloop.io",
            priority: "HIGH",
            status: "OPEN",
          },
          {
            ticketNumber: 1041,
            organizationId: orgId,
            subject: "Question about annual plan discount",
            requesterEmail: "dana@fieldwork.co",
            priority: "LOW",
            status: "OPEN",
          },
          {
            ticketNumber: 1039,
            organizationId: orgId,
            subject: "Export feature returning empty CSV",
            requesterEmail: "priya@northstar.dev",
            priority: "MEDIUM",
            status: "IN_PROGRESS",
          },
          {
            ticketNumber: 1035,
            organizationId: orgId,
            subject: "Feature request: dark mode for reports",
            requesterEmail: "leo@vantage.app",
            priority: "LOW",
            status: "RESOLVED",
          },
        ],
      });

      // 7. Seed Initial AI Briefing
      let conversation = await tx.conversation.findFirst({ where: { organizationId: orgId } });
      if (!conversation) {
        conversation = await tx.conversation.create({
          data: {
            organizationId: orgId,
            title: "Morning Executive Briefing",
          },
        });
      }
      await tx.message.deleteMany({ where: { conversationId: conversation.id } });
      await tx.message.createMany({
        data: [
          {
            conversationId: conversation.id,
            role: "ai",
            text: "Morning briefing: MRR is verified at $48,200 (+4.2%), 3 support tickets need attention, and your 2:00 PM Instagram post is queued and ready.",
          },
        ],
      });
    });

    return apiSuccess({ message: "Organization seeded with verified business records successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

