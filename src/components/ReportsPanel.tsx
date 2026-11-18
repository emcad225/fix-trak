"use client";

import { useEffect, useState } from "react";

type Lang = "ar" | "tr";

type Report = {
  totals: {
    repairs: number;
    monthCollected: number;
    lastMonthCollected: number;
    avgPrice: number;
  };
  months: { key: string; collected: number; repairs: number }[];
  byStatus: Record<string, number>;
  topBrands: { name: string; count: number }[];
};

const statusOrder = [
  "RECEIVED",
  "DIAGNOSING",
  "WAITING_FOR_APPROVAL",
  "WAITING_FOR_PARTS",
  "IN_REPAIR",
  "TESTING",
  "READY_FOR_PICKUP",
  "DELIVERED",
  "CANCELLED",
];

const labels = {
  ar: {
    title: "التقارير",
    repairs: "إجمالي الطلبات",
    month: "المحصّل هذا الشهر",
    lastMonth: "المحصّل الشهر الماضي",
    avg: "متوسط سعر الطلب",
    monthly: "التحصيل آخر 6 شهور",
    statuses: "الطلبات حسب الحالة",
    brands: "أكثر الماركات تصليحاً",
    orders: "طلب",
    noBrands: "لا توجد بيانات بعد.",
    loading: "جارٍ التحميل...",
    error: "تعذر تحميل التقارير",
    status: {
      RECEIVED: "تم استلام الجهاز",
      DIAGNOSING: "قيد الفحص",
      WAITING_FOR_APPROVAL: "بانتظار موافقة الزبون",
      WAITING_FOR_PARTS: "بانتظار قطعة الغيار",
      IN_REPAIR: "قيد الإصلاح",
      TESTING: "قيد الاختبار",
      READY_FOR_PICKUP: "جاهز للاستلام",
      DELIVERED: "تم التسليم",
      CANCELLED: "ملغي",
    } as Record<string, string>,
  },
  tr: {
    title: "Raporlar",
    repairs: "Toplam talepler",
    month: "Bu ay tahsilat",
    lastMonth: "Geçen ay tahsilat",
    avg: "Ortalama talep fiyatı",
    monthly: "Son 6 ay tahsilat",
    statuses: "Duruma göre talepler",
    brands: "En çok tamir edilen markalar",
    orders: "talep",
    noBrands: "Henüz veri yok.",
    loading: "Yükleniyor...",
    error: "Raporlar yüklenemedi",
    status: {
      RECEIVED: "Cihaz teslim alındı",
      DIAGNOSING: "İnceleniyor",
      WAITING_FOR_APPROVAL: "Müşteri onayı bekleniyor",
      WAITING_FOR_PARTS: "Yedek parça bekleniyor",
      IN_REPAIR: "Tamir ediliyor",
      TESTING: "Test ediliyor",
      READY_FOR_PICKUP: "Teslime hazır",
      DELIVERED: "Teslim edildi",
      CANCELLED: "İptal edildi",
    } as Record<string, string>,
  },
};

function money(value: number) {
  return `${value.toLocaleString("tr-TR")} ₺`;
}

function Bar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  );
}

export default function ReportsPanel({ language }: { language: Lang }) {
  const t = labels[language];

  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/reports", { cache: "no-store" });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (response.status === 402) {
          window.location.href = "/billing";
          return;
        }
        if (!response.ok) throw new Error("LOAD");

        setData((await response.json()) as Report);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) return <p className="text-slate-500">{t.loading}</p>;

  if (error || !data) {
    return <p className="font-bold text-red-600">{t.error}</p>;
  }

  const maxMonth = Math.max(1, ...data.months.map((month) => month.collected));
  const maxStatus = Math.max(1, ...Object.values(data.byStatus));
  const maxBrand = Math.max(1, ...data.topBrands.map((brand) => brand.count));

  const cards = [
    { label: t.repairs, value: String(data.totals.repairs) },
    { label: t.month, value: money(data.totals.monthCollected) },
    { label: t.lastMonth, value: money(data.totals.lastMonthCollected) },
    { label: t.avg, value: money(data.totals.avgPrice) },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-extrabold">{t.title}</h3>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-extrabold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h4 className="mb-4 font-extrabold">{t.monthly}</h4>
        <div className="space-y-3">
          {data.months.map((month) => (
            <div key={month.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span dir="ltr" className="text-slate-500">
                  {month.key}
                </span>
                <span className="font-bold">{money(month.collected)}</span>
              </div>
              <Bar percent={(month.collected / maxMonth) * 100} color="bg-blue-500" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h4 className="mb-4 font-extrabold">{t.statuses}</h4>
          <div className="space-y-3">
            {statusOrder
              .filter((key) => data.byStatus[key])
              .map((key) => (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{t.status[key]}</span>
                    <span className="font-bold">{data.byStatus[key]}</span>
                  </div>
                  <Bar
                    percent={(data.byStatus[key] / maxStatus) * 100}
                    color="bg-emerald-500"
                  />
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h4 className="mb-4 font-extrabold">{t.brands}</h4>
          {data.topBrands.length === 0 ? (
            <p className="text-sm text-slate-400">{t.noBrands}</p>
          ) : (
            <div className="space-y-3">
              {data.topBrands.map((brand) => (
                <div key={brand.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span dir="ltr">{brand.name}</span>
                    <span className="font-bold">
                      {brand.count} {t.orders}
                    </span>
                  </div>
                  <Bar
                    percent={(brand.count / maxBrand) * 100}
                    color="bg-orange-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}