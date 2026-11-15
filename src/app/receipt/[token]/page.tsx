"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";

type Lang = "ar" | "tr";

type Repair = {
  id: string;
  trackingToken: string;
  customer: string;
  phone: string;
  device: string;
  issue: string;
  status: string;
  date: string;
  price: number;
};

// قيم الحالات تبقى بالعربية لأنها مخزنة هكذا في قاعدة البيانات
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

const translations = {
  ar: {
    preparing: "جارٍ تجهيز الوصل...",
    notFound: "لم يتم العثور على الطلب",
    errLoad: "تعذر تحميل طلبات الصيانة",
    errNotFound: "لم يتم العثور على الطلب. تأكد أن API يعيد trackingToken.",
    errGeneric: "حدث خطأ أثناء تجهيز الوصل",
    print: "🖨️ طباعة الوصل",
    back: "رجوع",
    receiptTitle: "وصل استلام جهاز للصيانة",
    orderNumber: "رقم الطلب",
    date: "التاريخ",
    customer: "اسم الزبون",
    phone: "رقم الهاتف",
    device: "الجهاز",
    issue: "العطل",
    status: "الحالة",
    price: "السعر التقديري",
    qrAlt: "QR لتتبع حالة الصيانة",
    scan: "امسح الرمز لمتابعة حالة جهازك",
    keep: "حافظ على هذا الوصل حتى استلام الجهاز",
    thanks: "شكرًا لثقتكم بـ FixTrack",
    switchLang: "🇹🇷 Türkçe",
  },
  tr: {
    preparing: "Fiş hazırlanıyor...",
    notFound: "Talep bulunamadı",
    errLoad: "Tamir talepleri yüklenemedi",
    errNotFound: "Talep bulunamadı. API'nin trackingToken döndürdüğünden emin olun.",
    errGeneric: "Fiş hazırlanırken bir hata oluştu",
    print: "🖨️ Fişi yazdır",
    back: "Geri",
    receiptTitle: "Cihaz Tamir Teslim Fişi",
    orderNumber: "Talep No",
    date: "Tarih",
    customer: "Müşteri Adı",
    phone: "Telefon",
    device: "Cihaz",
    issue: "Arıza",
    status: "Durum",
    price: "Tahmini Fiyat",
    qrAlt: "Tamir durumunu takip için QR",
    scan: "Cihazınızın durumunu takip etmek için kodu okutun",
    keep: "Cihazı teslim alana kadar bu fişi saklayın",
    thanks: "FixTrack'e güvendiğiniz için teşekkürler",
    switchLang: "🇸🇦 العربية",
  },
};

export default function ReceiptPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [language, setLanguage] = useState<Lang>("ar");
  const t = translations[language];
  const isAr = language === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const textStart = isAr ? "text-right" : "text-left";

  const [repair, setRepair] = useState<Repair | null>(null);
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const statusLabel = (status: string) =>
    isAr ? status : statusLabelsTr[status] ?? status;

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

  useEffect(() => {
    async function loadReceipt() {
      try {
        const response = await fetch("/api/repairs");
        const data = await response.json();

        if (!response.ok || !Array.isArray(data)) {
          throw new Error("LOAD_FAILED");
        }

        const selected = data.find(
          (item: Repair) => item.trackingToken === token
        );

        if (!selected) {
          throw new Error("NOT_FOUND");
        }

        setRepair(selected);

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/+$/, "");
const trackingUrl = `${baseUrl}/track/${encodeURIComponent(token)}`;        const qrImage = await QRCode.toDataURL(trackingUrl, {
          width: 240,
          margin: 1,
          errorCorrectionLevel: "M",
        });

        setQr(qrImage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "GENERIC");
      } finally {
        setLoading(false);
      }
    }

    void loadReceipt();
  }, [token]);

  const errorText =
    error === "LOAD_FAILED"
      ? t.errLoad
      : error === "NOT_FOUND"
        ? t.errNotFound
        : error === "GENERIC"
          ? t.errGeneric
          : error;

  if (loading) {
    return (
      <main dir={dir} className="p-8 text-center">
        {t.preparing}
      </main>
    );
  }

  if (error || !repair) {
    return (
      <main dir={dir} className="p-8 text-center text-red-600">
        {errorText || t.notFound}
      </main>
    );
  }

  return (
    <main dir={dir} className="min-h-screen bg-slate-100 p-4 text-black">
      <div className="no-print mx-auto mb-4 flex max-w-[80mm] flex-wrap justify-between gap-2">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-blue-600 px-4 py-3 font-bold text-white"
        >
          {t.print}
        </button>
        <button
          onClick={toggleLanguage}
          className="rounded-lg border bg-white px-4 py-3 font-bold"
        >
          {t.switchLang}
        </button>
        <button
          onClick={() => window.history.back()}
          className="rounded-lg border bg-white px-4 py-3"
        >
          {t.back}
        </button>
      </div>

      <article className="receipt mx-auto w-[74mm] bg-white p-2 text-center text-sm">
        <h1 className="text-2xl font-black">FixTrack</h1>
        <p className="mt-1 font-bold">{t.receiptTitle}</p>
        <hr className="my-3 border-dashed border-black" />

        <div className={`space-y-2 ${textStart}`}>
          <p><strong>{t.orderNumber}:</strong> {repair.id}</p>
          <p><strong>{t.date}:</strong> {repair.date}</p>
          <p><strong>{t.customer}:</strong> {repair.customer}</p>
          <p><strong>{t.phone}:</strong> <span dir="ltr">{repair.phone}</span></p>
          <p><strong>{t.device}:</strong> {repair.device}</p>
          <p><strong>{t.issue}:</strong> {repair.issue}</p>
          <p><strong>{t.status}:</strong> {statusLabel(repair.status)}</p>
          <p><strong>{t.price}:</strong> {repair.price.toLocaleString("tr-TR")} ₺</p>
        </div>

        <hr className="my-3 border-dashed border-black" />

        {qr && (
          <div className="flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt={t.qrAlt} className="h-48 w-48" />
            <p className="mt-2 font-bold">{t.scan}</p>
            <p className="mt-1 text-xs">{t.keep}</p>
          </div>
        )}

        <hr className="my-3 border-dashed border-black" />
        <p className="font-bold">{t.thanks}</p>
      </article>

      <style jsx global>{`
        @page {
          size: 80mm auto;
          margin: 3mm;
        }

        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          .receipt {
            width: 74mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </main>
  );
}