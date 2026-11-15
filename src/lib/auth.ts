import type { UserRole } from "@prisma/client";
import { db } from "./db";
import { readSessionUserId } from "./session";

export type CurrentUser = {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  shopId: string | null;
  mustChangePassword: boolean;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const userId = await readSessionUserId();
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { shop: { select: { isActive: true } } },
  });

  if (!user || !user.isActive) return null;
  if (user.shopId && !user.shop?.isActive) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    shopId: user.shopId,
    mustChangePassword: user.mustChangePassword,
  };
}

export function isPlatformAdmin(user: CurrentUser) {
  return user.role === "PLATFORM_ADMIN";
}

export function isShopOwner(user: CurrentUser) {
  return user.role === "OWNER";
}
