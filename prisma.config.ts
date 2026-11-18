import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // لا نرمي خطأ لو المتغير ناقص، عشان prisma generate يشتغل وقت البناء.
    // أوامر القاعدة (migrate) بتفشل برسالة واضحة لو ما كان مضبوط.
    url: process.env.DATABASE_URL ?? "",
  },
});