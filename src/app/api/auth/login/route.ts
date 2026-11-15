import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { hashPassword, verifyPassword } from "../../../../lib/password";
import { createSession } from "../../../../lib/session";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, { count: number; first: number }>();

function isLimited(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.first > WINDOW_MS) return false;
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now });
  } else {
    entry.count += 1;
  }
}

const dummyHash = hashPassword("not-a-real-password-123");

export async function POST(request: Request) {
  let username = "";
  let password = "";

  try {
    const body = await request.json();
    username = String(body.username ?? "").trim().toLowerCase();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  if (!username || !password || username.length > 64 || password.length > 200) {
    return NextResponse.json({ error: "INVALID" }, { status: 401 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${ip}|${username}`;

  if (isLimited(key)) {
    return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
  }

  const user = await db.user.findUnique({
    where: { username },
    include: { shop: { select: { isActive: true } } },
  });

  const hashToCheck = user?.passwordHash ?? (await dummyHash);
  const passwordOk = await verifyPassword(hashToCheck, password);

  const allowed =
    !!user &&
    passwordOk &&
    user.isActive &&
    (!user.shopId || user.shop?.isActive);

  if (!allowed || !user) {
    recordFailure(key);
    return NextResponse.json({ error: "INVALID" }, { status: 401 });
  }

  attempts.delete(key);

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createSession(user.id);

  return NextResponse.json({
    ok: true,
    mustChangePassword: user.mustChangePassword,
    role: user.role,  
  });
}