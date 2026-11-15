import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PLAN_PRICES, shopStatus } from "@/lib/subscription";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!user.shopId) {
    return NextResponse.json({ error: "NO_SHOP" }, { status: 403 });
  }

  const shop = await db.shop.findUnique({
    where: { id: user.shopId },
    include: {
      paymentRequests: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          plan: true,
          status: true,
          note: true,
          createdAt: true,
        },
      },
    },
  });

  if (!shop) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const isOwner = user.role === "OWNER";

  return NextResponse.json({
    isOwner,
    shop: {
      number: shop.shopNumber,
      name: shop.name,
      status: shopStatus(shop),
      plan: shop.plan,
      trialEndsAt: shop.trialEndsAt?.toISOString() ?? null,
      subscribedUntil: shop.subscribedUntil?.toISOString() ?? null,
    },
    // بيانات الحساب البنكي لمالك المحل فقط.
    bank: isOwner
      ? {
          holder: process.env.BANK_HOLDER ?? "",
          iban: process.env.BANK_IBAN ?? "",
        }
      : null,
    prices: PLAN_PRICES,
    requests: isOwner
      ? shop.paymentRequests.map((request) => ({
          id: request.id,
          plan: request.plan,
          status: request.status,
          note: request.note,
          createdAt: request.createdAt.toISOString(),
        }))
      : [],
  });
}