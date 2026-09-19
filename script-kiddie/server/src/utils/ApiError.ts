export class ApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  public code?: string;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  withCode(code: string): this {
    this.code = code;
    return this;
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = "Not authenticated") {
    return new ApiError(401, message);
  }
  static forbidden(message = "Not authorized") {
    return new ApiError(403, message);
  }
  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }
  static conflict(message: string) {
    return new ApiError(409, message);
  }
  static tooMany(message = "Too many requests") {
    return new ApiError(429, message);
  }
  static internal(message = "Internal server error") {
    return new ApiError(500, message);
  }
}
