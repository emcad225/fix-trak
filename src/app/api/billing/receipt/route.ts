import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

// حد حجم الطلب على Vercel حوالي 4.5MB، فنحدد 4MB.
const MAX_BYTES = 4 * 1024 * 1024;

// نتحقق من نوع الملف الحقيقي (مو الامتداد) من أول بايتات.
function detectType(buf: Buffer): { ext: string; mime: string } | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    )
  ) {
    return { ext: "png", mime: "image/png" };
  }
  if (buf.length >= 5 && buf.subarray(0, 5).toString("latin1") === "%PDF-") {
    return { ext: "pdf", mime: "application/pdf" };
  }
  return null;
}

// آخر طلب دفع للمحل، لنعرض حالته (قيد المراجعة، مقبول، مرفوض).
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!user.shopId || user.role !== "OWNER") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const latest = await db.subscriptionPayment.findFirst({
    where: { shopId: user.shopId },
    orderBy: { createdAt: "desc" },
    select: { status: true, plan: true, createdAt: true, note: true },
  });

  return NextResponse.json({ latest });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!user.shopId || user.role !== "OWNER") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const plan = form.get("plan");
  const file = form.get("file");

  if (plan !== "MONTHLY" && plan !== "YEARLY") {
    return NextResponse.json({ error: "INVALID_PLAN" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "INVALID_FILE" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "TOO_LARGE" }, { status: 413 });
  }

  // طلب واحد قيد المراجعة بالمرة، لمنع الإغراق.
  const pending = await db.subscriptionPayment.findFirst({
    where: { shopId: user.shopId, status: "PENDING" },
    select: { id: true },
  });

  if (pending) {
    return NextResponse.json({ error: "ALREADY_PENDING" }, { status: 409 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const type = detectType(buffer);

  if (!type) {
    return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });
  }

  const pathname = `receipts/${user.shopId}/${randomUUID()}.${type.ext}`;

  try {
    await put(pathname, buffer, {
      access: "private",
      contentType: type.mime,
      addRandomSuffix: false,
    });
  } catch (error) {
    console.error("Receipt upload failed:", error);
    return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
  }

  await db.subscriptionPayment.create({
    data: {
      shopId: user.shopId,
      plan,
      receiptPath: pathname,
      receiptMime: type.mime,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}