
"use client";

import { Fragment, FormEvent, useCallback, useEffect, useState } from "react";
type Lang = "ar" | "tr";
type Method = "CASH" | "CARD" | "TRANSFER" | "OTHER";
type PayType = "PAYMENT" | "DEPOSIT" | "REFUND";

type Row = {
  id: string;
  customer: string;
  device: string;
  date: string;
  price: number;
  paid: number;
  remaining: number;
};

type Data = {
  totals: { price: number; paid: number; remaining: number; monthPaid: number };
  rows: Row[];
};

const labels = {
  ar: {
    title: "الحسابات",
    desc: "أسعار الطلبات، وما دفعه الزبائن، وما بقي عليهم.",
    totalPrice: "إجمالي الأسعار",
    paid: "المحصّل",
    remaining: "المتبقي عند الزبائن",
    month: "محصّل هذا الشهر",
    order: "الطلب",
    customer: "الزبون",
    device: "الجهاز",
    price: "السعر",
    paidCol: "المدفوع",
    remainingCol: "المتبقي",
    actions: "الإجراء",
    add: "تسجيل دفعة",
    amount: "المبلغ (₺)",
    method: "طريقة الدفع",
    type: "النوع",
    methods: { CASH: "نقداً", CARD: "بطاقة", TRANSFER: "تحويل", OTHER: "أخرى" },
    types: { PAYMENT: "دفعة", DEPOSIT: "عربون", REFUND: "استرجاع" },
    save: "حفظ",
    saving: "جارٍ الحفظ...",
    cancel: "إلغاء",
    loading: "جارٍ التحميل...",
    empty: "لا توجد طلبات بعد.",
    errLoad: "تعذر تحميل الحسابات",
    errInvalid: "تحقق من المبلغ",
    errOver: "المبلغ أكبر من المتبقي على هذا الطلب",
    errRefund: "مبلغ الاسترجاع أكبر من المدفوع",
    errForbidden: "الاسترجاع لمالك المحل فقط",
    errGeneric: "تعذر حفظ الدفعة",
    ok: "تم تسجيل الدفعة",
  },
  tr: {
    title: "Hesaplar",
    desc: "Talep fiyatları, müşteri ödemeleri ve kalan tutarlar.",
    totalPrice: "Toplam fiyatlar",
    paid: "Tahsil edilen",
    remaining: "Müşterilerde kalan",
    month: "Bu ay tahsilat",
    order: "Talep",
    customer: "Müşteri",
    device: "Cihaz",
    price: "Fiyat",
    paidCol: "Ödenen",
    remainingCol: "Kalan",
    actions: "İşlem",
    add: "Ödeme kaydet",
    amount: "Tutar (₺)",
    method: "Ödeme yöntemi",
    type: "Tür",
    methods: { CASH: "Nakit", CARD: "Kart", TRANSFER: "Havale", OTHER: "Diğer" },
    types: { PAYMENT: "Ödeme", DEPOSIT: "Kapora", REFUND: "İade" },
    save: "Kaydet",
    saving: "Kaydediliyor...",
    cancel: "İptal",
    loading: "Yükleniyor...",
    empty: "Henüz talep yok.",
    errLoad: "Hesaplar yüklenemedi",
    errInvalid: "Tutarı kontrol edin",
    errOver: "Tutar bu talepte kalan tutardan büyük",
    errRefund: "İade tutarı ödenenden büyük",
    errForbidden: "İade yalnızca mağaza sahibi içindir",
    errGeneric: "Ödeme kaydedilemedi",
    ok: "Ödeme kaydedildi",
  },
};

function money(value: number) {
  return `${value.toLocaleString("tr-TR")} ₺`;
}

