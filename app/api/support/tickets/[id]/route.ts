import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateSupportTicketSchema } from "@/lib/validations";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const data = updateSupportTicketSchema.parse(body);

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: params.id,
        organizationId: auth.organization.id,
      },
    });

    if (!ticket) {
      return apiError("Ticket not found", 404);
    }

    const updated = await prisma.supportTicket.update({
      where: { id: params.id },
      data: {
        ...(data.subject && { subject: data.subject }),
        ...(data.priority && { priority: data.priority }),
        ...(data.status && { status: data.status }),
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(req);

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: params.id,
        organizationId: auth.organization.id,
      },
    });

    if (!ticket) {
      return apiError("Ticket not found", 404);
    }

    await prisma.supportTicket.delete({
      where: { id: params.id },
    });

    return apiSuccess({ message: "Ticket deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

