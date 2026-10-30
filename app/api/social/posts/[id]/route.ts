import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateSocialPostSchema } from "@/lib/validations";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const data = updateSocialPostSchema.parse(body);

    const post = await prisma.socialPost.findFirst({
      where: { id: params.id, organizationId: auth.organization.id },
    });

    if (!post) {
      return apiError("Social post not found", 404);
    }

    const updated = await prisma.socialPost.update({
      where: { id: params.id },
      data: {
        ...(data.platform && { platform: data.platform }),
        ...(data.content && { content: data.content }),
        ...(data.status && { status: data.status }),
        ...(data.scheduledTimeString && { scheduledTimeString: data.scheduledTimeString }),
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

    const post = await prisma.socialPost.findFirst({
      where: { id: params.id, organizationId: auth.organization.id },
    });

    if (!post) {
      return apiError("Social post not found", 404);
    }

    await prisma.socialPost.delete({
      where: { id: params.id },
    });

    return apiSuccess({ message: "Post deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

