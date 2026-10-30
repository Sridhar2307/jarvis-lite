import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { socialPostSchema } from "@/lib/validations";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    const posts = await prisma.socialPost.findMany({
      where: { organizationId: auth.organization.id },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ posts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const data = socialPostSchema.parse(body);

    const post = await prisma.socialPost.create({
      data: {
        organizationId: auth.organization.id,
        platform: data.platform,
        content: data.content,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        scheduledTimeString: data.scheduledTimeString || "Not yet set",
        status: data.status,
      },
    });

    return apiSuccess(post, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

