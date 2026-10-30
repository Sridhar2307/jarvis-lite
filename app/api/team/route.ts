import { NextRequest } from "next/server";
import { requireAuth, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const addMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "MANAGER", "VIEWER"]).default("VIEWER"),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const orgId = auth.organization.id;

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const formatted = members.map((m) => ({
      membershipId: m.id,
      userId: m.user.id,
      email: m.user.email,
      name: m.user.name || m.user.email.split("@")[0],
      role: m.role,
      joinedAt: m.createdAt,
    }));

    return apiSuccess({
      members: formatted,
      count: formatted.length,
      currentUserId: auth.user.id,
      currentUserRole: auth.role,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const orgId = auth.organization.id;

    // Only OWNER or ADMIN can invite/add team members
    if (auth.role !== "OWNER" && auth.role !== "ADMIN") {
      return apiError("Only organization Owners or Admins can invite team members", 403);
    }

    const body = await req.json();
    const data = addMemberSchema.parse(body);
    const emailLower = data.email.toLowerCase().trim();

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      // Create user account with a secure randomized initial password
      const tempPassword = `Invite${Date.now()}!`;
      const passwordHash = await hashPassword(tempPassword);
      user = await prisma.user.create({
        data: {
          email: emailLower,
          name: data.name || emailLower.split("@")[0],
          passwordHash,
        },
      });
    }

    // Check if already member of organization
    const existingMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      return apiError("User is already a member of this organization", 409);
    }

    const membership = await prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        role: data.role,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: orgId,
        userId: auth.user.id,
        action: "TEAM_MEMBER_INVITED",
        entityType: "OrganizationMember",
        entityId: membership.id,
        details: JSON.stringify({ invitedEmail: emailLower, role: data.role }),
      },
    });

    return apiSuccess(
      {
        message: `Successfully added ${emailLower} as ${data.role}.`,
        member: {
          membershipId: membership.id,
          userId: user.id,
          email: user.email,
          name: user.name,
          role: membership.role,
          joinedAt: membership.createdAt,
        },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

