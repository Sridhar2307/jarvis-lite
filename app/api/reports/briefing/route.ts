import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getOrganizationBusinessContext } from "@/lib/ai-service";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const orgId = auth.organization.id;

    const ctx = await getOrganizationBusinessContext(orgId);

    const urgentTickets = ctx.recentTickets.filter(
      (t) => t.priority === "HIGH" && t.status !== "RESOLVED" && t.status !== "CLOSED"
    );

    const topCampaign = ctx.campaigns.reduce(
      (best, c) => (c.roas > (best?.roas || 0) ? c : best),
      ctx.campaigns[0]
    );

    const briefing = {
      generatedAt: new Date().toISOString(),
      organization: auth.organization.name,
      executive: auth.user.name || auth.user.email,
      headline: `Executive Briefing for ${auth.organization.name}`,
      kpis: {
        mrr: `$${ctx.mrr.toLocaleString()}`,
        mrrDelta: `${ctx.mrrDelta >= 0 ? "+" : ""}${ctx.mrrDelta}%`,
        arr: `$${ctx.arr.toLocaleString()}`,
        activeUsers: ctx.activeUsers.toLocaleString(),
        activeSubscribers: ctx.activeSubscribers.toLocaleString(),
        churnRate: `${ctx.churnRate}%`,
        adSpend: `$${ctx.adSpend.toFixed(2)}`,
        adRoas: `${ctx.adRoas.toFixed(1)}x`,
      },
      criticalAttention: {
        urgentTicketsCount: urgentTickets.length,
        urgentTickets: urgentTickets.map((t) => ({
          id: t.id,
          subject: t.subject,
          requester: t.requester,
        })),
        broadcastsReady: ctx.scheduledPostsCount,
        topPerformingCampaign: topCampaign
          ? `${topCampaign.name} (${topCampaign.roas}x ROAS)`
          : "None active",
      },
      recommendedActions: [
        urgentTickets.length > 0
          ? `Resolve ${urgentTickets.length} critical priority customer support ticket(s) immediately.`
          : "All high-priority support tickets are cleared.",
        topCampaign && topCampaign.roas >= 3.0
          ? `Scale budget on top-performing ad campaign '${topCampaign.name}' (current ROAS: ${topCampaign.roas}x).`
          : "Review underperforming ad campaigns to optimize ROAS.",
        ctx.scheduledPostsCount > 0
          ? `Review and verify ${ctx.scheduledPostsCount} scheduled social broadcasts in queue.`
          : "Queue upcoming promotional broadcasts in the Social Media Hub.",
      ],
      markdownText: `
# ⚡ Jarvis Lite Executive Morning Briefing
**Organization:** ${auth.organization.name}  
**Date:** ${new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}  
**Executive:** ${auth.user.name || auth.user.email} (${auth.role})

---

### 📊 Core Financial & Growth KPIs
- **Monthly Recurring Revenue (MRR):** $${ctx.mrr.toLocaleString()} (${ctx.mrrDelta >= 0 ? "+" : ""}${ctx.mrrDelta}%)
- **Annual Run Rate (ARR):** $${ctx.arr.toLocaleString()}
- **Active Platform Users:** ${ctx.activeUsers.toLocaleString()}
- **Active Paid Subscribers:** ${ctx.activeSubscribers.toLocaleString()} (Churn: ${ctx.churnRate}%)
- **Blended Ad Spend / ROAS:** $${ctx.adSpend.toFixed(2)} / ${ctx.adRoas.toFixed(1)}x

---

### 🚨 Operational Focus Items
- **High-Priority Tickets:** ${urgentTickets.length} pending
${urgentTickets.map((t) => `  - **${t.id}:** ${t.subject} (${t.requester})`).join("\n")}
- **Scheduled Social Posts:** ${ctx.scheduledPostsCount} in queue
- **Top Ad Performer:** ${topCampaign ? `${topCampaign.name} (${topCampaign.roas}x ROAS)` : "N/A"}

---

### 🎯 Recommended Strategic Actions
1. ${urgentTickets.length > 0 ? `Assign and resolve critical tickets: ${urgentTickets.map(t => t.id).join(", ")}` : "Support tickets are healthy."}
2. ${topCampaign ? `Increase allocation to ${topCampaign.name} while maintaining ${topCampaign.roas}x return.` : "Audit ad campaign creative."}
3. Maintain current momentum toward next revenue milestone.
      `.trim(),
    };

    return apiSuccess({ briefing });
  } catch (error) {
    return handleApiError(error);
  }
}
