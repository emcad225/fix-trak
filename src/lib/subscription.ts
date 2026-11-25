import type { Shop } from "@prisma/client";

export type ShopStatus =
  | "PENDING"
  | "TRIAL"
  | "SUBSCRIBED"
  | "EXPIRED"
  | "DISABLED";

export const PLAN_PRICES = { MONTHLY: 1500, YEARLY: 4500 } as const;
export function shopStatus(
  shop: Pick<Shop, "isActive" | "trialEndsAt" | "subscribedUntil">,
  now = new Date()
): ShopStatus {
  if (!shop.isActive && !shop.trialEndsAt && !shop.subscribedUntil) {
    return "PENDING";
  }
  if (!shop.isActive) return "DISABLED";
  if (shop.subscribedUntil && shop.subscribedUntil > now) return "SUBSCRIBED";
  if (shop.trialEndsAt && shop.trialEndsAt > now) return "TRIAL";
  return "EXPIRED";
}

export function canUseApp(status: ShopStatus) {
  return status === "TRIAL" || status === "SUBSCRIBED";
}