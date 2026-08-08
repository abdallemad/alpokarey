import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError, ValidationError } from "@/lib/errors";
import type { ApiFailure, ApiSuccess } from "@/types/api";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

/** Collapses a `ZodError` into `{ fieldPath: [messages] }`. */
export function toFieldErrors(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (fields[key] ??= []).push(issue.message);
  }

  return fields;
}

/**
 * The single place HTTP status codes are decided.
 *
 * Route handlers wrap their body in `try/catch` and hand anything thrown to
 * this function, so a `NotFoundError` from a Service always becomes a 404 and
 * an unexpected throw never leaks a stack trace to the client.
 */
export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    const validation = new ValidationError(undefined, toFieldErrors(error));
    return failure(validation);
  }

  if (error instanceof AppError) {
    return failure(error);
  }

  // Unknown failure: log it server-side, tell the client nothing specific.
  console.error("[api] unhandled error", error);

  return NextResponse.json<ApiFailure>(
    {
      success: false,
      error: { message: "حدث خطأ غير متوقع في الخادم", code: "INTERNAL_ERROR" },
    },
    { status: 500 },
  );
}

function failure(error: AppError) {
  return NextResponse.json<ApiFailure>(
    {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        details: error.details as Record<string, string[]> | undefined,
      },
    },
    { status: error.status },
  );
}
