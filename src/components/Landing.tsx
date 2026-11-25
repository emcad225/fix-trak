"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Lang = "ar" | "tr";

const MONTHLY = 3500;
const YEARLY = 25000;

const content = {
  ar: {
    login: "تسجيل الدخول",
    start: "ابدأ مجاناً",
    heroTitle: "نظام إدارة محلات صيانة الهواتف",
    heroText:
      "استقبل أجهزة الزبائن، وتابع حالة كل طلب، وأعطِ زبونك رمز QR يفتح صفحة يشوف فيها حالة جهازه بنفسه. كل شي من مكان واحد، بالعربي والتركي.",
    cta: "ابدأ تجربة مجانية 7 أيام",
    ctaNote: "بدون بطاقة بنكية. نراجع طلبك ونفعّل حسابك.",
    featuresTitle: "كل الي يحتاجه محلك",
    features: [
      ["📋", "طلبات الصيانة", "سجّل الجهاز والعطل والسعر، وغيّر الحالة بضغطة."],
      ["📱", "تتبع بـ QR للزبون", "كل وصل فيه QR يفتح صفحة تعرض حالة الجهاز ومراحله، بدون تسجيل دخول."],
      ["💰", "الزبائن والحسابات", "سجل بزبائنك، مع العربون والدفعات وكم باقي على كل طلب."],
      ["📊", "التقارير", "المحصّل الشهري، والطلبات حسب الحالة، وأكثر الماركات تصليحاً."],
      ["👥", "موظفون بصلاحيات", "أضف موظفين بدون حد أقصى. الحذف والاسترجاع لمالك المحل فقط."],
      ["🔒", "بيانات منفصلة", "كل محل بيشوف بياناته فقط، ولا أحد يشوف بيانات محل ثاني."],
    ],
    stepsTitle: "كيف تبدأ",
    steps: [
      "سجّل محلك وانتظر التفعيل.",
      "أضف الطلبات واطبع الوصل مع رمز QR.",
      "تابع الحسابات والتقارير.",
    ],
    pricingTitle: "الأسعار",
    monthly: "شهري",
    yearly: "سنوي",
    perMonth: "لكل شهر",
    perYear: "لكل سنة",
    save: (n: number) => `وفّر ${n}%`,
    pricingNote: "تجربة مجانية 7 أيام. الدفع حالياً بتحويل بنكي.",
    finalTitle: "جاهز تجرّب؟",
        soonTitle: "قريباً",
    soonText:
      "إشعارات تلقائية للزبون عبر SMS وواتساب لحظة استلام جهازه، مع رابط تتبع الجهاز.",
    switchLang: "🇹🇷 Türkçe",
  },
  tr: {
    login: "Giriş yap",
    start: "Ücretsiz başla",
    heroTitle: "Telefon tamirhaneleri için yönetim sistemi",
    heroText:
      "Müşteri cihazlarını kaydedin, her talebin durumunu takip edin ve müşterinize cihazının durumunu kendi görebileceği bir QR kod verin. Hepsi tek yerde, Türkçe ve Arapça.",
    cta: "7 gün ücretsiz deneyin",
    ctaNote: "Banka kartı gerekmez. Talebinizi inceleyip hesabınızı etkinleştiririz.",
    featuresTitle: "Mağazanızın ihtiyacı olan her şey",
    features: [
      ["📋", "Tamir talepleri", "Cihazı, arızayı ve fiyatı kaydedin; durumu tek tıkla güncelleyin."],
      ["📱", "Müşteri için QR takip", "Her fişte, giriş gerektirmeden cihazın durumunu ve aşamalarını gösteren bir QR bulunur."],
      ["💰", "Müşteriler ve hesaplar", "Müşteri kayıtları, kapora ve ödemeler, her talepte kalan tutar."],
      ["📊", "Raporlar", "Aylık tahsilat, duruma göre talepler ve en çok tamir edilen markalar."],
      ["👥", "Yetkili çalışanlar", "Sınırsız çalışan ekleyin. Silme ve iade yalnızca mağaza sahibine aittir."],
      ["🔒", "Ayrı veriler", "Her mağaza yalnızca kendi verilerini görür."],
    ],
    stepsTitle: "Nasıl başlanır",
    steps: [
      "Mağazanızı kaydedin ve onayı bekleyin.",
      "Talepleri ekleyin, QR kodlu fişi yazdırın.",
      "Hesapları ve raporları takip edin.",
    ],
    pricingTitle: "Fiyatlar",
    monthly: "Aylık",
    yearly: "Yıllık",
    perMonth: "aylık",
    perYear: "yıllık",
    save: (n: number) => `%${n} tasarruf`,
    pricingNote: "7 gün ücretsiz deneme. Ödeme şimdilik banka havalesiyle yapılır.",
    finalTitle: "Denemeye hazır mısınız?",
        soonTitle: "Çok yakında",
    soonText:
      "Cihaz teslim alındığı anda müşteriye SMS ve WhatsApp ile otomatik bildirim, cihaz takip bağlantısıyla birlikte.",
    switchLang: "🇸🇦 العربية",
  },
};