export default function AccountsPanel({ language }: { language: Lang }) {
  const t = labels[language];

  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [payingId, setPayingId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("CASH");
  const [type, setType] = useState<PayType>("PAYMENT");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/accounts", { cache: "no-store" });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (response.status === 402) {
        window.location.href = "/billing";
        return;
      }
      if (!response.ok) throw new Error("LOAD");

      setData((await response.json()) as Data);
      setError("");
    } catch {
      setError(labels[language].errLoad);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function open(row: Row) {
    setPayingId(row.id);
    setAmount(row.remaining > 0 ? String(row.remaining) : "");
    setMethod("CASH");
    setType("PAYMENT");
    setError("");
    setNotice("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!payingId || busy) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payingId,
          amount: Number(amount),
          method,
          type,
        }),
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (response.status === 402) {
        window.location.href = "/billing";
        return;
      }

      if (response.ok) {
        setPayingId(null);
        setNotice(t.ok);
        await load();
        return;
      }

      const body = (await response.json().catch(() => ({}))) as { error?: string };

      if (body.error === "OVERPAY") setError(t.errOver);
      else if (body.error === "OVER_REFUND") setError(t.errRefund);
      else if (body.error === "FORBIDDEN") setError(t.errForbidden);
      else if (response.status === 400) setError(t.errInvalid);
      else setError(t.errGeneric);
    } catch {
      setError(t.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  const cards = data
    ? [
        { label: t.totalPrice, value: data.totals.price },
        { label: t.paid, value: data.totals.paid },
        { label: t.remaining, value: data.totals.remaining },
        { label: t.month, value: data.totals.monthPaid },
      ]
    : [];

  return (
    <div>
      {notice && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-extrabold">{money(card.value)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h3 className="text-lg font-extrabold">{t.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{t.desc}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-start text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">{t.order}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.customer}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.device}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.price}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.paidCol}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.remainingCol}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.actions}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    {t.loading}
                  </td>
                </tr>
              ) : !data || data.rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    {t.empty}
                  </td>
                </tr>
              ) : (
                  data.rows.map((row) => (
                  <Fragment key={row.id}>
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 font-bold text-blue-700">{row.id}</td>
                      <td className="px-4 py-4 font-semibold">{row.customer}</td>
                      <td className="px-4 py-4 text-slate-500">{row.device}</td>
                      <td className="px-4 py-4">{money(row.price)}</td>
                      <td className="px-4 py-4 text-emerald-700">{money(row.paid)}</td>
                      <td
                        className={`px-4 py-4 font-bold ${
                          row.remaining > 0 ? "text-orange-600" : "text-slate-400"
                        }`}
                      >
                        {money(row.remaining)}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => open(row)}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                        >
                          {t.add}
                        </button>
                      </td>
                    </tr>

                    {payingId === row.id && (
                      <tr key={`${row.id}-form`} className="bg-slate-50">
                        <td colSpan={7} className="px-4 py-4">
                          <form
                            onSubmit={submit}
                            className="flex flex-wrap items-end gap-3"
                          >
                            <label className="flex flex-col gap-1 text-xs font-semibold">
                              {t.amount}
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500"
                              />
                            </label>

                            <label className="flex flex-col gap-1 text-xs font-semibold">
                              {t.method}
                              <select
                                value={method}
                                onChange={(e) => setMethod(e.target.value as Method)}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal"
                              >
                                {(Object.keys(t.methods) as Method[]).map((key) => (
                                  <option key={key} value={key}>
                                    {t.methods[key]}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="flex flex-col gap-1 text-xs font-semibold">
                              {t.type}
                              <select
                                value={type}
                                onChange={(e) => setType(e.target.value as PayType)}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal"
                              >
                                {(Object.keys(t.types) as PayType[]).map((key) => (
                                  <option key={key} value={key}>
                                    {t.types[key]}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <button
                              type="submit"
                              disabled={busy}
                              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                            >
                              {busy ? t.saving : t.save}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPayingId(null)}
                              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"
                            >
                              {t.cancel}
                            </button>
                          </form>
                        </td>
                      </tr>
                    )}
                 </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}