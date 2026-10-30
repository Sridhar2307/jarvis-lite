import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    return apiSuccess({
      user: auth.user,
      organization: auth.organization,
      role: auth.role,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

