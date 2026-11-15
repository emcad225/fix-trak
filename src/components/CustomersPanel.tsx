"use client";

import { useEffect, useMemo, useState } from "react";

type Lang = "ar" | "tr";

type Customer = {
  name: string;
  phone: string;
  repairs: number;
  lastDate: string | null;
  total: number;
};

const labels = {
  ar: {
    title: "الزبائن",
    desc: "كل زبائن محلك، وعدد طلباتهم وإجمالي أسعارها التقديرية.",
    search: "ابحث بالاسم أو الهاتف...",
    name: "الزبون",
    phone: "الهاتف",
    repairs: "عدد الطلبات",
    last: "آخر زيارة",
    total: "إجمالي الأسعار (₺)",
    loading: "جارٍ التحميل...",
    empty: "لا يوجد زبائن مطابقون.",
    error: "تعذر تحميل الزبائن",
    count: "عدد الزبائن",
  },
  tr: {
    title: "Müşteriler",
    desc: "Mağazanızın tüm müşterileri, talep sayıları ve tahmini fiyat toplamları.",
    search: "İsim veya telefon ara...",
    name: "Müşteri",
    phone: "Telefon",
    repairs: "Talep sayısı",
    last: "Son ziyaret",
    total: "Fiyat toplamı (₺)",
    loading: "Yükleniyor...",
    empty: "Eşleşen müşteri yok.",
    error: "Müşteriler yüklenemedi",
    count: "Müşteri sayısı",
  },
};

export default function CustomersPanel({ language }: { language: Lang }) {
  const t = labels[language];

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/customers", { cache: "no-store" });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (response.status === 402) {
          window.location.href = "/billing";
          return;
        }
        if (!response.ok) throw new Error("LOAD");

        setCustomers((await response.json()) as Customer[]);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) =>
      `${customer.name} ${customer.phone}`.toLowerCase().includes(query)
    );
  }, [customers, search]);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-extrabold">{t.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{t.desc}</p>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t.search}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 sm:max-w-xs"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-start text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-5 py-4 text-start font-semibold">{t.name}</th>
              <th className="px-5 py-4 text-start font-semibold">{t.phone}</th>
              <th className="px-5 py-4 text-start font-semibold">{t.repairs}</th>
              <th className="px-5 py-4 text-start font-semibold">{t.last}</th>
              <th className="px-5 py-4 text-start font-semibold">{t.total}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-400">
                  {t.loading}
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="p-10 text-center font-bold text-red-600">
                  {t.error}
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-400">
                  {t.empty}
                </td>
              </tr>
            ) : (
              visible.map((customer) => (
                <tr key={customer.phone + customer.name} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-semibold">{customer.name}</td>
                  <td className="px-5 py-4 text-slate-500">
                    <span dir="ltr">{customer.phone}</span>
                  </td>
                  <td className="px-5 py-4">{customer.repairs}</td>
                  <td className="px-5 py-4 text-slate-500">
                    <span dir="ltr">{customer.lastDate ?? "—"}</span>
                  </td>
                  <td className="px-5 py-4 font-bold">
                    {customer.total.toLocaleString("tr-TR")} ₺
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-400">
        {t.count}: {visible.length}
      </div>
    </div>
  );
}