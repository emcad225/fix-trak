import { NextResponse } from "next/server";
import { Prisma, RepairStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const statusLabels: Record<RepairStatus, string> = {
  RECEIVED: "تم استلام الجهاز",
  DIAGNOSING: "قيد الفحص",
  WAITING_FOR_APPROVAL: "بانتظار موافقة الزبون",
  WAITING_FOR_PARTS: "بانتظار قطعة الغيار",
  IN_REPAIR: "قيد الإصلاح",
  TESTING: "قيد الاختبار",
  READY_FOR_PICKUP: "جاهز للاستلام",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغي",
};

const labelToStatus = Object.fromEntries(
  Object.entries(statusLabels).map(([key, value]) => [value, key])
) as Record<string, RepairStatus>;

type Access =
  | { ok: true; shopId: string; isOwner: boolean }
  | { ok: false; response: NextResponse };

// كل العمليات تمر من هنا: لازم مستخدم مسجّل ومرتبط بمحل.
async function requireShop(): Promise<Access> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "غير مسجّل الدخول" },
        { status: 401 }
      ),
    };
  }

  if (!user.shopId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "هذا الحساب غير مرتبط بمحل" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, shopId: user.shopId, isOwner: user.role === "OWNER" };
}

function serializeRepair(repair: {
  repairNumber: number;
  trackingToken: string;
  customer: { name: string; phone: string };
  device: { brand: string; model: string };
  problemDescription: string;
  status: RepairStatus;
  receivedAt: Date;
  estimatedCost: Prisma.Decimal | null;
}) {
  return {
    id: `FT-${repair.repairNumber}`,
    trackingToken: repair.trackingToken,
    customer: repair.customer.name,
    phone: repair.customer.phone,
    device: [repair.device.brand, repair.device.model]
      .filter((part) => part.trim() !== "" && part.trim() !== "غير محدد")
      .join(" "),
    issue: repair.problemDescription,
    status: statusLabels[repair.status],
    date: repair.receivedAt.toISOString().slice(0, 10),
    price: Number(repair.estimatedCost ?? 0),
  };
}

