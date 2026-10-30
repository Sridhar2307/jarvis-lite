import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const orgId = auth.organization.id;

    // Fetch live records
    const [revenueRecords, tickets, posts, adAccount, plans, subscribers] = await Promise.all([
      prisma.revenueRecord.findMany({ where: { organizationId: orgId }, orderBy: { recordedAt: "desc" } }),
      prisma.supportTicket.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } }),
      prisma.socialPost.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } }),
      prisma.adAccount.findFirst({ where: { organizationId: orgId }, include: { campaigns: true } }),
      prisma.subscriptionPlan.findMany({ where: { organizationId: orgId } }),
      prisma.subscriber.findMany({ where: { organizationId: orgId } }),
    ]);

    const lines: string[] = [];
    lines.push(`JARVIS LITE EXECUTIVE DATA EXPORT`);
    lines.push(`Organization,${auth.organization.name}`);
    lines.push(`Exported At,${new Date().toISOString()}`);
    lines.push(`Authenticated User,${auth.user.email} (${auth.role})`);
    lines.push(``);

    // 1. Revenue Records Section
    lines.push(`--- REVENUE & FINANCIAL TRANSACTIONS ---`);
    lines.push(`ID,Amount (USD),Category,Source Channel,Date,Notes`);
    revenueRecords.forEach((r) => {
      lines.push(`"${r.id}",${r.amount},"${r.category}","${r.source}","${r.recordedAt.toISOString()}","${(r.notes || "").replace(/"/g, '""')}"`);
    });
    lines.push(``);

    // 2. Customer Support Tickets Section
    lines.push(`--- CUSTOMER SUPPORT TICKETS ---`);
    lines.push(`Ticket #,Subject,Requester,Priority,Status,Created At`);
    tickets.forEach((t) => {
      lines.push(`#${t.ticketNumber},"${t.subject.replace(/"/g, '""')}","${t.requesterEmail}",${t.priority},${t.status},"${t.createdAt.toISOString()}"`);
    });
    lines.push(``);

    // 3. Social Broadcast Queue Section
    lines.push(`--- SOCIAL MEDIA BROADCAST QUEUE ---`);
    lines.push(`Platform,Status,Scheduled For,Content`);
    posts.forEach((p) => {
      lines.push(`${p.platform},${p.status},"${p.scheduledTimeString || ""},"${p.content.replace(/"/g, '""')}"`);
    });
    lines.push(``);

    // 4. Meta Ad Campaigns Section
    lines.push(`--- ADVERTISING CAMPAIGNS ---`);
    lines.push(`Campaign Name,Status,Spend ($),CTR (%),ROAS (x),Clicks,Impressions`);
    (adAccount?.campaigns || []).forEach((c) => {
      lines.push(`"${c.name.replace(/"/g, '""')}",${c.status},${c.spend},${c.ctr},${c.roas},${c.clicks},${c.impressions}`);
    });
    lines.push(``);

    // 5. Subscription Plans & Subscribers Section
    lines.push(`--- SUBSCRIPTIONS & PLANS ---`);
    lines.push(`Plan Name,Price ($),Total Active Subscribers`);
    plans.forEach((pl) => {
      const activeCount = subscribers.filter((s) => s.planId === pl.id && s.status === "ACTIVE").length;
      lines.push(`"${pl.name}",${pl.price},${activeCount}`);
    });

    const csvContent = lines.join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="jarvis-${auth.organization.slug}-report-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

