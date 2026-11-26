"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Payment = {
  id: string;
  plan: "MONTHLY" | "YEARLY";
  status: "PENDING" | "APPROVED" | "REJECTED";
  note: string | null;
  createdAt: string;
  reviewedAt: string | null;
  receiptMime: string;
  amount: number;
  shop: {
    shopNumber: number;
    name: string;
    phone: string | null;
    isActive: boolean;
    subscribedUntil: string | null;
    trialEndsAt: string | null;
  };
};

const statusLabel = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

const statusStyle = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
};

const errorText: Record<string, string> = {
  ALREADY_REVIEWED: "هالطلب انراجع من قبل. حدّث الصفحة.",
  SHOP_INACTIVE: "المحل معطّل. فعّله من تبويب المحلات أولاً.",
  NOT_FOUND: "الطلب غير موجود.",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
}

function formatPrice(value: number) {
  return `${value.toLocaleString("tr-TR")} ₺`;
}

export default function AdminPayments({
  onPendingCount,
  onApproved,
}: {
  // بنبلّغ الصفحة الأم بعدد الوصولات قيد المراجعة (للشارة بالتبويب).
  onPendingCount?: (count: number) => void;
  // بعد قبول وصل، لتحدّث الصفحة الأم جدول المحلات.
  onApproved?: () => void;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [onlyPending, setOnlyPending] = useState(true);

  // نحفظ الدوال بمرجع، حتى ما يتكرر التحميل لو الصفحة الأم غيّرتها.
  const callbacks = useRef({ onPendingCount, onApproved });
  useEffect(() => {
    callbacks.current = { onPendingCount, onApproved };
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/payments", { cache: "no-store" });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (response.status === 403) {
        window.location.href = "/";
        return;
      }
      if (!response.ok) throw new Error("LOAD");

      const data = (await response.json()) as { payments: Payment[] };
      setPayments(data.payments);
      callbacks.current.onPendingCount?.(
        data.payments.filter((payment) => payment.status === "PENDING").length
      );
    } catch {
      setMessage("تعذر تحميل الوصولات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(payment: Payment, action: "approve" | "reject") {
    let note = "";

    if (action === "approve") {
      const ok = window.confirm(
        `قبول وصل المحل #${payment.shop.shopNumber} (${payment.shop.name}) وتفعيل الاشتراك؟`
      );
      if (!ok) return;
    } else {
      const input = window.prompt("سبب الرفض (اختياري)");
      if (input === null) return;
      note = input.trim();
    }

    setBusy(payment.id);
    setMessage("");

    try {
      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: payment.id, action, note }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setMessage(errorText[data.error ?? ""] ?? "تعذر تنفيذ العملية");
        return;
      }

      setMessage(
        action === "approve" ? "تم قبول الوصل وتفعيل الاشتراك ✓" : "تم رفض الوصل"
      );
      await load();
      if (action === "approve") callbacks.current.onApproved?.();
    } catch {
      setMessage("تعذر تنفيذ العملية");
    } finally {
      setBusy("");
    }
  }

  const visible = onlyPending
    ? payments.filter((payment) => payment.status === "PENDING")
    : payments;
  const pendingCount = payments.filter(
    (payment) => payment.status === "PENDING"
  ).length;

  return (
    <div dir="rtl">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOnlyPending(true)}
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            onlyPending ? "bg-blue-600 text-white" : "bg-white text-slate-600"
          }`}
        >
          قيد المراجعة ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setOnlyPending(false)}
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            !onlyPending ? "bg-blue-600 text-white" : "bg-white text-slate-600"
          }`}
        >
          الكل ({payments.length})
        </button>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600"
        >
          ⟳ تحديث
        </button>
      </div>

      {message && (
        <p className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800">
          {message}
        </p>
      )}

      {loading && payments.length === 0 ? (
        <p className="text-slate-500">جارٍ التحميل...</p>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-sm">
          ما في وصولات {onlyPending ? "قيد المراجعة" : ""}.
        </p>
      ) : (
        <ul className="space-y-4">
          {visible.map((payment) => {
            const receiptUrl = `/api/admin/receipt?id=${payment.id}`;
            const isImage = payment.receiptMime.startsWith("image/");

            return (
              <li key={payment.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">
                      المحل #{payment.shop.shopNumber}
                    </p>
                    <h2 className="text-xl font-extrabold">{payment.shop.name}</h2>
                    <p dir="ltr" className="mt-1 text-start text-sm text-slate-500">
                      {payment.shop.phone ?? "—"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle[payment.status]}`}
                  >
                    {statusLabel[payment.status]}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500">الباقة</p>
                    <p className="font-bold">
                      {payment.plan === "MONTHLY" ? "شهري" : "سنوي"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">المبلغ المتوقع</p>
                    <p className="font-bold text-blue-700">
                      {formatPrice(payment.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">تاريخ الإرسال</p>
                    <p dir="ltr" className="text-start font-bold">
                      {formatDate(payment.createdAt)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  المرجع المتوقع بوصف التحويل:{" "}
                  <span dir="ltr" className="font-mono font-bold text-slate-700">
                    FixTrack #{payment.shop.shopNumber} - {payment.shop.name}
                  </span>
                </p>

                <div className="mt-4">
                  {isImage ? (
                    <a href={receiptUrl} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={receiptUrl}
                        alt="وصل التحويل"
                        className="max-h-80 rounded-xl border border-slate-200 object-contain"
                      />
                    </a>
                  ) : (
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-slate-50"
                    >
                      📄 فتح الوصل (PDF)
                    </a>
                  )}
                </div>

                {!payment.shop.isActive && (
                  <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700">
                    المحل معطّل حالياً.
                  </p>
                )}

                {payment.note && (
                  <p className="mt-3 text-sm text-slate-600">ملاحظة: {payment.note}</p>
                )}

                {payment.status === "PENDING" ? (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      disabled={busy === payment.id}
                      onClick={() => void review(payment, "approve")}
                      className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
                    >
                      ✓ قبول وتفعيل
                    </button>
                    <button
                      type="button"
                      disabled={busy === payment.id}
                      onClick={() => void review(payment, "reject")}
                      className="rounded-xl border border-red-200 bg-red-50 px-5 py-2 text-sm font-bold text-red-700 disabled:opacity-60"
                    >
                      ✕ رفض
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    تمت المراجعة: {formatDate(payment.reviewedAt)}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}