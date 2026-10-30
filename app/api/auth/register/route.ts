import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSessionToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      return apiError("A user with this email already exists", 409);
    }

    const passwordHash = await hashPassword(data.password);
    const orgName = data.organizationName?.trim() || `${data.name || "Default"}'s Workspace`;
    const orgSlug = `${orgName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;

    // Create User, Organization, and Membership in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          name: data.name || null,
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: orgName,
          slug: orgSlug,
        },
      });

      const membership = await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "OWNER",
        },
      });

      // Initialize default ad account and subscription plans for the organization
      await tx.adAccount.create({
        data: {
          organizationId: organization.id,
          accountName: "Meta Ads Primary",
          platform: "META",
          status: "DISCONNECTED",
        },
      });

      await tx.subscriptionPlan.createMany({
        data: [
          { organizationId: organization.id, name: "Starter", price: 29.0, interval: "month" },
          { organizationId: organization.id, name: "Pro", price: 79.0, interval: "month" },
          { organizationId: organization.id, name: "Enterprise", price: 299.0, interval: "month" },
        ],
      });

      return { user, organization, membership };
    });

    const token = await signSessionToken({
      userId: result.user.id,
      email: result.user.email,
      organizationId: result.organization.id,
      role: result.membership.role,
    });

    const response = apiSuccess(
      {
        user: { id: result.user.id, email: result.user.email, name: result.user.name },
        organization: { id: result.organization.id, name: result.organization.name },
        role: result.membership.role,
      },
      201
    );

    response.cookies.set(
      SESSION_COOKIE_OPTIONS.name,
      token,
      SESSION_COOKIE_OPTIONS
    );

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

