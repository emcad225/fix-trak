"use client";

import { useEffect, useRef, useState } from "react";

type Lang = "ar" | "tr";

const labels = {
  ar: {
    text: "يوجد تحديث جديد للنظام. يرجى إعادة تحميل الصفحة، وإعادة تسجيل الدخول إذا طُلب منك.",
    reload: "تحديث الآن",
    later: "لاحقاً",
  },
  tr: {
    text: "Sistemde yeni bir güncelleme var. Lütfen sayfayı yenileyin ve istenirse tekrar giriş yapın.",
    reload: "Şimdi güncelle",
    later: "Sonra",
  },
};

export default function UpdateNotice() {
  const [language, setLanguage] = useState<Lang>("ar");
  const [latest, setLatest] = useState<string | null>(null);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const initial = useRef<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fixtrack-language");
      if (saved === "ar" || saved === "tr") setLanguage(saved);
    } catch {
      // تجاهل أخطاء التخزين
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const response = await fetch("/api/version", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as { version?: unknown };
        if (cancelled || typeof data.version !== "string") return;

        if (initial.current === null) {
          initial.current = data.version;
          return;
        }

        setLatest(data.version);
      } catch {
        // تجاهل أخطاء الشبكة
      }
    }

    void check();
    const timer = window.setInterval(() => void check(), 60_000);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const outdated =
    latest !== null && initial.current !== null && latest !== initial.current;

  if (!outdated || dismissedFor === latest) return null;

  const t = labels[language];

  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      role="status"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-2xl bg-[#10213d] p-4 text-sm text-white shadow-2xl sm:flex-row sm:items-center"
    >
      <p className="flex-1 leading-7">{t.text}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-400"
        >
          {t.reload}
        </button>
        <button
          type="button"
          onClick={() => setDismissedFor(latest)}
          className="rounded-xl border border-white/30 px-4 py-2 font-semibold hover:bg-white/10"
        >
          {t.later}
        </button>
      </div>
    </div>
  );
}