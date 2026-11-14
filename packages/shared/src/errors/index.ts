export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "VALIDATION_FAILED"
  | "INTERNAL_ERROR"
  | "PAYMENT_REQUIRED"
  | "BAD_REQUEST"
  | "MEDIA_TOO_LARGE"
  | "DURATION_EXCEEDED"
  | "INVALID_URL"
  | "SSRF_DETECTED"
  | "SSRF_URL_REJECTED"
  | "JOB_NOT_FOUND"
  | "JOB_ALREADY_CLAIMED"
  | "INVALID_VIDEO_FORMAT"
  | "NO_VIDEO_STREAM"
  | "CORRUPT_VIDEO_DURATION"
  | "UNSUPPORTED_CODEC"
  | "RESOLUTION_EXCEEDED"
  | "PROCESSING_TIMEOUT"
  | "COMMAND_EXECUTION_FAILED"
  | "COMMAND_EXIT_NONZERO"
  | "CLIP_RENDER_FAILED"
  | "THUMBNAIL_RENDER_FAILED"
  | "MISSING_STORAGE_PATH"
  | "STORAGE_IDOR_VIOLATION"
  | "STORAGE_DOWNLOAD_FAILED"
  | "FILE_TOO_LARGE"
  | "MISSING_SOURCE_URL"
  | "URL_FETCH_FAILED"
  | "INVALID_CONTENT_TYPE"
  | "EMPTY_RESPONSE_BODY"
  | "URL_DOWNLOAD_FAILED"
  | "UNSUPPORTED_SOURCE_TYPE"
  | "CLIP_FILE_MISSING"
  | "THUMBNAIL_FILE_MISSING"
  | "CLIP_STORAGE_UPLOAD_FAILED"
  | "THUMBNAIL_STORAGE_UPLOAD_FAILED"
  | "NO_HIGHLIGHTS_DETECTED"
  | "CLIP_INSERT_FAILED"
  | "FILE_NOT_FOUND"
  | "PROCESSING_ERROR";

export interface AppErrorOptions {
  message: string;
  code?: ErrorCode;
  status?: number;
  statusCode?: number;
  isOperational?: boolean;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly userMessage: string;

  constructor(
    messageOrOptions: string | AppErrorOptions,
    code: ErrorCode = "INTERNAL_ERROR",
    statusCode: number = 500,
    isOperational: boolean = true,
  ) {
    const isObj = typeof messageOrOptions === "object" && messageOrOptions !== null;
    const msg = isObj ? messageOrOptions.message : (messageOrOptions || "An error occurred");
    super(msg);

    if (isObj) {
      this.name = "AppError";
      this.code = messageOrOptions.code || "INTERNAL_ERROR";
      this.statusCode = messageOrOptions.status || messageOrOptions.statusCode || 500;
      this.isOperational = messageOrOptions.isOperational ?? true;
      this.userMessage = this.isOperational
        ? messageOrOptions.message
        : "An unexpected error occurred. Please try again.";
    } else {
      this.name = "AppError";
      this.code = code;
      this.statusCode = statusCode;
      this.isOperational = isOperational;
      this.userMessage = isOperational
        ? msg
        : "An unexpected error occurred. Please try again.";
    }

    // Maintain prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static unauthorized(msg = "You must be signed in to perform this action."): AppError {
    return new AppError(msg, "UNAUTHORIZED", 401);
  }

  static forbidden(msg = "You do not have permission to access this resource."): AppError {
    return new AppError(msg, "FORBIDDEN", 403);
  }

  static notFound(msg = "The requested resource was not found."): AppError {
    return new AppError(msg, "NOT_FOUND", 404);
  }

  static rateLimited(retryAfterSeconds: number, msg = "Rate limit exceeded. Please try again later."): AppError {
    const err = new AppError(msg, "RATE_LIMITED", 429);
    (err as unknown as { retryAfter: number }).retryAfter = retryAfterSeconds;
    return err;
  }

  static badRequest(msg: string, code: ErrorCode = "BAD_REQUEST"): AppError {
    return new AppError(msg, code, 400);
  }

  static internal(msg = "Internal server error"): AppError {
    return new AppError(msg, "INTERNAL_ERROR", 500, false);
  }
}

/**
 * Standard typed action result format for all Server Actions
 */
export type ActionResult<T = void> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; code: ErrorCode; data?: never };

export function successResult<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function errorResult(message: string, code: ErrorCode = "INTERNAL_ERROR"): ActionResult<never> {
  return { success: false, error: message, code };
}
