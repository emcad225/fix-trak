"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Lang = "ar" | "tr";

const translations = {
  ar: {
    title: "تسجيل الدخول",
    subtitle: "نظام إدارة الصيانة",
    username: "اسم المستخدم",
    password: "كلمة السر",
    submit: "تسجيل الدخول",
    submitting: "جارٍ الدخول...",
    showPassword: "إظهار كلمة السر",
    hidePassword: "إخفاء كلمة السر",
    noAccount: "ليس لديك حساب؟",
    register: "إنشاء حساب",
    errInvalid: "اسم المستخدم أو كلمة السر غير صحيحة",
    errInactive: "حسابك غير مفعّل بعد أو معطّل. تواصل مع الإدارة",
    errRate: "محاولات كثيرة. حاول مرة ثانية بعد قليل",
    errGeneric: "حدث خطأ. حاول مرة ثانية",
    switchLang: "🇹🇷 Türkçe",
  },
  tr: {
    title: "Giriş yap",
    subtitle: "Tamir yönetim sistemi",
    username: "Kullanıcı adı",
    password: "Şifre",
    submit: "Giriş yap",
    submitting: "Giriş yapılıyor...",
    showPassword: "Şifreyi göster",
    hidePassword: "Şifreyi gizle",
    noAccount: "Hesabınız yok mu?",
    register: "Hesap oluştur",
    errInvalid: "Kullanıcı adı veya şifre hatalı",
    errInactive:
      "Hesabınız henüz etkinleştirilmedi veya devre dışı. Yönetimle iletişime geçin",
    errRate: "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin",
    errGeneric: "Bir hata oluştu. Tekrar deneyin",
    switchLang: "🇸🇦 العربية",
  },
};

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="M3 3l18 18" />}
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [language, setLanguage] = useState<Lang>("ar");
  const t = translations[language];
  const dir = language === "ar" ? "rtl" : "ltr";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          role?: string;
        };
        router.replace(data.role === "PLATFORM_ADMIN" ? "/admin" : "/");
        router.refresh();
        return;
      }

      if (response.status === 429) {
        setError(t.errRate);
      } else if (response.status === 403) {
        setError(t.errInactive);
      } else if (response.status === 401) {
        setError(t.errInvalid);
      } else {
        setError(t.errGeneric);
      }
    } catch {
      setError(t.errGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      dir={dir}
      className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 text-slate-800"
    >
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            {t.switchLang}
          </button>
        </div>

        <header className="mb-6 rounded-3xl bg-[#10213d] p-7 text-center text-white shadow-lg">
          <div className="text-4xl">🔧</div>
          <h1 className="mt-2 text-3xl font-black">FixTrack</h1>
          <p className="mt-2 text-blue-200">{t.subtitle}</p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 text-xl font-extrabold">{t.title}</h2>

          <label className="mb-1 block text-sm text-slate-500" htmlFor="username">
            {t.username}
          </label>
          <input
            id="username"
            dir="ltr"
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="mb-4 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
          />

          <label className="mb-1 block text-sm text-slate-500" htmlFor="password">
            {t.password}
          </label>
          <div dir="ltr" className="relative mb-4">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              dir="ltr"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 py-3 pl-4 pr-12 outline-none focus:border-blue-600"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? t.hidePassword : t.showPassword}
              aria-pressed={showPassword}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <EyeIcon crossed={showPassword} />
            </button>
          </div>

          {error && (
            <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-60"
          >
            {submitting ? t.submitting : t.submit}
          </button>

          <p className="mt-5 text-center text-sm text-slate-500">
            {t.noAccount}{" "}
            <Link href="/register" className="font-bold text-blue-700">
              {t.register}
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}