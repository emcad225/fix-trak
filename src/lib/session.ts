import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "fixtrack_session";
const MAX_AGE = 60 * 60 * 12;

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET مفقود أو قصير");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function readSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}