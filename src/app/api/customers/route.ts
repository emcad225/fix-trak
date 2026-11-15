import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

type Row = {
  name: string;
  phone: string;
  repairs: number;
  lastDate: Date | null;
  total: number;
};

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!user.shopId) {
    return NextResponse.json({ error: "NO_SHOP" }, { status: 403 });
  }

  const customers = await db.customer.findMany({
    where: { shopId: user.shopId },
    include: {
      repairs: {
        select: { receivedAt: true, estimatedCost: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  // نفس الزبون ممكن يكون له سجل لكل طلب، فنجمعهم برقم الهاتف.
  const byPhone = new Map<string, Row>();

  for (const customer of customers) {
    const key = customer.phone.replace(/\D/g, "") || customer.id;

    const row: Row = byPhone.get(key) ?? {
      name: customer.name,
      phone: customer.phone,
      repairs: 0,
      lastDate: null,
      total: 0,
    };

    for (const repair of customer.repairs) {
      row.repairs += 1;
      row.total += Number(repair.estimatedCost ?? 0);

      if (!row.lastDate || repair.receivedAt > row.lastDate) {
        row.lastDate = repair.receivedAt;
      }
    }

    byPhone.set(key, row);
  }

  const result = Array.from(byPhone.values())
    .sort((a, b) => (b.lastDate?.getTime() ?? 0) - (a.lastDate?.getTime() ?? 0))
    .map((row) => ({
      name: row.name,
      phone: row.phone,
      repairs: row.repairs,
      lastDate: row.lastDate ? row.lastDate.toISOString().slice(0, 10) : null,
      total: row.total,
    }));

  return NextResponse.json(result);
}