import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supportTicketSchema } from "@/lib/validations";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("q")?.toLowerCase();
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const tickets = await prisma.supportTicket.findMany({
      where: {
        organizationId: auth.organization.id,
        ...(status && { status }),
        ...(priority && { priority }),
        ...(query && {
          OR: [
            { subject: { contains: query } },
            { requesterEmail: { contains: query } },
          ],
        }),
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        notes: { orderBy: { createdAt: "desc" }, take: 3 },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = tickets.map((t) => ({
      id: `#${t.ticketNumber}`,
      dbId: t.id,
      subject: t.subject,
      requester: t.requesterEmail,
      priority: t.priority === "HIGH" ? "High" : t.priority === "MEDIUM" ? "Medium" : "Low",
      status: t.status === "OPEN" ? "Open" : t.status === "IN_PROGRESS" ? "In progress" : t.status === "RESOLVED" ? "Resolved" : "Closed",
      time: formatRelativeTime(t.createdAt),
      rawTime: t.createdAt,
    }));

    return apiSuccess({ tickets: formatted, count: formatted.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const data = supportTicketSchema.parse(body);

    // Get max ticket number
    const lastTicket = await prisma.supportTicket.findFirst({
      where: { organizationId: auth.organization.id },
      orderBy: { ticketNumber: "desc" },
    });

    const ticketNumber = (lastTicket?.ticketNumber ?? 1000) + 1;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        organizationId: auth.organization.id,
        subject: data.subject,
        requesterEmail: data.requesterEmail,
        priority: data.priority,
        status: data.status,
      },
    });

    return apiSuccess(
      {
        id: `#${ticket.ticketNumber}`,
        dbId: ticket.id,
        subject: ticket.subject,
        requester: ticket.requesterEmail,
        priority: ticket.priority === "HIGH" ? "High" : ticket.priority === "MEDIUM" ? "Medium" : "Low",
        status: ticket.status === "OPEN" ? "Open" : ticket.status === "IN_PROGRESS" ? "In progress" : "Resolved",
        time: "Just now",
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

