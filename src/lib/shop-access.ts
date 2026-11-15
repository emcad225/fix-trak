import { NextResponse } from "next/server";
import { db } from "./db";
import { getCurrentUser } from "./auth";
import { canUseApp, shopStatus } from "./subscription";

export type ShopAccess =
  | { ok: true; shopId: string; isOwner: boolean }
  | { ok: false; response: NextResponse };

// مستخدم مسجّل + مرتبط بمحل + اشتراك أو تجربة ساري.
export async function requireActiveShop(): Promise<ShopAccess> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }),
    };
  }

  if (!user.shopId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "NO_SHOP" }, { status: 403 }),
    };
  }

  const shop = await db.shop.findUnique({
    where: { id: user.shopId },
    select: { isActive: true, trialEndsAt: true, subscribedUntil: true },
  });

  if (!shop || !canUseApp(shopStatus(shop))) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "SUBSCRIPTION_REQUIRED" },
        { status: 402 }
      ),
    };
  }

  return { ok: true, shopId: user.shopId, isOwner: user.role === "OWNER" };
}