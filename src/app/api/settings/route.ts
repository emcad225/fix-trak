import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { requireActiveShop } from "@/lib/shop-access";

export const runtime = "nodejs";

export async function GET() {
  const access = await requireActiveShop();
  if (!access.ok) return access.response;

  const shop = await db.shop.findUnique({
    where: { id: access.shopId },
    select: {
      shopNumber: true,
      name: true,
      phone: true,
      users: {
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!shop) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({
    isOwner: access.isOwner,
    shop: { number: shop.shopNumber, name: shop.name, phone: shop.phone },
    employees: access.isOwner
      ? shop.users
          .filter((user) => user.role === "EMPLOYEE")
          .map((user) => ({
            id: user.id,
            name: user.name,
            username: user.username,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
          }))
      : [],
  });
}

// إضافة موظف (لمالك المحل فقط).
export async function POST(request: Request) {
  const access = await requireActiveShop();
  if (!access.ok) return access.response;

  if (!access.isOwner) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let name = "";
  let username = "";
  let password = "";

  try {
    const body = await request.json();
    name = String(body.name ?? "").trim();
    username = String(body.username ?? "").trim().toLowerCase();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const valid =
    name.length >= 2 &&
    name.length <= 80 &&
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

  try {
    await db.user.create({
      data: {
        shopId: access.shopId,
        name,
        username,
        passwordHash: await hashPassword(password),
        role: "EMPLOYEE",
        isActive: true,
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });
    }
    return NextResponse.json({ error: "GENERIC" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

// تعديل بيانات المحل، أو تفعيل/تعطيل موظف (لمالك المحل فقط).
export async function PATCH(request: Request) {
  const access = await requireActiveShop();
  if (!access.ok) return access.response;

  if (!access.isOwner) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let body: {
    action?: unknown;
    name?: unknown;
    phone?: unknown;
    id?: unknown;
    isActive?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  if (body.action === "shop") {
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();

    if (
      name.length < 2 ||
      name.length > 80 ||
      !/^[0-9+()\s-]{6,20}$/.test(phone)
    ) {
      return NextResponse.json({ error: "INVALID" }, { status: 400 });
    }

    await db.shop.update({
      where: { id: access.shopId },
      data: { name, phone },
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "employee") {
    const id = typeof body.id === "string" ? body.id : "";

    if (!id || typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "INVALID" }, { status: 400 });
    }

    // لازم يكون موظف من نفس المحل، مو المالك.
    const result = await db.user.updateMany({
      where: { id, shopId: access.shopId, role: "EMPLOYEE" },
      data: { isActive: body.isActive },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
}