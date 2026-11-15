// يربط كل البيانات القديمة (زبائن، أجهزة، طلبات، قطع) بمحل افتراضي.
// لا يحذف ولا يعدّل أي شيء غير الحقل shopId الفارغ.
// التشغيل: node prisma/scripts/backfill-shop.mjs

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  let shop = await prisma.shop.findFirst({ orderBy: { createdAt: "asc" } });

  if (!shop) {
    shop = await prisma.shop.create({ data: { name: "Main Shop" } });
    console.log("تم إنشاء المحل الافتراضي:", shop.id);
  } else {
    console.log("استخدام المحل الموجود:", shop.id, shop.name);
  }

  const data = { shopId: shop.id };
  const where = { shopId: null };

  const customers = await prisma.customer.updateMany({ where, data });
  const devices = await prisma.device.updateMany({ where, data });
  const repairs = await prisma.repairOrder.updateMany({ where, data });
  const parts = await prisma.part.updateMany({ where, data });

  console.log("زبائن:", customers.count);
  console.log("أجهزة:", devices.count);
  console.log("طلبات صيانة:", repairs.count);
  console.log("قطع:", parts.count);
  console.log("تم.");
}

main()
  .catch((e) => {
    console.error("فشل:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());