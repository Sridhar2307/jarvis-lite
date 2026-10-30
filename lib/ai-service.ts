import { prisma } from "./prisma";

export interface BusinessContext {
  organizationName: string;
  mrr: number;
  arr: number;
  activeUsers: number;
  openTicketsCount: number;
  recentTickets: Array<{ id: string; subject: string; priority: string }>;
  scheduledPostsCount: number;
  adSpend: number;
  adRoas: number;
}

export async function getOrganizationBusinessContext(
  organizationId: string
): Promise<BusinessContext> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });

  const storedMetrics = await prisma.businessMetric.findMany({
    where: { organizationId },
  });

  const mrr = storedMetrics.find((m) => m.metricKey === "MRR")?.value ?? 0;
  const arr = storedMetrics.find((m) => m.metricKey === "ARR")?.value ?? (mrr * 12);
  const activeUsers = storedMetrics.find((m) => m.metricKey === "ACTIVE_USERS")?.value ?? 0;

  const openTickets = await prisma.supportTicket.findMany({
    where: { organizationId, status: { in: ["OPEN", "IN_PROGRESS"] } },
    select: { ticketNumber: true, subject: true, priority: true },
    take: 5,
  });

  const scheduledPostsCount = await prisma.socialPost.count({
    where: { organizationId, status: "SCHEDULED" },
  });

  const adAccount = await prisma.adAccount.findFirst({
    where: { organizationId },
    include: { campaigns: true },
  });

  const adSpend = adAccount?.campaigns.reduce((sum, c) => sum + c.spend, 0) ?? 0;
  const adRoas = adAccount?.campaigns.length
    ? adAccount.campaigns.reduce((sum, c) => sum + c.roas, 0) / adAccount.campaigns.length
    : 0;

  return {
    organizationName: org?.name ?? "Business",
    mrr,
    arr,
    activeUsers,
    openTicketsCount: openTickets.length,
    recentTickets: openTickets.map((t) => ({
      id: `#${t.ticketNumber}`,
      subject: t.subject,
      priority: t.priority,
    })),
    scheduledPostsCount,
    adSpend,
    adRoas,
  };
}

export async function generateAIResponse(
  userPrompt: string,
  context: BusinessContext,
  chatHistory: Array<{ role: string; text: string }> = []
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  // If no OpenAI API key is set, use the grounded local business engine
  if (!apiKey) {
    return generateGroundedLocalResponse(userPrompt, context);
  }

  const systemPrompt = `You are JARVIS Lite, an elite, highly concise executive AI co-pilot for ${context.organizationName}.
You have direct, real-time access to the company's verified database metrics.

Current Verified Business Facts:
- Monthly Recurring Revenue (MRR): $${context.mrr.toLocaleString()}
- Annual Recurring Revenue (ARR): $${context.arr.toLocaleString()}
- Active Users: ${context.activeUsers.toLocaleString()}
- Open Support Tickets: ${context.openTicketsCount} (${context.recentTickets.map(t => `${t.id}: ${t.subject} [${t.priority}]`).join("; ") || "None"})
- Queued Social Posts: ${context.scheduledPostsCount}
- Meta Ad Spend: $${context.adSpend.toFixed(2)}, Average ROAS: ${context.adRoas.toFixed(1)}x

STRICT GUIDELINES:
1. Always base financial answers directly on these verified facts. NEVER invent or hallucinate financial figures.
2. If the user asks about an unknown metric or if data is not present in the verified facts, state clearly: "That data is not currently recorded in the database."
3. Be crisp, professional, and actionable. Keep responses concise (1-3 sentences or short bullets).`;

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.slice(-6).map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: userPrompt },
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.3,
        max_tokens: 350,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[OPENAI_API_ERROR]", res.status, errText);
      return generateGroundedLocalResponse(userPrompt, context);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "I was unable to parse a response from the AI service.";
  } catch (err) {
    console.error("[AI_SERVICE_FETCH_ERROR]", err);
    return generateGroundedLocalResponse(userPrompt, context);
  }
}

function generateGroundedLocalResponse(query: string, ctx: BusinessContext): string {
  const lower = query.toLowerCase();

  if (lower.includes("mrr") || lower.includes("revenue") || lower.includes("financial") || lower.includes("money")) {
    return `Verified Financial Snapshot: Current MRR is $${ctx.mrr.toLocaleString()} and ARR is $${ctx.arr.toLocaleString()}. All figures are derived from verified database records.`;
  }

  if (lower.includes("ticket") || lower.includes("support") || lower.includes("customer")) {
    if (ctx.openTicketsCount === 0) {
      return `Support Inbox is clear: 0 open tickets recorded in the database.`;
    }
    const ticketSummary = ctx.recentTickets.map(t => `${t.id} (${t.priority} priority: "${t.subject}")`).join(", ");
    return `You have ${ctx.openTicketsCount} open support tickets requiring attention: ${ticketSummary}.`;
  }

  if (lower.includes("ad") || lower.includes("campaign") || lower.includes("roas") || lower.includes("meta")) {
    return `Ad Performance: Total tracked Meta spend is $${ctx.adSpend.toFixed(2)} with an average ROAS of ${ctx.adRoas.toFixed(1)}x across connected campaigns.`;
  }

  if (lower.includes("post") || lower.includes("social") || lower.includes("instagram") || lower.includes("linkedin") || lower.includes("twitter") || lower.includes("x")) {
    return `Social Media Hub: You currently have ${ctx.scheduledPostsCount} post(s) queued across your connected channels.`;
  }

  if (lower.includes("briefing") || lower.includes("morning") || lower.includes("summary") || lower.includes("status")) {
    return `Executive Briefing for ${ctx.organizationName}: MRR is $${ctx.mrr.toLocaleString()}, ${ctx.openTicketsCount} support tickets pending, ${ctx.scheduledPostsCount} social post(s) scheduled, and ad ROAS stands at ${ctx.adRoas.toFixed(1)}x. (Note: Set OPENAI_API_KEY in .env for custom conversational capabilities).`;
  }

  return `Jarvis Grounded Intelligence: Recorded MRR is $${ctx.mrr.toLocaleString()}, with ${ctx.activeUsers.toLocaleString()} active users and ${ctx.openTicketsCount} open tickets. Configure OPENAI_API_KEY in .env for unrestricted conversational reasoning.`;
}