function getRepairNumber(id: unknown): number | null {
  if (typeof id !== "string") return null;

  const match = id.match(/^FT-(\d+)$/);
  if (!match) return null;

  const number = Number(match[1]);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function splitDevice(device: string) {
  const parts = device.split(/\s+/);
  return {
    brand: parts.shift() || "غير محدد",
    model: parts.join(" ") || "غير محدد",
  };
}

export async function GET() {
  const access = await requireShop();
  if (!access.ok) return access.response;

  try {
    const repairs = await prisma.repairOrder.findMany({
      where: { shopId: access.shopId },
      include: {
        customer: true,
        device: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(repairs.map(serializeRepair));
  } catch (error) {
    console.error("Failed to load repairs:", error);

    return NextResponse.json(
      { error: "تعذر تحميل طلبات الصيانة" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const access = await requireShop();
  if (!access.ok) return access.response;

  try {
    const body = await request.json();

    const customer = String(body.customer ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const device = String(body.device ?? "").trim();
    const issue = String(body.issue ?? "").trim();

    const rawPrice =
      body.price === "" || body.price == null ? 0 : Number(body.price);

    if (!customer || !phone || !device || !issue) {
      return NextResponse.json(
        { error: "يرجى تعبئة جميع الحقول المطلوبة" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(rawPrice) || rawPrice < 0) {
      return NextResponse.json({ error: "السعر غير صالح" }, { status: 400 });
    }

    const { brand, model } = splitDevice(device);
    const shopConnect = { connect: { id: access.shopId } };

    const repair = await prisma.repairOrder.create({
      data: {
        shop: shopConnect,
        problemDescription: issue,
        estimatedCost: rawPrice,
        customer: {
          create: { name: customer, phone, shop: shopConnect },
        },
        device: {
          create: { brand, model, shop: shopConnect },
        },
        statusHistory: {
          create: {
            status: RepairStatus.RECEIVED,
            note: "تم إنشاء طلب الصيانة",
          },
        },
      },
      include: {
        customer: true,
        device: true,
      },
    });

    return NextResponse.json(serializeRepair(repair), { status: 201 });
  } catch (error) {
    console.error("Failed to create repair:", error);

    return NextResponse.json(
      { error: "تعذر إنشاء طلب الصيانة" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const access = await requireShop();
  if (!access.ok) return access.response;

  try {
    const body = await request.json();
    const repairNumber = getRepairNumber(body.id);

    if (!repairNumber) {
      return NextResponse.json(
        { error: "رقم الطلب غير صالح" },
        { status: 400 }
      );
    }

    const hasStatus = Object.prototype.hasOwnProperty.call(body, "status");

    const hasEditableFields = [
      "customer",
      "phone",
      "device",
      "issue",
      "price",
    ].some((key) => Object.prototype.hasOwnProperty.call(body, key));

    if (!hasStatus && !hasEditableFields) {
      return NextResponse.json(
        { error: "لم يتم إرسال أي تعديلات" },
        { status: 400 }
      );
    }

    let status: RepairStatus | undefined;

    if (hasStatus) {
      status = labelToStatus[String(body.status ?? "")];

      if (!status) {
        return NextResponse.json(
          { error: "حالة الطلب غير صالحة" },
          { status: 400 }
        );
      }
    }

    // الطلب لازم يكون من نفس محل المستخدم، وإلا يظهر كأنه غير موجود.
    const existing = await prisma.repairOrder.findFirst({
      where: { repairNumber, shopId: access.shopId },
      include: {
        customer: true,
        device: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "طلب الصيانة غير موجود" },
        { status: 404 }
      );
    }

    const customerName =
      body.customer === undefined
        ? existing.customer.name
        : String(body.customer).trim();

    const phone =
      body.phone === undefined
        ? existing.customer.phone
        : String(body.phone).trim();

    const issue =
      body.issue === undefined
        ? existing.problemDescription
        : String(body.issue).trim();

    const deviceText =
      body.device === undefined
        ? `${existing.device.brand} ${existing.device.model}`.trim()
        : String(body.device).trim();

    const price =
      body.price === undefined
        ? Number(existing.estimatedCost ?? 0)
        : body.price === "" || body.price === null
          ? 0
          : Number(body.price);

    if (!customerName || !phone || !deviceText || !issue) {
      return NextResponse.json(
        { error: "يرجى تعبئة جميع الحقول المطلوبة" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "السعر غير صالح" }, { status: 400 });
    }

    const { brand, model } = splitDevice(deviceText);

    const repair = await prisma.repairOrder.update({
      where: { id: existing.id },
      data: {
        problemDescription: issue,
        estimatedCost: price,
        customer: {
          update: {
            name: customerName,
            phone,
          },
        },
        device: {
          update: {
            brand,
            model,
          },
        },
        ...(status
          ? {
              status,
              statusHistory: {
                create: {
                  status,
                  note: hasEditableFields
                    ? "تم تعديل بيانات الطلب وتحديث حالته"
                    : "تم تحديث حالة الصيانة",
                },
              },
            }
          : {}),
        ...(status === RepairStatus.READY_FOR_PICKUP
          ? { completedAt: new Date() }
          : {}),
        ...(status === RepairStatus.DELIVERED
          ? { deliveredAt: new Date() }
          : {}),
      },
      include: {
        customer: true,
        device: true,
      },
    });

    return NextResponse.json(serializeRepair(repair));
  } catch (error) {
    console.error("Failed to update repair:", error);

    return NextResponse.json(
      { error: "تعذر تحديث طلب الصيانة" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const access = await requireShop();
  if (!access.ok) return access.response;

  // حذف الطلبات لمالك المحل فقط.
  if (!access.isOwner) {
    return NextResponse.json(
      { error: "حذف الطلبات متاح لمالك المحل فقط" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const repairNumber = getRepairNumber(body.id);

    if (!repairNumber) {
      return NextResponse.json(
        { error: "رقم الطلب غير صالح" },
        { status: 400 }
      );
    }

    const repair = await prisma.repairOrder.findFirst({
      where: { repairNumber, shopId: access.shopId },
      include: {
        _count: {
          select: {
            payments: true,
          },
        },
      },
    });

    if (!repair) {
      return NextResponse.json(
        { error: "طلب الصيانة غير موجود" },
        { status: 404 }
      );
    }

    if (repair._count.payments > 0) {
      return NextResponse.json(
        {
          error:
            "لا يمكن حذف الطلب لأنه يحتوي على دفعات مالية. ألغِ الطلب واحتفظ بسجله المالي.",
        },
        { status: 409 }
      );
    }

    await prisma.repairOrder.delete({
      where: { id: repair.id },
    });

    return NextResponse.json({
      success: true,
      id: `FT-${repairNumber}`,
    });
  } catch (error) {
    console.error("Failed to delete repair:", error);

    return NextResponse.json(
      { error: "تعذر حذف طلب الصيانة" },
      { status: 500 }
    );
  }
}