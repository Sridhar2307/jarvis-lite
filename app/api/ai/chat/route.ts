import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatMessageSchema } from "@/lib/validations";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getOrganizationBusinessContext, generateAIResponse } from "@/lib/ai-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const orgId = auth.organization.id;

    let conversation = await prisma.conversation.findFirst({
      where: { organizationId: orgId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          organizationId: orgId,
          title: "Executive Command Thread",
          messages: {
            create: [
              {
                role: "ai",
                text: "JARVIS Lite active. All systems nominal. Ask me anything about your verified business metrics, tickets, or operations.",
              },
            ],
          },
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    const formattedMessages = conversation.messages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "ai",
      text: m.text,
      time: new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    }));

    return apiSuccess({
      conversationId: conversation.id,
      messages: formattedMessages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const orgId = auth.organization.id;
    const body = await req.json();
    const data = chatMessageSchema.parse(body);

    let conversation = data.conversationId
      ? await prisma.conversation.findFirst({
          where: { id: data.conversationId, organizationId: orgId },
          include: { messages: { orderBy: { createdAt: "asc" }, take: 10 } },
        })
      : await prisma.conversation.findFirst({
          where: { organizationId: orgId },
          include: { messages: { orderBy: { createdAt: "asc" }, take: 10 } },
        });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          organizationId: orgId,
          title: "Executive Command Thread",
        },
        include: { messages: true },
      });
    }

    // 1. Save user message to database
    const userMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        text: data.message,
      },
    });

    // 2. Fetch ground-truth business context directly from the database
    const context = await getOrganizationBusinessContext(orgId);

    // 3. Generate AI response (grounded in DB context)
    const history = conversation.messages.map((m) => ({ role: m.role, text: m.text }));
    const aiText = await generateAIResponse(data.message, context, history);

    // 4. Save AI response to database
    const aiMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "ai",
        text: aiText,
      },
    });

    return apiSuccess({
      userMessage: {
        id: userMsg.id,
        role: "user",
        text: userMsg.text,
        time: new Date(userMsg.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      },
      aiMessage: {
        id: aiMsg.id,
        role: "ai",
        text: aiMsg.text,
        time: new Date(aiMsg.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      },
      conversationId: conversation.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

