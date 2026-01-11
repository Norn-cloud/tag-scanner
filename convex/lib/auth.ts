import {
  QueryCtx,
  MutationCtx,
} from "../_generated/server";

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: Please log in");
  }
  return identity;
}

export async function requireAdmin(ctx: MutationCtx) {
  const identity = await requireAuth(ctx);
  return identity;
}

export function validatePositive(value: number, fieldName: string) {
  if (value < 0) {
    throw new Error(`${fieldName} must be non-negative`);
  }
}

export function validateRange(value: number, min: number, max: number, fieldName: string) {
  if (value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
}

export function validateKarat(karat: number): asserts karat is 18 | 21 | 24 {
  if (![18, 21, 24].includes(karat)) {
    throw new Error("Karat must be 18, 21, or 24");
  }
}
