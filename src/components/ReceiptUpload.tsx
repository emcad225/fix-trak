"use client";

import { FormEvent, useEffect, useState } from "react";

type Plan = "MONTHLY" | "YEARLY";
type Lang = "ar" | "tr";

type Latest = {
  status: "PENDING" | "APPROVED" | "REJECTED";
  plan: Plan;
  createdAt: string;
  note: string | null;
} | null;

const MAX_BYTES = 4 * 1024 * 1024;

const labels = {
  ar: {
    title: "ارفع صورة الوصل",
    hint: "صورة (JPG أو PNG) أو PDF، حتى 4MB.",
    choose: "اختر الملف",
    noneChosen: "لم يتم اختيار ملف",
    submit: "إرسال الوصل",
    submitting: "جارٍ الإرسال...",
    ok: "تم إرسال الوصل. سنراجعه ونفعّل اشتراكك بأقرب وقت.",
    pending: "وصلك قيد المراجعة. سنفعّل اشتراكك بعد التأكد من التحويل.",
    approved: "آخر وصل تم قبوله.",
    rejected: "آخر وصل تم رفضه. تأكد من التحويل وأرسل وصلاً جديداً.",
    reason: "سبب الرفض:",
    noFile: "اختر ملفاً أولاً",
    tooLarge: "الملف أكبر من 4MB",
    badType: "نوع الملف غير مدعوم (JPG أو PNG أو PDF)",
    alreadyPending: "عندك وصل قيد المراجعة بالفعل",
    generic: "تعذر إرسال الوصل. حاول مرة ثانية",
  },
  tr: {
    title: "Dekontu yükleyin",
    hint: "Görsel (JPG veya PNG) ya da PDF, en fazla 4MB.",
    choose: "Dosya seç",
    noneChosen: "Dosya seçilmedi",
    submit: "Dekontu gönder",
    submitting: "Gönderiliyor...",
    ok: "Dekont gönderildi. İnceleyip aboneliğinizi en kısa sürede etkinleştireceğiz.",
    pending: "Dekontunuz inceleniyor. Havale doğrulandıktan sonra aboneliğiniz etkinleşecek.",
    approved: "Son dekont onaylandı.",
    rejected: "Son dekont reddedildi. Havaleyi kontrol edip yeni dekont gönderin.",
    reason: "Ret nedeni:",
    noFile: "Önce bir dosya seçin",
    tooLarge: "Dosya 4MB'tan büyük",
    badType: "Desteklenmeyen dosya türü (JPG, PNG veya PDF)",
    alreadyPending: "İncelenen bir dekontunuz zaten var",
    generic: "Dekont gönderilemedi. Tekrar deneyin",
  },
};

export default function ReceiptUpload({
  plan,
  language,
}: {
  plan: Plan;
  language?: Lang;
}) {
  const [lang, setLang] = useState<Lang>(language ?? "ar");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [latest, setLatest] = useState<Latest>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const t = labels[language ?? lang];

  useEffect(() => {
    if (language) return;
    try {
      const saved = localStorage.getItem("fixtrack-language");
      if (saved === "ar" || saved === "tr") setLang(saved);
    } catch {
      // تجاهل أخطاء التخزين
    }
  }, [language]);

  async function loadLatest() {
    try {
      const response = await fetch("/api/billing/receipt", {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = (await response.json()) as { latest: Latest };
      setLatest(data.latest);
    } catch {
      // تجاهل أخطاء الشبكة
    }
  }

  useEffect(() => {
    void loadLatest();
  }, []);

  function fail(text: string) {
    setIsError(true);
    setMessage(text);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    if (!file) return fail(t.noFile);
    if (file.size > MAX_BYTES) return fail(t.tooLarge);

    setSubmitting(true);

    try {
      const form = new FormData();
      form.set("plan", plan);
      form.set("file", file);

      const response = await fetch("/api/billing/receipt", {
        method: "POST",
        body: form,
      });

      if (response.ok) {
        setFile(null);
        setFileKey((k) => k + 1);
        setMessage(t.ok);
        await loadLatest();
        return;
      }

      if (response.status === 413) return fail(t.tooLarge);
      if (response.status === 409) return fail(t.alreadyPending);

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (data.error === "INVALID_TYPE") return fail(t.badType);

      fail(t.generic);
    } catch {
      fail(t.generic);
    } finally {
      setSubmitting(false);
    }
  }

  const statusText =
    latest?.status === "PENDING"
      ? t.pending
      : latest?.status === "APPROVED"
        ? t.approved
        : latest?.status === "REJECTED"
          ? t.rejected
          : "";

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-2 text-lg font-extrabold">{t.title}</h3>
      <p className="mb-4 text-sm text-slate-500">{t.hint}</p>

      {statusText && (
        <div className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800">
          <p>{statusText}</p>
          {latest?.status === "REJECTED" && latest.note && (
            <p className="mt-2 text-red-700">
              {t.reason} {latest.note}
            </p>
          )}
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <label className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold hover:bg-slate-200">
          {t.choose}
          <input
            key={fileKey}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="sr-only"
          />
        </label>
        <span className="min-w-0 truncate text-sm text-slate-500">
          {file ? file.name : t.noneChosen}
        </span>
      </div>

      {message && (
        <p
          className={`mb-4 rounded-xl px-4 py-3 text-sm font-bold ${
            isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !file}
        className="w-full rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-60"
      >
        {submitting ? t.submitting : t.submit}
      </button>
    </form>
  );
}