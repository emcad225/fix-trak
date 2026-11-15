import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser, isPlatformAdmin } from "@/lib/auth";

export const runtime = "nodejs"; 

const TRIAL_DAYS = 7;

const shopInclude = {
  users: {
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
    },
  },
} satisfies Prisma.ShopInclude;

type ShopWithUsers = Prisma.ShopGetPayload<{ include: typeof shopInclude }>;

// لازم مدير منصة، وإلا نرفض.
async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!isPlatformAdmin(user)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  return null;
}

// PENDING: سجّل ولم يُفعَّل بعد | DISABLED: معطّل
// SUBSCRIBED: مشترك | TRIAL: تجربة | EXPIRED: انتهت التجربة أو الاشتراك
function statusOf(shop: ShopWithUsers) {
  const now = new Date();

  if (!shop.isActive && !shop.trialEndsAt && !shop.subscribedUntil) {
    return "PENDING";
  }
  if (!shop.isActive) return "DISABLED";
  if (shop.subscribedUntil && shop.subscribedUntil > now) return "SUBSCRIBED";
  if (shop.trialEndsAt && shop.trialEndsAt > now) return "TRIAL";
  return "EXPIRED";
}

function summarize(shop: ShopWithUsers) {
  const owner = shop.users.find((u) => u.role === "OWNER") ?? null;

  return {
    id: shop.id,
    name: shop.name,
    phone: shop.phone,
    createdAt: shop.createdAt.toISOString(),
    status: statusOf(shop),
    plan: shop.plan,
    trialEndsAt: shop.trialEndsAt?.toISOString() ?? null,
    subscribedUntil: shop.subscribedUntil?.toISOString() ?? null,
    usersCount: shop.users.length,
    owner: owner
      ? {
          name: owner.name,
          username: owner.username,
          lastLoginAt: owner.lastLoginAt?.toISOString() ?? null,
        }
      : null,
  };
}

function laterOf(date: Date | null | undefined) {
  const now = new Date();
  return date && date > now ? new Date(date) : now;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const shops = await db.shop.findMany({
    orderBy: { createdAt: "desc" },
    include: shopInclude,
  });

  return NextResponse.json(shops.map(summarize));
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { id?: unknown; action?: unknown; plan?: unknown; days?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const action = typeof body.action === "string" ? body.action : "";

  const shop = id
    ? await db.shop.findUnique({ where: { id }, include: shopInclude })
    : null;

  if (!shop) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const now = new Date();

  if (action === "approve") {
    // تفعيل محل جديد: المحل + صاحبه، وتبدأ فترة التجربة.
    await db.$transaction([
      db.shop.update({
        where: { id },
        data: {
          isActive: true,
          trialEndsAt:
            shop.trialEndsAt ??
            new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
        },
      }),
      db.user.updateMany({
        where: { shopId: id, role: "OWNER" },
        data: { isActive: true },
      }),
    ]);
  } else if (action === "subscribe") {
    if (body.plan !== "MONTHLY" && body.plan !== "YEARLY") {
      return NextResponse.json({ error: "INVALID_PLAN" }, { status: 400 });
    }

    // التمديد من تاريخ انتهاء الاشتراك الحالي لو لسا ساري.
    const until = laterOf(shop.subscribedUntil);
    if (body.plan === "MONTHLY") until.setMonth(until.getMonth() + 1);
    else until.setFullYear(until.getFullYear() + 1);

    await db.shop.update({
      where: { id },
      data: { plan: body.plan, subscribedUntil: until, isActive: true },
    });
  } else if (action === "extend_trial") {
    const days = Number(body.days ?? 7);

    if (!Number.isInteger(days) || days < 1 || days > 90) {
      return NextResponse.json({ error: "INVALID_DAYS" }, { status: 400 });
    }

    const until = laterOf(shop.trialEndsAt);
    until.setDate(until.getDate() + days);

    await db.shop.update({ where: { id }, data: { trialEndsAt: until } });
  } else if (action === "disable") {
    await db.shop.update({ where: { id }, data: { isActive: false } });
  } else if (action === "enable") {
    await db.shop.update({ where: { id }, data: { isActive: true } });
  } else {
    return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
  }

  const updated = await db.shop.findUnique({
    where: { id },
    include: shopInclude,
  });

  return NextResponse.json(updated ? summarize(updated) : { ok: true });
}