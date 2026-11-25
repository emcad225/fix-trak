import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "fixtrack_session";

// صفحات و API عامة: الصفحة التعريفية، الدخول، التسجيل، وتتبع الزبون عبر QR.
const PUBLIC_PREFIXES = [
  "/home",
  "/login",
  "/register",
  "/track",
  "/api/auth/login",
  "/api/auth/register",
  "/api/track",
];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

async function hasValidSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedIn = await hasValidSession(request);

  // الزائر غير المسجّل بيشوف الصفحة التعريفية عند فتح الرئيسية.
  if (pathname === "/" && !loggedIn) {
    return NextResponse.rewrite(new URL("/home", request.url));
  }

  if (pathname === "/login" && loggedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  if (!loggedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};