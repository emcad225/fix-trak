"use client";

import { useEffect, useState } from "react";
import ReceiptUpload from "@/components/ReceiptUpload";

type Lang = "ar" | "tr";
type Plan = "MONTHLY" | "YEARLY";
type Status = "PENDING" | "TRIAL" | "SUBSCRIBED" | "EXPIRED" | "DISABLED";

type Billing = {
  isOwner: boolean;
  shop: {
    number: number;
    name: string;
    status: Status;
    plan: Plan | null;
    trialEndsAt: string | null;
    subscribedUntil: string | null;
  };
  bank: { holder: string; iban: string } | null;
  prices: Record<Plan, number>;
  requests: {
    id: string;
    plan: Plan;
    status: "PENDING" | "APPROVED" | "REJECTED";
    note: string | null;
    createdAt: string;
  }[];
};

const translations = {
  ar: {
    title: "الاشتراك والدفع",
    logout: "خروج",
    back: "العودة للوحة التحكم",
    shopNumber: "رقم المحل",
    loading: "جارٍ التحميل...",
    errLoad: "تعذر تحميل البيانات",
    noShop: "هذه الصفحة لأصحاب المحلات فقط",
    toAdmin: "الذهاب للوحة الإدارة",
    trial: (n: number) => `تجربتك المجانية تنتهي بعد ${n} يوم. اشترك لتستمر بدون انقطاع.`,
    expired: "انتهت فترتك التجريبية أو اشتراكك. اشترك الآن لتعود لاستخدام النظام.",
    subscribed: (date: string) => `اشتراكك فعّال حتى ${date}.`,
    disabled: "تم تعطيل حسابك. تواصل مع الإدارة.",
    pending: "محلك بانتظار موافقة الإدارة.",
    plansTitle: "اختر الباقة",
    monthly: "شهري",
    yearly: "سنوي",
    perMonth: "للشهر الواحد",
    perYear: "للسنة الكاملة",
    save: (n: number) => `وفّر ${n}%`,
    selected: "الباقة المختارة",
    payTitle: "طريقة الدفع: تحويل بنكي",
    payStep1: "حوّل المبلغ إلى الحساب التالي:",
    holder: "اسم صاحب الحساب",
    iban: "رقم IBAN",
    amount: "المبلغ المطلوب",
    payStep2: "اكتب هذا النص في وصف التحويل:",
    copy: "نسخ",
    copied: "تم النسخ ✓",
    payStep3: "بعد التحويل، ارفع صورة الوصل بالأسفل ليتم تفعيل اشتراكك.",
    ownerOnly: "الدفع من صلاحية مالك المحل. تواصل معه ليجدّد الاشتراك.",
    requestsTitle: "طلبات الدفع السابقة",
    reqStatus: {
      PENDING: "قيد المراجعة",
      APPROVED: "مقبول",
      REJECTED: "مرفوض",
    },
    switchLang: "🇹🇷 Türkçe",
  },
  tr: {
    title: "Abonelik ve ödeme",
    logout: "Çıkış",
    back: "Kontrol paneline dön",
    shopNumber: "Mağaza no",
    loading: "Yükleniyor...",
    errLoad: "Veriler yüklenemedi",
    noShop: "Bu sayfa yalnızca mağaza sahipleri içindir",
    toAdmin: "Yönetim paneline git",
    trial: (n: number) => `Ücretsiz denemeniz ${n} gün sonra bitiyor. Kesintisiz devam etmek için abone olun.`,
    expired: "Deneme süreniz veya aboneliğiniz bitti. Sistemi kullanmaya devam etmek için abone olun.",
    subscribed: (date: string) => `Aboneliğiniz ${date} tarihine kadar aktif.`,
    disabled: "Hesabınız devre dışı bırakıldı. Yönetimle iletişime geçin.",
    pending: "Mağazanız yönetim onayı bekliyor.",
    plansTitle: "Paketi seçin",
    monthly: "Aylık",
    yearly: "Yıllık",
    perMonth: "aylık",
    perYear: "yıllık",
    save: (n: number) => `%${n} tasarruf`,
    selected: "Seçilen paket",
    payTitle: "Ödeme yöntemi: Banka havalesi",
    payStep1: "Tutarı aşağıdaki hesaba havale edin:",
    holder: "Hesap sahibi",
    iban: "IBAN",
    amount: "Ödenecek tutar",
    payStep2: "Havale açıklamasına şunu yazın:",
    copy: "Kopyala",
    copied: "Kopyalandı ✓",
    payStep3: "Havaleden sonra dekontu aşağıdan yükleyin, aboneliğiniz etkinleştirilsin.",
    ownerOnly: "Ödeme mağaza sahibinin yetkisindedir. Aboneliği yenilemesi için onunla iletişime geçin.",
    requestsTitle: "Önceki ödeme talepleri",
    reqStatus: {
      PENDING: "İnceleniyor",
      APPROVED: "Onaylandı",
      REJECTED: "Reddedildi",
    },
    switchLang: "🇸🇦 العربية",
  },
};

function formatPrice(value: number) {
  return `${value.toLocaleString("tr-TR")} ₺`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toISOString().slice(0, 10);
}

function daysLeft(value: string | null) {
  if (!value) return 0;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86400000));
}

