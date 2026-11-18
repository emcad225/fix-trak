"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Lang = "ar" | "tr";

type Employee = {
  id: string;
  name: string;
  username: string;
  isActive: boolean;
  lastLoginAt: string | null;
};

type Settings = {
  isOwner: boolean;
  shop: { number: number; name: string; phone: string | null };
  employees: Employee[];
};

const labels = {
  ar: {
    title: "الإعدادات",
    shopTitle: "بيانات المحل",
    shopNumber: "رقم المحل",
    shopName: "اسم المحل",
    phone: "رقم الهاتف",
    saveShop: "حفظ البيانات",
    saving: "جارٍ الحفظ...",
    ownerOnlyShop: "تعديل بيانات المحل لمالك المحل فقط.",
    staffTitle: "الموظفون",
    staffDesc: "أضف موظفين لمحلك بدون حد أقصى. لإعادة تعيين كلمة سر موظف تواصل مع الإدارة.",
    addTitle: "إضافة موظف",
    empName: "اسم الموظف",
    empUser: "اسم المستخدم (إنجليزي صغير)",
    empPass: "كلمة السر الأولية (10 أحرف على الأقل)",
    show: "إظهار كلمة السر",
    add: "إضافة الموظف",
    colName: "الموظف",
    colUser: "اسم المستخدم",
    colStatus: "الحالة",
    colLast: "آخر دخول",
    colAction: "الإجراء",
    active: "فعّال",
    disabled: "معطّل",
    disable: "تعطيل",
    enable: "تفعيل",
    never: "لم يدخل بعد",
    noStaff: "لا يوجد موظفون بعد.",
    loading: "جارٍ التحميل...",
    errLoad: "تعذر تحميل الإعدادات",
    errInvalid: "تحقق من البيانات المدخلة",
    errTaken: "اسم المستخدم مستخدم مسبقاً",
    errGeneric: "تعذر تنفيذ العملية",
    okShop: "تم حفظ بيانات المحل",
    okAdd: "تمت إضافة الموظف",
    okToggle: "تم تحديث حالة الموظف",
    confirmDisable: (name: string) => `تعطيل الموظف "${name}"؟ لن يتمكن من الدخول.`,
  },
  tr: {
    title: "Ayarlar",
    shopTitle: "Mağaza bilgileri",
    shopNumber: "Mağaza no",
    shopName: "Mağaza adı",
    phone: "Telefon numarası",
    saveShop: "Bilgileri kaydet",
    saving: "Kaydediliyor...",
    ownerOnlyShop: "Mağaza bilgilerini yalnızca mağaza sahibi düzenleyebilir.",
    staffTitle: "Çalışanlar",
    staffDesc:
      "Mağazanıza sınırsız çalışan ekleyin. Çalışan şifresini sıfırlamak için yönetimle iletişime geçin.",
    addTitle: "Çalışan ekle",
    empName: "Çalışan adı",
    empUser: "Kullanıcı adı (küçük İngilizce harf)",
    empPass: "İlk şifre (en az 10 karakter)",
    show: "Şifreyi göster",
    add: "Çalışanı ekle",
    colName: "Çalışan",
    colUser: "Kullanıcı adı",
    colStatus: "Durum",
    colLast: "Son giriş",
    colAction: "İşlem",
    active: "Aktif",
    disabled: "Devre dışı",
    disable: "Devre dışı bırak",
    enable: "Etkinleştir",
    never: "Henüz girmedi",
    noStaff: "Henüz çalışan yok.",
    loading: "Yükleniyor...",
    errLoad: "Ayarlar yüklenemedi",
    errInvalid: "Girilen bilgileri kontrol edin",
    errTaken: "Bu kullanıcı adı zaten kullanılıyor",
    errGeneric: "İşlem yapılamadı",
    okShop: "Mağaza bilgileri kaydedildi",
    okAdd: "Çalışan eklendi",
    okToggle: "Çalışan durumu güncellendi",
    confirmDisable: (name: string) =>
      `"${name}" çalışanı devre dışı bırakılsın mı? Giriş yapamaz.`,
  },
};

const inputClass =
  "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600";

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

