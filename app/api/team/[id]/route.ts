import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateRoleSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MANAGER", "VIEWER"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(req);
    const orgId = auth.organization.id;

    if (auth.role !== "OWNER" && auth.role !== "ADMIN") {
      return apiError("Only organization Owners or Admins can modify member roles", 403);
    }

    const body = await req.json();
    const data = updateRoleSchema.parse(body);

    const membership = await prisma.organizationMember.findFirst({
      where: { id: params.id, organizationId: orgId },
      include: { user: true },
    });

    if (!membership) {
      return apiError("Member not found in organization", 404);
    }

    // Prevent non-owners from promoting to OWNER
    if (data.role === "OWNER" && auth.role !== "OWNER") {
      return apiError("Only the organization Owner can transfer ownership", 403);
    }

    // Prevent demoting the last OWNER
    if (membership.role === "OWNER" && data.role !== "OWNER") {
      const ownerCount = await prisma.organizationMember.count({
        where: { organizationId: orgId, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        return apiError("Cannot demote the only organization Owner", 400);
      }
    }

    const updated = await prisma.organizationMember.update({
      where: { id: params.id },
      data: { role: data.role },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    return apiSuccess({
      message: `Updated ${updated.user.email} role to ${updated.role}`,
      member: updated,
    });
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
    const orgId = auth.organization.id;

    if (auth.role !== "OWNER" && auth.role !== "ADMIN") {
      return apiError("Only organization Owners or Admins can remove members", 403);
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { id: params.id, organizationId: orgId },
    });

    if (!membership) {
      return apiError("Member not found", 404);
    }

    if (membership.role === "OWNER") {
      return apiError("Cannot remove the organization Owner", 400);
    }

    await prisma.organizationMember.delete({
      where: { id: params.id },
    });

    return apiSuccess({ message: "Team member removed from organization successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
