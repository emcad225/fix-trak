"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Lang = "ar" | "tr";

type TrackingData = {
  id: string;
  device: string;
  status: string;
  receivedAt: string;
  stages: {
    status: string;
    note: string | null;
    date: string;
  }[];
};

const statusLabelsTr: Record<string, string> = {
  "تم استلام الجهاز": "Cihaz teslim alındı",
  "قيد الفحص": "İnceleniyor",
  "بانتظار موافقة الزبون": "Müşteri onayı bekleniyor",
  "بانتظار قطعة الغيار": "Yedek parça bekleniyor",
  "قيد الإصلاح": "Tamir ediliyor",
  "قيد الاختبار": "Test ediliyor",
  "جاهز للاستلام": "Teslime hazır",
  "تم التسليم": "Teslim edildi",
  "ملغي": "İptal edildi",
};



// ملاحظات جاهزة يولّدها النظام. أضف هنا أي ملاحظة ثابتة جديدة.
// ملاحظات جاهزة يولّدها النظام. أضف هنا أي ملاحظة ثابتة جديدة.
const noteLabelsTr: Record<string, string> = {
  "تم إنشاء طلب الصيانة": "Tamir talebi oluşturuldu",
  "تم تحديث حالة الصيانة": "Tamir durumu güncellendi",
};


const translations = {
  ar: {
    loading: "جارٍ تحميل حالة جهازك...",
    errTitle: "تعذر عرض التتبع",
    errLoad: "تعذر تحميل معلومات الجهاز",
    errGeneric: "حدث خطأ أثناء تحميل البيانات",
    notFound: "لم يتم العثور على الطلب",
    retry: "إعادة المحاولة",
    subtitle: "تتبّع حالة جهازك أونلاين",
    orderNumber: "رقم طلب الصيانة",
    device: "الجهاز",
    defaultDevice: "جهاز صيانة",
    receivedDate: "تاريخ الاستلام",
    stagesTitle: "مراحل الصيانة",
    noStages: "لم تُسجّل مراحل الصيانة بعد.",
    current: "الحالة الحالية",
    autoRefresh: "يتم تحديث حالة الصيانة تلقائياً كل 15 ثانية.",
    footer: "FixTrack — نتمنى لك تجربة مريحة",
    switchLang: "🇹🇷 Türkçe",
  },
  tr: {
    loading: "Cihazınızın durumu yükleniyor...",
    errTitle: "Takip görüntülenemedi",
    errLoad: "Cihaz bilgileri yüklenemedi",
    errGeneric: "Veriler yüklenirken bir hata oluştu",
    notFound: "Talep bulunamadı",
    retry: "Tekrar dene",
    subtitle: "Cihazınızın durumunu online takip edin",
    orderNumber: "Tamir talep numarası",
    device: "Cihaz",
    defaultDevice: "Tamir cihazı",
    receivedDate: "Teslim alma tarihi",
    stagesTitle: "Tamir aşamaları",
    noStages: "Henüz tamir aşaması kaydedilmedi.",
    current: "Güncel durum",
    autoRefresh: "Tamir durumu her 15 saniyede bir otomatik güncellenir.",
    footer: "FixTrack — Rahat bir deneyim dileriz",
    switchLang: "🇸🇦 العربية",
  },
};

