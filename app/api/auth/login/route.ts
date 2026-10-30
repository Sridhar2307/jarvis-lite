import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signSessionToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: {
        memberships: {
          include: {
            organization: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return apiError("Invalid email or password", 401);
    }

    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      return apiError("Invalid email or password", 401);
    }

    if (!user.memberships.length) {
      return apiError("User has no associated organizations", 403);
    }

    const primaryMembership = user.memberships[0];

    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      organizationId: primaryMembership.organizationId,
      role: primaryMembership.role,
    });

    const response = apiSuccess({
      user: { id: user.id, email: user.email, name: user.name },
      organization: {
        id: primaryMembership.organization.id,
        name: primaryMembership.organization.name,
      },
      role: primaryMembership.role,
    });

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