export default function BillingPage() {
  const [language, setLanguage] = useState<Lang>("ar");
  const t = translations[language];
  const dir = language === "ar" ? "rtl" : "ltr";

  const [data, setData] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noShop, setNoShop] = useState(false);
  const [plan, setPlan] = useState<Plan>("YEARLY");
  const [copied, setCopied] = useState("");

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
    async function load() {
      try {
        const response = await fetch("/api/billing", { cache: "no-store" });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (response.status === 403) {
          setNoShop(true);
          return;
        }
        if (!response.ok) throw new Error("LOAD");

        setData((await response.json()) as Billing);
      } catch {
        setError("LOAD");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(""), 2000);
    } catch {
      // تجاهل لو المتصفح منع النسخ
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  const shell = (content: React.ReactNode) => (
    <main dir={dir} className="min-h-screen bg-[#f4f7fb] text-slate-800">
      <header className="flex min-h-20 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-8">
        <div>
          <p className="text-sm text-slate-500">FixTrack</p>
          <h1 className="mt-1 text-xl font-extrabold">{t.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-100"
          >
            {t.switchLang}
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
          >
            ⎋ {t.logout}
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-3xl p-4 sm:p-8">{content}</div>
    </main>
  );

  if (loading) return shell(<p className="text-slate-500">{t.loading}</p>);

  if (noShop) {
    return shell(
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="font-bold text-red-600">{t.noShop}</p>
        <a
          href="/admin"
          className="mt-5 inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
        >
          {t.toAdmin}
        </a>
      </div>
    );
  }

  if (error || !data) {
    return shell(<p className="font-bold text-red-600">{t.errLoad}</p>);
  }

  const { shop, bank, prices } = data;
  const canUse = shop.status === "TRIAL" || shop.status === "SUBSCRIBED";
  const yearlySave = Math.round((1 - prices.YEARLY / (prices.MONTHLY * 12)) * 100);
  const reference = `FixTrack #${shop.number} - ${shop.name}`;

  let banner = t.expired;
  let bannerStyle = "border-orange-200 bg-orange-50 text-orange-800";

  if (shop.status === "TRIAL") {
    banner = t.trial(daysLeft(shop.trialEndsAt));
    bannerStyle = "border-blue-200 bg-blue-50 text-blue-800";
  } else if (shop.status === "SUBSCRIBED") {
    banner = t.subscribed(formatDate(shop.subscribedUntil));
    bannerStyle = "border-emerald-200 bg-emerald-50 text-emerald-800";
  } else if (shop.status === "DISABLED") {
    banner = t.disabled;
    bannerStyle = "border-red-200 bg-red-50 text-red-800";
  } else if (shop.status === "PENDING") {
    banner = t.pending;
    bannerStyle = "border-amber-200 bg-amber-50 text-amber-800";
  }

  const CopyButton = ({ id, text }: { id: string; text: string }) => (
    <button
      type="button"
      onClick={() => void copy(id, text)}
      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100"
    >
      {copied === id ? t.copied : t.copy}
    </button>
  );

  return shell(
    <>
      <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">
          {t.shopNumber}: <span className="font-bold text-slate-800">#{shop.number}</span>
        </p>
        <h2 className="mt-1 text-2xl font-extrabold">{shop.name}</h2>
      </div>

      <div className={`mb-5 rounded-xl border p-4 text-sm font-bold ${bannerStyle}`}>
        {banner}
      </div>

      {canUse && (
        <a
          href="/"
          className="mb-5 inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
        >
          {t.back}
        </a>
      )}

      {!data.isOwner ? (
        <div className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm">
          {t.ownerOnly}
        </div>
      ) : (
        <>
          <h3 className="mb-3 text-lg font-extrabold">{t.plansTitle}</h3>
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            {(["MONTHLY", "YEARLY"] as Plan[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPlan(key)}
                aria-pressed={plan === key}
                className={`rounded-2xl border-2 bg-white p-5 text-start shadow-sm transition ${
                  plan === key ? "border-blue-600" : "border-transparent hover:border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold">
                    {key === "MONTHLY" ? t.monthly : t.yearly}
                  </span>
                  {key === "YEARLY" && (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                      {t.save(yearlySave)}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-3xl font-extrabold">{formatPrice(prices[key])}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {key === "MONTHLY" ? t.perMonth : t.perYear}
                </p>
                {plan === key && (
                  <p className="mt-3 text-xs font-bold text-blue-700">✓ {t.selected}</p>
                )}
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-extrabold">{t.payTitle}</h3>

            <p className="mb-3 text-sm text-slate-600">1. {t.payStep1}</p>

            <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">{t.holder}</p>
                <p className="mt-1 font-bold">{bank?.holder || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t.iban}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p dir="ltr" className="break-all font-mono font-bold">
                    {bank?.iban || "—"}
                  </p>
                  {bank?.iban && <CopyButton id="iban" text={bank.iban} />}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t.amount}</p>
                <p className="mt-1 text-lg font-extrabold text-blue-700">
                  {formatPrice(prices[plan])}
                </p>
              </div>
            </div>

            <p className="mb-3 mt-5 text-sm text-slate-600">2. {t.payStep2}</p>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-4 text-sm">
              <p dir="ltr" className="break-all font-mono font-bold">
                {reference}
              </p>
              <CopyButton id="ref" text={reference} />
            </div>

            <p className="mt-5 text-sm text-slate-600">3. {t.payStep3}</p>
          </div>
                    {shop.status !== "DISABLED" && shop.status !== "PENDING" && (
            <ReceiptUpload plan={plan} language={language} />
          )}
          {data.requests.length > 0 && (
            <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-extrabold">{t.requestsTitle}</h3>
              <ul className="space-y-2 text-sm">
                {data.requests.map((request) => (
                  <li
                    key={request.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                  >
                    <span>
                      {request.plan === "MONTHLY" ? t.monthly : t.yearly} ·{" "}
                      <span dir="ltr">{formatDate(request.createdAt)}</span>
                    </span>
                    <span className="font-bold">{t.reqStatus[request.status]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </>
  );
}