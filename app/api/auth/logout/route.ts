import { SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { apiSuccess } from "@/lib/api-response";

export async function POST() {
  const response = apiSuccess({ message: "Logged out successfully" });
  response.cookies.set(SESSION_COOKIE_OPTIONS.name, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}