function price(value: number) {
  return `${value.toLocaleString("tr-TR")} ₺`;
}

export default function Landing() {
  const [language, setLanguage] = useState<Lang>("ar");
  const t = content[language];
  const dir = language === "ar" ? "rtl" : "ltr";
  const yearlySave = Math.round((1 - YEARLY / (MONTHLY * 12)) * 100);

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

  return (
    <main dir={dir} className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <span className="text-xl font-black">🔧 FixTrack</span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-100"
            >
              {t.switchLang}
            </button>
            <Link
              href="/login"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-100"
            >
              {t.login}
            </Link>
            <Link
              href="/register"
              className="hidden rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white sm:inline-block"
            >
              {t.start}
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-[#10213d] px-4 py-16 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-black leading-tight sm:text-5xl">
            {t.heroTitle}
          </h1>
          <p className="mt-5 text-base leading-8 text-blue-100 sm:text-lg">
            {t.heroText}
          </p>
          <Link
            href="/register"
            className="mt-8 inline-block rounded-2xl bg-blue-500 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-blue-400"
          >
            {t.cta}
          </Link>
          <p className="mt-3 text-sm text-blue-200">{t.ctaNote}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="mb-8 text-center text-2xl font-extrabold">
          {t.featuresTitle}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.map(([icon, title, text]) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="text-3xl">{icon}</div>
              <h3 className="mt-3 text-lg font-extrabold">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>
                <section className="mx-auto max-w-3xl px-4 pb-4">
        <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 p-6 text-center">
          <span className="inline-block rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
            {t.soonTitle}
          </span>
          <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
            {t.soonText}
          </p>
        </div>
      </section>
      
      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-extrabold">
            {t.stepsTitle}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {t.steps.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-slate-200 p-5 text-center"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                  {index + 1}
                </div>
                <p className="mt-3 text-sm font-semibold leading-7">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="mb-8 text-center text-2xl font-extrabold">
          {t.pricingTitle}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="font-bold text-slate-500">{t.monthly}</p>
            <p className="mt-3 text-4xl font-black">{price(MONTHLY)}</p>
            <p className="mt-1 text-sm text-slate-500">{t.perMonth}</p>
          </div>
          <div className="rounded-2xl border-2 border-blue-600 bg-white p-6 text-center shadow-sm">
            <p className="font-bold text-slate-500">
              {t.yearly}{" "}
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                {t.save(yearlySave)}
              </span>
            </p>
            <p className="mt-3 text-4xl font-black">{price(YEARLY)}</p>
            <p className="mt-1 text-sm text-slate-500">{t.perYear}</p>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          {t.pricingNote}
        </p>
      </section>

      <section className="bg-[#10213d] px-4 py-14 text-center text-white">
        <h2 className="text-2xl font-extrabold">{t.finalTitle}</h2>
        <Link
          href="/register"
          className="mt-6 inline-block rounded-2xl bg-blue-500 px-8 py-4 text-lg font-bold text-white hover:bg-blue-400"
        >
          {t.cta}
        </Link>
      </section>

      <footer className="px-4 py-6 text-center text-xs text-slate-400">
        FixTrack © 2026
      </footer>
    </main>
  );
}