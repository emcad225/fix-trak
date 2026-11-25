import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// رقم النشر الحالي على Vercel. محلياً بيرجع "dev" فما بيظهر تنبيه.
export async function GET() {
  const version =
    process.env.VERCEL_DEPLOYMENT_ID ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    "dev";

  return NextResponse.json(
    { version },
    { headers: { "Cache-Control": "no-store" } }
  );
}