export default function TrackingPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [language, setLanguage] = useState<Lang>("ar");
  const t = translations[language];
  const isAr = language === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const statusLabel = (status: string) =>
    isAr ? status : statusLabelsTr[status] ?? status;

  const noteLabel = (note: string) =>
    isAr ? note : noteLabelsTr[note] ?? note;

  function applyLanguage(lang: Lang) {
    setLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }

  function toggleLanguage() {
    const next: Lang = language === "ar" ? "tr" : "ar";
    applyLanguage(next);

    try {
      localStorage.setItem("fixtrack-language", next);
    } catch {
      // تجاهل أخطاء التخزين
    }
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fixtrack-language");

      if (saved === "ar" || saved === "tr") {
        applyLanguage(saved);
      }
    } catch {
      // تجاهل أخطاء التخزين
    }
  }, []);

  const loadTracking = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/track/${encodeURIComponent(token)}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "LOAD_FAILED");
      }

      setData(result as TrackingData);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "GENERIC");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadTracking();

    const timer = window.setInterval(() => {
      void loadTracking();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [loadTracking]);

  const errorText =
    error === "LOAD_FAILED"
      ? t.errLoad
      : error === "GENERIC"
        ? t.errGeneric
        : error;

  const langButton = (
    <button
      type="button"
      onClick={toggleLanguage}
      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
    >
      {t.switchLang}
    </button>
  );

  if (loading) {
    return (
      <main
        dir={dir}
        className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-800"
      >
        {t.loading}
      </main>
    );
  }

  if (error || !data) {
    return (
      <main
        dir={dir}
        className="flex min-h-screen items-center justify-center bg-slate-100 p-6"
      >
        <div className="rounded-2xl bg-white p-8 text-center shadow">
          <h1 className="text-xl font-bold text-red-600">
            {t.errTitle}
          </h1>

          <p className="mt-3 text-slate-600">
            {errorText || t.notFound}
          </p>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setError("");
                setLoading(true);
                void loadTracking();
              }}
              className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
            >
              {t.retry}
            </button>

            {langButton}
          </div>
        </div>
      </main>
    );
  }

  const stages = data.stages ?? [];

  // تنسيق التاريخ بأمان لتجنب تعطل الصفحة عند وجود تاريخ غير صالح.
  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toISOString().slice(0, 10);
  };

  const formatDateTime = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toISOString().replace("T", " ").slice(0, 16);
  };

  return (
    <main
      dir={dir}
      className="min-h-screen bg-slate-100 px-4 py-8 text-slate-800"
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex justify-end">
          {langButton}
        </div>

        <header className="mb-6 rounded-3xl bg-[#10213d] p-7 text-center text-white shadow-lg">
          <div className="text-4xl">🔧</div>
          <h1 className="mt-2 text-3xl font-black">FixTrack</h1>
          <p className="mt-2 text-blue-200">{t.subtitle}</p>
        </header>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div>
              <p className="text-sm text-slate-500">
                {t.orderNumber}
              </p>
              <h2
                dir="ltr"
                className="mt-1 text-2xl font-black"
              >
                {data.id}
              </h2>
            </div>

            <span className="rounded-full bg-blue-100 px-4 py-2 font-bold text-blue-800">
              {statusLabel(data.status)}
            </span>
          </div>

          <div className="py-5">
            <p className="text-sm text-slate-500">{t.device}</p>
            <h3 className="mt-1 text-xl font-bold">
              {data.device || t.defaultDevice}
            </h3>

            <p className="mt-3 text-sm text-slate-500">
              {t.receivedDate}: {formatDate(data.receivedAt)}
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-extrabold">
            {t.stagesTitle}
          </h2>

          {stages.length === 0 ? (
            <p className="text-slate-500">{t.noStages}</p>
          ) : (
            <div className="space-y-0">
              {stages.map((stage, index) => {
                const isCurrent = stage.status === data.status;

                return (
                  <div
                    key={`${stage.date}-${index}`}
                    className="relative flex gap-4 pb-7 last:pb-0"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`z-10 flex h-9 w-9 items-center justify-center rounded-full ${
                          isCurrent
                            ? "bg-blue-600 text-white"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {isCurrent ? "●" : "✓"}
                      </div>

                      {index < stages.length - 1 && (
                        <div className="absolute mt-9 h-full w-0.5 bg-slate-200" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">
                          {statusLabel(stage.status)}
                        </h3>

                        {isCurrent && (
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                            {t.current}
                          </span>
                        )}
                      </div>

                      {stage.note && (
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {noteLabel(stage.note)}
                        </p>
                      )}

                      <p
                        dir="ltr"
                        className={`mt-2 text-xs text-slate-400 ${
                          isAr ? "text-right" : "text-left"
                        }`}
                      >
                        {formatDateTime(stage.date)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t.autoRefresh}
        </p>

        <p className="mt-2 text-center text-xs text-slate-400">
          {t.footer}
        </p>
      </div>
    </main>
  );
}