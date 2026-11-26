import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

// الوصل مخزّن خاص، فهاد المسار هو الطريق الوحيد لفتحه، وللأدمن فقط.
export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id") ?? "";

  const payment = await db.subscriptionPayment.findUnique({
    where: { id },
    select: { receiptPath: true, receiptMime: true },
  });

  if (!payment) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const result = await get(payment.receiptPath, { access: "private" });

  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": payment.receiptMime,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}