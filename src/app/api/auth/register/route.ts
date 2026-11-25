import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

const TRIAL_DAYS = 7;

// 5 محاولات تسجيل كل ساعة لكل عنوان IP.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const hits = new Map<string, { count: number; first: number }>();

function limited(ip: string) {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now - entry.first > WINDOW_MS) {
    hits.set(ip, { count: 1, first: now });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

  if (limited(ip)) {
    return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
  }

  let shopName = "";
  let ownerName = "";
  let phone = "";
  let username = "";
  let password = "";

  try {
    const body = await request.json();
    shopName = String(body.shopName ?? "").trim();
    ownerName = String(body.ownerName ?? "").trim();
    // نشيل المسافات والشرطات والأقواس عشان نقارن الأرقام بشكل موحّد.
    phone = String(body.phone ?? "").trim().replace(/[\s()-]/g, "");
    username = String(body.username ?? "").trim().toLowerCase();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const valid =
    shopName.length >= 2 &&
    shopName.length <= 80 &&
    ownerName.length >= 2 &&
    ownerName.length <= 80 &&
    /^\+?[0-9]{6,20}$/.test(phone) &&
    /^[a-z0-9._-]{3,32}$/.test(username) &&
    password.length >= 10 &&
    password.length <= 200;

  if (!valid) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const usernameTaken = await db.user.findUnique({ where: { username } });
  if (usernameTaken) {
    return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });
  }

  // رقم الهاتف مسجّل بمحل ثاني (يمنع تكرار التجربة المجانية).
  const phoneTaken = await db.shop.findFirst({
    where: { phone },
    select: { id: true },
  });
  if (phoneTaken) {
    return NextResponse.json({ error: "PHONE_TAKEN" }, { status: 422 });
  }

  const passwordHash = await hashPassword(password);

  try {
    // المحل والمالك بيتفعّلوا فوراً، وتبدأ التجربة المجانية.
    const shop = await db.shop.create({
      data: {
        name: shopName,
        phone,
        isActive: true,
        trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
        users: {
          create: {
            username,
            name: ownerName,
            passwordHash,
            role: "OWNER",
            lastLoginAt: new Date(),
            isActive: true,
          },
        },
      },
      select: { users: { select: { id: true } } },
    });

    // دخول تلقائي بعد التسجيل.
    await createSession(shop.users[0].id);
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });
    }
    return NextResponse.json({ error: "GENERIC" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}