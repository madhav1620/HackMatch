import { z } from "zod";
import { ApiError } from "./error.js";

/** Zod-flavored request validation without importing zod types everywhere */
export function assertValid<T>(result: { success: boolean; data?: T; error?: unknown }): T {
  if (!result.success || result.data === undefined) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid request", result.error);
  }
  return result.data;
}

/**
 * Query-string boolean. `z.coerce.boolean()` is wrong for query params: it
 * truth-tests the raw string, so `?openOnly=false` coerces to `true`. Parse the
 * literal strings instead so "false"/"0" mean false and anything else means true.
 */
export const queryBool = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1")
  .optional();
