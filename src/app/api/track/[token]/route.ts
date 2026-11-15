
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const statusLabels: Record<string, string> = {
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

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token || token.length > 200) {
      return NextResponse.json(
        { error: "رابط التتبع غير صالح" },
        { status: 400 }
      );
    }

    const repair = await prisma.repairOrder.findUnique({
      where: { trackingToken: token },
      select: {
        repairNumber: true,
        status: true,
        receivedAt: true,
        device: {
          select: {
            brand: true,
            model: true,
          },
        },
        statusHistory: {
          select: {
            status: true,
            note: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!repair) {
      return NextResponse.json(
        { error: "لم يتم العثور على طلب الصيانة" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: `FT-${repair.repairNumber}`,
      device: [repair.device.brand, repair.device.model]
        .filter(
          (part) =>
            part.trim() !== "" && part.trim() !== "غير محدد"
        )
        .join(" "),
      status: statusLabels[repair.status] ?? repair.status,
      receivedAt: repair.receivedAt.toISOString(),
      stages: repair.statusHistory.map((stage) => ({
        status: statusLabels[stage.status] ?? stage.status,
        note: stage.note,
        date: stage.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to load tracking information:", error);

    return NextResponse.json(
      { error: "تعذر تحميل معلومات التتبع" },
      { status: 500 }
    );
  }
}
