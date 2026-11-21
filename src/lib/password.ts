import { hash, verify } from "@node-rs/argon2";

// Argon2id هو النوع الافتراضي
export function hashPassword(password: string) {
  return hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

export async function verifyPassword(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password);
  } catch (error) {
    console.error("argon2 verify failed:", error);
    return false;
  }
}