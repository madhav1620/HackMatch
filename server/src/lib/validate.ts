import { ApiError } from "./error.js";

/** Zod-flavored request validation without importing zod types everywhere */
export function assertValid<T>(result: { success: boolean; data?: T; error?: unknown }): T {
  if (!result.success || result.data === undefined) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid request", result.error);
  }
  return result.data;
}
