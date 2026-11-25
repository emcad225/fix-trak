import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireActiveShop } from "@/lib/shop-access";

export const runtime = "nodejs";

const METHODS = ["CASH", "CARD", "TRANSFER", "OTHER"] as const;
type Method = (typeof METHODS)[number];

// صافي المدفوع: الدفعات والعربون ناقص الاسترجاع.
function net(payments: { amount: unknown; type: string }[]) {
  let total = 0;

  for (const payment of payments) {
    const amount = Number(payment.amount);
    total += payment.type === "REFUND" ? -amount : amount;
  }

  return total;
}

export async function GET() {
  const access = await requireActiveShop();
  if (!access.ok) return access.response;
  
  // الحسابات لمالك المحل فقط.
  if (!access.isOwner) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const repairs = await db.repairOrder.findMany({
    where: { shopId: access.shopId },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      repairNumber: true,
      receivedAt: true,
      estimatedCost: true,
      finalCost: true,
      customer: { select: { name: true } },
      device: { select: { brand: true, model: true } },
      payments: { select: { amount: true, type: true, paidAt: true } },
    },
  });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  let totalPrice = 0;
  let totalPaid = 0;
  let totalRemaining = 0;
  let monthPaid = 0;

  const rows = repairs.map((repair) => {
    const price = Number(repair.finalCost ?? repair.estimatedCost ?? 0);
    const paid = net(repair.payments);
    const remaining = Math.max(0, price - paid);

    totalPrice += price;
    totalPaid += paid;
    totalRemaining += remaining;
    monthPaid += net(repair.payments.filter((p) => p.paidAt >= monthStart));

    return {
      id: `FT-${repair.repairNumber}`,
      customer: repair.customer.name,
      device: [repair.device.brand, repair.device.model]
        .filter((part) => part.trim() !== "" && part.trim() !== "غير محدد")
        .join(" "),
      date: repair.receivedAt.toISOString().slice(0, 10),
      price,
      paid,
      remaining,
    };
  });

  return NextResponse.json({
    totals: {
      price: totalPrice,
      paid: totalPaid,
      remaining: totalRemaining,
      monthPaid,
    },
    rows,
  });
}

export async function POST(request: Request) {
  const access = await requireActiveShop();
  if (!access.ok) return access.response;
  
  // الحسابات لمالك المحل فقط.
  if (!access.isOwner) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let body: { id?: unknown; amount?: unknown; method?: unknown; type?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const match = typeof body.id === "string" ? body.id.match(/^FT-(\d+)$/) : null;
  const amount = Number(body.amount);
  const method = METHODS.includes(body.method as Method)
    ? (body.method as Method)
    : null;
  const type =
    body.type === "REFUND" ? "REFUND" : body.type === "DEPOSIT" ? "DEPOSIT" : "PAYMENT";

  if (
    !match ||
    !method ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 10_000_000
  ) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  // الاسترجاع لمالك المحل فقط.
  if (type === "REFUND" && !access.isOwner) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // الطلب لازم يكون من نفس محل المستخدم.
  const repair = await db.repairOrder.findFirst({
    where: { repairNumber: Number(match[1]), shopId: access.shopId },
    select: {
      id: true,
      estimatedCost: true,
      finalCost: true,
      payments: { select: { amount: true, type: true } },
    },
  });

  if (!repair) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const price = Number(repair.finalCost ?? repair.estimatedCost ?? 0);
  const paid = net(repair.payments);

  if (type === "REFUND") {
    if (amount > paid) {
      return NextResponse.json({ error: "OVER_REFUND" }, { status: 400 });
    }
  } else if (price > 0 && paid + amount > price + 0.005) {
    return NextResponse.json({ error: "OVERPAY" }, { status: 400 });
  }

  await db.payment.create({
    data: { repairOrderId: repair.id, amount, type, method },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}