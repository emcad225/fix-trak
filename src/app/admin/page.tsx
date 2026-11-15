"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Lang = "ar" | "tr";
type Status = "PENDING" | "TRIAL" | "SUBSCRIBED" | "EXPIRED" | "DISABLED";
type Filter = "ALL" | Status;

type Shop = {
  id: string;
  name: string;
  phone: string | null;
  createdAt: string;
  status: Status;
  plan: "MONTHLY" | "YEARLY" | null;
  trialEndsAt: string | null;
  subscribedUntil: string | null;
  usersCount: number;
  owner: {
    name: string;
    username: string;
    lastLoginAt: string | null;
  } | null;
};

const translations = {
  ar: {
    title: "لوحة مدير المنصة",
    subtitle: "المحلات المسجّلة وحالة اشتراكاتها",
    logout: "خروج",
    refresh: "تحديث",
    search: "ابحث باسم المحل أو المالك أو الهاتف...",
    total: "كل المحلات",
    filters: {
      ALL: "الكل",
      PENDING: "بانتظار الموافقة",
      TRIAL: "تجربة",
      SUBSCRIBED: "مشترك",
      EXPIRED: "منتهي",
      DISABLED: "معطّل",
    },
    shop: "المحل",
    owner: "المالك",
    phone: "الهاتف",
    status: "الحالة",
    until: "ينتهي في",
    registered: "تاريخ التسجيل",
    lastLogin: "آخر دخول",
    actions: "الإجراءات",
    never: "لم يدخل بعد",
    daysLeft: (n: number) => (n > 0 ? `متبقي ${n} يوم` : "انتهى"),
    plans: { MONTHLY: "شهري", YEARLY: "سنوي" },
    approve: "تفعيل (تجربة 14 يوم)",
    monthly: "اشتراك شهري",
    yearly: "اشتراك سنوي",
    extend: "تمديد 7 أيام",
    disable: "تعطيل",
    enable: "إعادة تفعيل",
    loading: "جارٍ التحميل...",
    empty: "لا توجد محلات مطابقة.",
    errLoad: "تعذر تحميل المحلات",
    errAction: "تعذر تنفيذ العملية",
    errForbidden: "هذه الصفحة لمدير المنصة فقط",
    backHome: "العودة للرئيسية",
    done: "تم تنفيذ العملية",
    confirmDisable: (name: string) =>
      `تعطيل المحل "${name}"؟ لن يتمكن موظفوه من الدخول.`,
    confirmSubscribe: (name: string, plan: string) =>
      `تسجيل اشتراك ${plan} للمحل "${name}"؟ تأكد أنه دفع.`,
    switchLang: "🇹🇷 Türkçe",
  },
  tr: {
    title: "Platform Yönetim Paneli",
    subtitle: "Kayıtlı mağazalar ve abonelik durumları",
    logout: "Çıkış",
    refresh: "Yenile",
    search: "Mağaza, sahip veya telefon ara...",
    total: "Tüm mağazalar",
    filters: {
      ALL: "Tümü",
      PENDING: "Onay bekliyor",
      TRIAL: "Deneme",
      SUBSCRIBED: "Abone",
      EXPIRED: "Süresi doldu",
      DISABLED: "Devre dışı",
    },
    shop: "Mağaza",
    owner: "Sahip",
    phone: "Telefon",
    status: "Durum",
    until: "Bitiş",
    registered: "Kayıt tarihi",
    lastLogin: "Son giriş",
    actions: "İşlemler",
    never: "Henüz girmedi",
    daysLeft: (n: number) => (n > 0 ? `${n} gün kaldı` : "Bitti"),
    plans: { MONTHLY: "Aylık", YEARLY: "Yıllık" },
    approve: "Onayla (7 gün deneme)",
    monthly: "Aylık abonelik",
    yearly: "Yıllık abonelik",
    extend: "7 gün uzat",
    disable: "Devre dışı bırak",
    enable: "Yeniden etkinleştir",
    loading: "Yükleniyor...",
    empty: "Eşleşen mağaza yok.",
    errLoad: "Mağazalar yüklenemedi",
    errAction: "İşlem yapılamadı",
    errForbidden: "Bu sayfa yalnızca platform yöneticisi içindir",
    backHome: "Ana sayfaya dön",
    done: "İşlem tamamlandı",
    confirmDisable: (name: string) =>
      `"${name}" mağazası devre dışı bırakılsın mı? Çalışanları giriş yapamaz.`,
    confirmSubscribe: (name: string, plan: string) =>
      `"${name}" mağazası için ${plan} abonelik kaydedilsin mi? Ödemenin yapıldığından emin olun.`,
    switchLang: "🇸🇦 العربية",
  },
};

