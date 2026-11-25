"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Lang = "ar" | "tr";

const translations = {
  ar: {
    title: "إنشاء حساب",
    subtitle: "سجّل محلك في FixTrack",
    shopName: "اسم المحل",
    ownerName: "اسمك الكامل",
    phone: "رقم الهاتف",
    username: "اسم المستخدم (إنجليزي صغير)",
    password: "كلمة السر (10 أحرف على الأقل)",
    show: "إظهار كلمة السر",
    submit: "ابدأ التجربة المجانية",
    submitting: "جارٍ الإنشاء...",
    haveAccount: "لديك حساب؟",
    login: "تسجيل الدخول",
    errUsername: "اسم المستخدم غير صالح",
    errShort: "كلمة السر أقصر من 10 أحرف",
    errInvalid: "تحقق من البيانات المدخلة",
    errTaken: "اسم المستخدم مستخدم مسبقاً",
    errPhone: "رقم الهاتف مسجّل بمحل آخر",
    errRate: "محاولات كثيرة. حاول لاحقاً",
    errGeneric: "حدث خطأ. حاول مرة ثانية",
    switchLang: "🇹🇷 Türkçe",
  },
  tr: {
    title: "Hesap oluştur",
    subtitle: "Mağazanızı FixTrack'e kaydedin",
    shopName: "Mağaza adı",
    ownerName: "Adınız soyadınız",
    phone: "Telefon numarası",
    username: "Kullanıcı adı (küçük İngilizce harf)",
    password: "Şifre (en az 10 karakter)",
    show: "Şifreyi göster",
    submit: "Ücretsiz denemeyi başlat",
    submitting: "Oluşturuluyor...",
    haveAccount: "Hesabınız var mı?",
    login: "Giriş yap",
    errUsername: "Geçersiz kullanıcı adı",
    errShort: "Şifre 10 karakterden kısa",
    errInvalid: "Girilen bilgileri kontrol edin",
    errTaken: "Bu kullanıcı adı zaten kullanılıyor",
    errPhone: "Bu telefon numarası başka bir mağazada kayıtlı",
    errRate: "Çok fazla deneme. Daha sonra tekrar deneyin",
    errGeneric: "Bir hata oluştu. Tekrar deneyin",
    switchLang: "🇸🇦 العربية",
  },
};

const input =
  "mb-4 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600";
const label = "mb-1 block text-sm text-slate-500";

export default function RegisterPage() {
  const [language, setLanguage] = useState<Lang>("ar");
  const t = translations[language];
  const dir = language === "ar" ? "rtl" : "ltr";

  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
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

    const cleanUsername = username.trim().toLowerCase();

    if (!/^[a-z0-9._-]{3,32}$/.test(cleanUsername)) {
      setError(t.errUsername);
      return;
    }
    if (password.length < 10) {
      setError(t.errShort);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName,
          ownerName,
          phone,
          username: cleanUsername,
          password,
        }),
      });

      if (response.ok) {
        // التسجيل بيدخّلك تلقائياً، فنروح للوحة المحل.
        window.location.href = "/";
        return;
      }

      if (response.status === 422) {
        setError(t.errPhone);
      } else if (response.status === 409) {
        setError(t.errTaken);
      } else if (response.status === 429) {
        setError(t.errRate);
      } else if (response.status === 400) {
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

          <label className={label} htmlFor="shopName">
            {t.shopName}
          </label>
          <input
            id="shopName"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            required
            maxLength={80}
            className={input}
          />

          <label className={label} htmlFor="ownerName">
            {t.ownerName}
          </label>
          <input
            id="ownerName"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            required
            maxLength={80}
            className={input}
          />

          <label className={label} htmlFor="phone">
            {t.phone}
          </label>
          <input
            id="phone"
            type="tel"
            dir="ltr"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className={input}
          />

          <label className={label} htmlFor="username">
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
            className={input}
          />

          <label className={label} htmlFor="password">
            {t.password}
          </label>
          <input
            id="password"
            type={show ? "text" : "password"}
            dir="ltr"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mb-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
          />
          <label className="mb-4 flex items-center gap-2 text-sm text-slate-500">
            <input
              type="checkbox"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
            />
            {t.show}
          </label>

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
            {t.haveAccount}{" "}
            <Link href="/login" className="font-bold text-blue-700">
              {t.login}
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}