import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Check either session auth or CRON_SECRET header
    const cronSecret = req.headers.get("x-cron-secret");
    const session = await getSession(req);

    const isAuthorized =
      (process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET) ||
      session?.organizationId;

    if (!isAuthorized) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized cron access" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const orgId = session?.organizationId;

    // Find scheduled posts that are due for broadcast
    const scheduledPosts = await prisma.socialPost.findMany({
      where: {
        status: "SCHEDULED",
        ...(orgId ? { organizationId: orgId } : {}),
      },
      take: 20,
    });

    if (scheduledPosts.length === 0) {
      return apiSuccess({
        message: "No scheduled posts in queue awaiting broadcast.",
        broadcastCount: 0,
        posts: [],
      });
    }

    // Process each scheduled post
    const publishedIds: string[] = [];
    for (const post of scheduledPosts) {
      await prisma.socialPost.update({
        where: { id: post.id },
        data: {
          status: "PUBLISHED",
          scheduledTimeString: `Broadcasted at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
          publishedAt: new Date(),
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          organizationId: post.organizationId,
          action: "SOCIAL_POST_BROADCAST",
          entityType: "SocialPost",
          entityId: post.id,
          details: JSON.stringify({
            platform: post.platform,
            contentPreview: post.content.slice(0, 60),
            broadcastedAt: new Date().toISOString(),
          }),
        },
      });

      publishedIds.push(post.id);
    }

    return apiSuccess({
      message: `Successfully broadcasted ${publishedIds.length} scheduled post(s) to connected channels.`,
      broadcastCount: publishedIds.length,
      publishedIds,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