const statusStyle: Record<Status, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  TRIAL: "bg-blue-100 text-blue-800",
  SUBSCRIBED: "bg-emerald-100 text-emerald-800",
  EXPIRED: "bg-orange-100 text-orange-800",
  DISABLED: "bg-slate-200 text-slate-700",
};

const filterOrder: Filter[] = [
  "ALL",
  "PENDING",
  "TRIAL",
  "SUBSCRIBED",
  "EXPIRED",
  "DISABLED",
];

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toISOString().slice(0, 10);
}

function daysLeft(value: string | null) {
  if (!value) return 0;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
}

function endDate(shop: Shop) {
  if (shop.status === "SUBSCRIBED") return shop.subscribedUntil;
  if (shop.status === "TRIAL") return shop.trialEndsAt;
  if (shop.status === "EXPIRED") return shop.subscribedUntil ?? shop.trialEndsAt;
  return null;
}

export default function AdminPage() {
  const [language, setLanguage] = useState<Lang>("ar");
  const t = translations[language];
  const dir = language === "ar" ? "rtl" : "ltr";
  const textStart = language === "ar" ? "text-right" : "text-left";

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");

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

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/shops", { cache: "no-store" });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (response.status === 403) {
        setForbidden(true);
        return;
      }
      if (!response.ok) throw new Error("LOAD");

      setShops((await response.json()) as Shop[]);
      setError("");
    } catch {
      setError(translations[language].errLoad);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(
    shop: Shop,
    action: string,
    extra: Record<string, unknown> = {}
  ) {
    if (busyId) return;

    setBusyId(shop.id);
    setNotice("");
    setError("");

    try {
      const response = await fetch("/api/admin/shops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: shop.id, action, ...extra }),
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!response.ok) throw new Error("ACTION");

      const updated = (await response.json()) as Shop;
      setShops((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item))
      );
      setNotice(t.done);
    } catch {
      setError(t.errAction);
    } finally {
      setBusyId(null);
    }
  }

  function subscribe(shop: Shop, plan: "MONTHLY" | "YEARLY") {
    if (!window.confirm(t.confirmSubscribe(shop.name, t.plans[plan]))) return;
    void act(shop, "subscribe", { plan });
  }

  function disable(shop: Shop) {
    if (!window.confirm(t.confirmDisable(shop.name))) return;
    void act(shop, "disable");
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  const counts = useMemo(() => {
    const result: Record<Filter, number> = {
      ALL: shops.length,
      PENDING: 0,
      TRIAL: 0,
      SUBSCRIBED: 0,
      EXPIRED: 0,
      DISABLED: 0,
    };
    for (const shop of shops) result[shop.status] += 1;
    return result;
  }, [shops]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    return shops.filter((shop) => {
      if (filter !== "ALL" && shop.status !== filter) return false;
      if (!query) return true;

      return [shop.name, shop.phone ?? "", shop.owner?.name ?? "", shop.owner?.username ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [shops, filter, search]);

  if (forbidden) {
    return (
      <main
        dir={dir}
        className="flex min-h-screen items-center justify-center bg-slate-100 p-6"
      >
        <div className="rounded-2xl bg-white p-8 text-center shadow">
          <p className="font-bold text-red-600">{t.errForbidden}</p>
          <a
            href="/"
            className="mt-5 inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
          >
            {t.backHome}
          </a>
        </div>
      </main>
    );
  }

  const btn =
    "rounded-lg border px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main dir={dir} className="min-h-screen bg-[#f4f7fb] text-slate-800">
      <header className="sticky top-0 z-10 flex min-h-20 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
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

      <div className="mx-auto max-w-7xl p-4 sm:p-8">
        <p className="mb-5 text-sm text-slate-500">{t.subtitle}</p>

        {notice && (
          <div
            role="status"
            className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <span>{notice}</span>
            <button onClick={() => setNotice("")} aria-label="close">
              ✕
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700"
          >
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="close">
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {(["ALL", "SUBSCRIBED", "TRIAL", "PENDING", "EXPIRED"] as Filter[]).map(
            (key) => (
              <div
                key={key}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
              >
                <p className="text-sm text-slate-500">
                  {key === "ALL" ? t.total : t.filters[key]}
                </p>
                <p className="mt-2 text-3xl font-extrabold">
                  {loading ? "…" : counts[key]}
                </p>
              </div>
            )
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {filterOrder.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-full px-3 py-2 text-xs font-bold ${
                    filter === key
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t.filters[key]} ({counts[key]})
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t.search}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-500 lg:w-72"
              />
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-100"
              >
                ⟳ {t.refresh}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className={`w-full min-w-[980px] text-sm ${textStart}`}>
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t.shop}</th>
                  <th className="px-4 py-3 font-semibold">{t.owner}</th>
                  <th className="px-4 py-3 font-semibold">{t.status}</th>
                  <th className="px-4 py-3 font-semibold">{t.until}</th>
                  <th className="px-4 py-3 font-semibold">{t.registered}</th>
                  <th className="px-4 py-3 font-semibold">{t.actions}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400">
                      {t.loading}
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400">
                      {t.empty}
                    </td>
                  </tr>
                ) : (
                  visible.map((shop) => {
                    const end = endDate(shop);
                    const busy = busyId === shop.id;

                    return (
                      <tr key={shop.id} className="align-top hover:bg-slate-50">
                        <td className="px-4 py-4">
                          <p className="font-bold">{shop.name}</p>
                          <p dir="ltr" className={`mt-1 text-xs text-slate-400 ${textStart}`}>
                            {shop.phone ?? "—"}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          {shop.owner ? (
                            <>
                              <p className="font-semibold">{shop.owner.name}</p>
                              <p dir="ltr" className={`mt-1 text-xs text-slate-400 ${textStart}`}>
                                @{shop.owner.username}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {t.lastLogin}:{" "}
                                {shop.owner.lastLoginAt
                                  ? formatDate(shop.owner.lastLoginAt)
                                  : t.never}
                              </p>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusStyle[shop.status]}`}
                          >
                            {t.filters[shop.status]}
                          </span>
                          {shop.plan && shop.status === "SUBSCRIBED" && (
                            <p className="mt-1 text-xs text-slate-500">
                              {t.plans[shop.plan]}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <p dir="ltr" className={textStart}>
                            {formatDate(end)}
                          </p>
                          {end && (
                            <p className="mt-1 text-xs text-slate-400">
                              {t.daysLeft(daysLeft(end))}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4 text-slate-500">
                          <span dir="ltr">{formatDate(shop.createdAt)}</span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {shop.status === "PENDING" && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void act(shop, "approve")}
                                className={`${btn} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
                              >
                                ✓ {t.approve}
                              </button>
                            )}

                            {(shop.status === "TRIAL" ||
                              shop.status === "SUBSCRIBED" ||
                              shop.status === "EXPIRED") && (
                              <>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => subscribe(shop, "MONTHLY")}
                                  className={`${btn} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}
                                >
                                  {t.monthly}
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => subscribe(shop, "YEARLY")}
                                  className={`${btn} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}
                                >
                                  {t.yearly}
                                </button>
                              </>
                            )}

                            {(shop.status === "TRIAL" || shop.status === "EXPIRED") && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void act(shop, "extend_trial", { days: 7 })
                                }
                                className={`${btn} border-slate-200 bg-white text-slate-700 hover:bg-slate-100`}
                              >
                                {t.extend}
                              </button>
                            )}

                            {shop.status === "DISABLED" ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void act(shop, "enable")}
                                className={`${btn} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
                              >
                                {t.enable}
                              </button>
                            ) : (
                              shop.status !== "PENDING" && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => disable(shop)}
                                  className={`${btn} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}
                                >
                                  {t.disable}
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}