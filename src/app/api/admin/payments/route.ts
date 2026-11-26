import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PLAN_PRICES } from "@/lib/subscription";

export const runtime = "nodejs";

async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (user.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  return null;
}

// نضيف عدد أشهر مع الحفاظ على آخر يوم بالشهر (31 كانون -> 28 شباط).
function addMonths(date: Date, months: number) {
  const result = new Date(date);
  const day = result.getUTCDate();

  result.setUTCMonth(result.getUTCMonth() + months);
  if (result.getUTCDate() < day) result.setUTCDate(0);

  return result;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const rows = await db.subscriptionPayment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      shop: {
        select: {
          shopNumber: true,
          name: true,
          phone: true,
          isActive: true,
          subscribedUntil: true,
          trialEndsAt: true,
        },
      },
    },
  });

  const payments = rows
    .map((row) => ({
      id: row.id,
      plan: row.plan,
      status: row.status,
      note: row.note,
      createdAt: row.createdAt,
      reviewedAt: row.reviewedAt,
      receiptMime: row.receiptMime,
      amount: PLAN_PRICES[row.plan],
      shop: row.shop,
    }))
    // الطلبات قيد المراجعة أولاً، والباقي من الأحدث للأقدم.
    .sort(
      (a, b) =>
        Number(b.status === "PENDING") - Number(a.status === "PENDING")
    );

  return NextResponse.json({ payments });
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let id = "";
  let action = "";
  let note = "";

  try {
    const body = await request.json();
    id = String(body.id ?? "");
    action = String(body.action ?? "");
    note = String(body.note ?? "").trim().slice(0, 300);
  } catch {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  if (!id || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const payment = await db.subscriptionPayment.findUnique({
    where: { id },
    include: { shop: true },
  });

  if (!payment) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (payment.status !== "PENDING") {
    return NextResponse.json({ error: "ALREADY_REVIEWED" }, { status: 409 });
  }

  const now = new Date();

  if (action === "reject") {
    const result = await db.subscriptionPayment.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "REJECTED", reviewedAt: now, note: note || null },
    });

    if (result.count !== 1) {
      return NextResponse.json({ error: "ALREADY_REVIEWED" }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
  }

  // لو المحل معطّل من عندك، ما منفعّل اشتراكه بالغلط.
  if (!payment.shop.isActive) {
    return NextResponse.json({ error: "SHOP_INACTIVE" }, { status: 409 });
  }

  // نبدأ من آخر تاريخ ساري: الآن، أو نهاية الاشتراك، أو نهاية التجربة.
  const candidates = [now, payment.shop.subscribedUntil, payment.shop.trialEndsAt]
    .filter((value): value is Date => value instanceof Date)
    .map((value) => value.getTime());
  const base = new Date(Math.max(...candidates));
  const until = addMonths(base, payment.plan === "YEARLY" ? 12 : 1);

  try {
    await db.$transaction(async (tx) => {
      const updated = await tx.subscriptionPayment.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "APPROVED", reviewedAt: now, note: note || null },
      });

      if (updated.count !== 1) throw new Error("ALREADY_REVIEWED");

      await tx.shop.update({
        where: { id: payment.shopId },
        data: { plan: payment.plan, subscribedUntil: until },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_REVIEWED") {
      return NextResponse.json({ error: "ALREADY_REVIEWED" }, { status: 409 });
    }
    console.error("Payment approval failed:", error);
    return NextResponse.json({ error: "GENERIC" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, subscribedUntil: until });
}