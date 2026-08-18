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

/**
 * A signed-in learner asking for a path they have not enrolled in.
 *
 * A 403 like `ForbiddenError`, but with its own code: `ForbiddenError` means
 * "this is an admin area", and the shared `ApiErrorState` says exactly that.
 * Reusing it here would tell a student they need admin permission to open a
 * course, which is both wrong and alarming.
 */
export class NotEnrolledError extends AppError {
  constructor(message = "يجب التسجيل في هذا المسار قبل الدخول إلى دروسه") {
    super(message, 403, "NOT_ENROLLED");
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
