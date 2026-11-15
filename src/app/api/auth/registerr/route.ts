import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

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
    phone = String(body.phone ?? "").trim();
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
    /^[0-9+()\s-]{6,20}$/.test(phone) &&
    /^[a-z0-9._-]{3,32}$/.test(username) &&
    password.length >= 10 &&
    password.length <= 200;

  if (!valid) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const exists = await db.user.findUnique({ where: { username } });
  if (exists) {
    return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  try {
    // المحل والمالك يُنشآن غير مفعّلين حتى توافق عليهما من لوحتك.
    await db.shop.create({
      data: {
        name: shopName,
        phone,
        isActive: false,
        users: {
          create: {
            username,
            name: ownerName,
            passwordHash,
            role: "OWNER",
            isActive: false,
          },
        },
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });
    }
    return NextResponse.json({ error: "GENERIC" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}