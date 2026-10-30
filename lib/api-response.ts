import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function apiError(message: string, status = 400, errors?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details: errors ?? null,
    },
    { status }
  );
}

export function handleApiError(error: unknown) {
  console.error("[API_ERROR]", error);

  if (error instanceof ZodError) {
    return apiError("Validation failed", 422, error.flatten().fieldErrors);
  }

  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return apiError("Authentication required", 401);
    }
    if (error.message === "FORBIDDEN_ORGANIZATION") {
      return apiError("You do not have permission to access this organization", 403);
    }
    if (error.message === "USER_NOT_FOUND") {
      return apiError("User account not found", 401);
    }
    return apiError(error.message, 500);
  }

  return apiError("An internal server error occurred", 500);
}

