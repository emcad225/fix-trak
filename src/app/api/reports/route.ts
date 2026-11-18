import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireActiveShop } from "@/lib/shop-access";

export const runtime = "nodejs";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  const access = await requireActiveShop();
  if (!access.ok) return access.response;

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [repairs, payments] = await Promise.all([
    db.repairOrder.findMany({
      where: { shopId: access.shopId },
      select: {
        status: true,
        receivedAt: true,
        estimatedCost: true,
        finalCost: true,
        device: { select: { brand: true } },
      },
      take: 5000,
    }),
    db.payment.findMany({
      where: { repairOrder: { shopId: access.shopId }, paidAt: { gte: start } },
      select: { amount: true, type: true, paidAt: true },
    }),
  ]);

  // آخر 6 شهور (من الأقدم للأحدث).
  const months: { key: string; collected: number; repairs: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: monthKey(date), collected: 0, repairs: 0 });
  }

  const byKey = new Map(months.map((month) => [month.key, month]));

  for (const payment of payments) {
    const month = byKey.get(monthKey(payment.paidAt));
    if (!month) continue;

    const amount = Number(payment.amount);
    month.collected += payment.type === "REFUND" ? -amount : amount;
  }

  const byStatus: Record<string, number> = {};
  const brands = new Map<string, number>();
  let priceSum = 0;
  let priced = 0;

  for (const repair of repairs) {
    byStatus[repair.status] = (byStatus[repair.status] ?? 0) + 1;

    const month = byKey.get(monthKey(repair.receivedAt));
    if (month) month.repairs += 1;

    const price = Number(repair.finalCost ?? repair.estimatedCost ?? 0);
    if (price > 0) {
      priceSum += price;
      priced += 1;
    }

    const brand = repair.device.brand.trim();
    if (brand && brand !== "غير محدد") {
      const name = brand.toLowerCase();
      brands.set(name, (brands.get(name) ?? 0) + 1);
    }
  }

  const topBrands = Array.from(brands.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
    }));

  return NextResponse.json({
    totals: {
      repairs: repairs.length,
      monthCollected: months[5].collected,
      lastMonthCollected: months[4].collected,
      avgPrice: priced > 0 ? Math.round(priceSum / priced) : 0,
    },
    months,
    byStatus,
    topBrands,
  });
}