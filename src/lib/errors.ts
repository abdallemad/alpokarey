/**
 * Domain errors thrown by the Service layer.
 *
 * Services know nothing about HTTP, so they throw these instead of building
 * responses. `app/api` translates them into status codes in one place — see
 * `lib/api-response.ts`.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "يجب تسجيل الدخول للمتابعة") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "هذا القسم مخصص للمشرفين فقط") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "العنصر المطلوب غير موجود") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

export class ValidationError extends AppError {
  constructor(message = "البيانات المُرسلة غير صالحة", details?: unknown) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}
