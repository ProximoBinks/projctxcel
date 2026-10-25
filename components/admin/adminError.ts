import { ConvexError } from "convex/values";

export function adminError(error: unknown, fallback: string) {
  return error instanceof ConvexError && typeof error.data === "string" ? error.data : fallback;
}