export default function SettingsPanel({ language }: { language: Lang }) {
  const t = labels[language];

  const [data, setData] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [shopName, setShopName] = useState("");
  const [shopPhone, setShopPhone] = useState("");

  const [empName, setEmpName] = useState("");
  const [empUser, setEmpUser] = useState("");
  const [empPass, setEmpPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/settings", { cache: "no-store" });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (response.status === 402) {
        window.location.href = "/billing";
        return;
      }
      if (!response.ok) throw new Error("LOAD");

      const result = (await response.json()) as Settings;
      setData(result);
      setShopName(result.shop.name);
      setShopPhone(result.shop.phone ?? "");
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

  function fail(status: number, code?: string) {
    if (code === "USERNAME_TAKEN") setError(t.errTaken);
    else if (status === 400) setError(t.errInvalid);
    else setError(t.errGeneric);
  }

  async function send(method: "POST" | "PATCH", body: unknown) {
    const response = await fetch("/api/settings", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.status === 401) {
      window.location.href = "/login";
      return null;
    }
    if (response.status === 402) {
      window.location.href = "/billing";
      return null;
    }

    return response;
  }

  async function saveShop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await send("PATCH", {
        action: "shop",
        name: shopName,
        phone: shopPhone,
      });

      if (!response) return;

      if (response.ok) {
        setNotice(t.okShop);
        await load();
      } else {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        fail(response.status, body.error);
      }
    } catch {
      setError(t.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function addEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await send("POST", {
        name: empName,
        username: empUser.trim().toLowerCase(),
        password: empPass,
      });

      if (!response) return;

      if (response.ok) {
        setNotice(t.okAdd);
        setEmpName("");
        setEmpUser("");
        setEmpPass("");
        await load();
      } else {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        fail(response.status, body.error);
      }
    } catch {
      setError(t.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(employee: Employee) {
    if (busy) return;

    if (employee.isActive && !window.confirm(t.confirmDisable(employee.name))) {
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await send("PATCH", {
        action: "employee",
        id: employee.id,
        isActive: !employee.isActive,
      });

      if (!response) return;

      if (response.ok) {
        setNotice(t.okToggle);
        await load();
      } else {
        setError(t.errGeneric);
      }
    } catch {
      setError(t.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-slate-500">{t.loading}</p>;

  if (!data) {
    return <p className="font-bold text-red-600">{error || t.errLoad}</p>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-extrabold">{t.title}</h3>

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={saveShop}
        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
      >
        <h4 className="mb-4 font-extrabold">{t.shopTitle}</h4>

        <p className="mb-4 text-sm text-slate-500">
          {t.shopNumber}:{" "}
          <span className="font-bold text-slate-800">#{data.shop.number}</span>
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-semibold">
            {t.shopName}
            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              disabled={!data.isOwner}
              required
              maxLength={80}
              className={`${inputClass} font-normal disabled:bg-slate-50`}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold">
            {t.phone}
            <input
              dir="ltr"
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
              disabled={!data.isOwner}
              required
              className={`${inputClass} font-normal disabled:bg-slate-50`}
            />
          </label>
        </div>

        {data.isOwner ? (
          <button
            type="submit"
            disabled={busy}
            className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? t.saving : t.saveShop}
          </button>
        ) : (
          <p className="mt-4 text-xs text-slate-400">{t.ownerOnlyShop}</p>
        )}
      </form>

      {data.isOwner && (
        <>
          <form
            onSubmit={addEmployee}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
          >
            <h4 className="font-extrabold">{t.staffTitle}</h4>
            <p className="mb-4 mt-1 text-sm text-slate-500">{t.staffDesc}</p>

            <h5 className="mb-3 text-sm font-bold">{t.addTitle}</h5>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs font-semibold">
                {t.empName}
                <input
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  required
                  maxLength={80}
                  className={`${inputClass} font-normal`}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold">
                {t.empUser}
                <input
                  dir="ltr"
                  autoCapitalize="none"
                  value={empUser}
                  onChange={(e) => setEmpUser(e.target.value)}
                  required
                  className={`${inputClass} font-normal`}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold">
                {t.empPass}
                <input
                  dir="ltr"
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  value={empPass}
                  onChange={(e) => setEmpPass(e.target.value)}
                  required
                  className={`${inputClass} font-normal`}
                />
              </label>
            </div>

            <label className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={showPass}
                onChange={(e) => setShowPass(e.target.checked)}
              />
              {t.show}
            </label>

            <button
              type="submit"
              disabled={busy}
              className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? t.saving : t.add}
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-start text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-start font-semibold">{t.colName}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t.colUser}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t.colStatus}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t.colLast}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t.colAction}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {data.employees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        {t.noStaff}
                      </td>
                    </tr>
                  ) : (
                    data.employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-slate-50">
                        <td className="px-4 py-4 font-semibold">{employee.name}</td>
                        <td className="px-4 py-4 text-slate-500">
                          <span dir="ltr">@{employee.username}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                              employee.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {employee.isActive ? t.active : t.disabled}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          <span dir="ltr">
                            {formatDate(employee.lastLoginAt) ?? t.never}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void toggle(employee)}
                            className={`rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50 ${
                              employee.isActive
                                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {employee.isActive ? t.disable : t.enable}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}