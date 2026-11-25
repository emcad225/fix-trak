"use client";

import { useEffect, useState, type FormEvent } from "react";

import CustomersPanel from "../components/CustomersPanel";
import AccountsPanel from "../components/AccountsPanel";
import ReportsPanel from "../components/ReportsPanel";
import SettingsPanel from "../components/SettingsPanel";
type Repair = {
  id: string;
  trackingToken: string;
  customer: string;
  phone: string;
  device: string;
  issue: string;
  status: string;
  date: string;
  price: number;
};

type Lang = "ar" | "tr";
type NavId =
  | "dashboard"
  | "repairs"
  | "customers"
  | "accounts"
  | "reports"
  | "settings";

// قيم الحالات تبقى بالعربية لأنها مخزنة هكذا في قاعدة البيانات
const statuses = [
  "تم استلام الجهاز",
  "قيد الفحص",
  "بانتظار موافقة الزبون",
  "بانتظار قطعة الغيار",
  "قيد الإصلاح",
  "قيد الاختبار",
  "جاهز للاستلام",
  "تم التسليم",
  "ملغي",
];

const statusLabelsTr: Record<string, string> = {
  "تم استلام الجهاز": "Cihaz teslim alındı",
  "قيد الفحص": "İnceleniyor",
  "بانتظار موافقة الزبون": "Müşteri onayı bekleniyor",
  "بانتظار قطعة الغيار": "Yedek parça bekleniyor",
  "قيد الإصلاح": "Tamir ediliyor",
  "قيد الاختبار": "Test ediliyor",
  "جاهز للاستلام": "Teslime hazır",
  "تم التسليم": "Teslim edildi",
  "ملغي": "İptal edildi",
};

const navItems: [string, NavId][] = [
  ["▦", "dashboard"],
  ["▣", "repairs"],
  ["♙", "customers"],
  ["₺", "accounts"],
  ["▥", "reports"],
  ["⚙", "settings"],
];

const translations = {
  ar: {
    dashboard: "لوحة التحكم",
    repairs: "طلبات الصيانة",
    customers: "الزبائن",
    accounts: "الحسابات",
    reports: "التقارير",
    settings: "الإعدادات",
    shopTitle: "إدارة صيانة الهواتف",
    mainMenu: "القائمة الرئيسية",
    shopSystem: "نظام إدارة المحل",
    welcome: "مرحبًا بك 👋",
    welcomeTitle: "أهلًا بك في FixTrack",
    welcomeText: "تابع عمليات الصيانة وأدر طلبات الزبائن من مكان واحد.",
    addRepair: "إضافة طلب صيانة",
    totalRepairs: "إجمالي الطلبات",
    inRepair: "قيد الصيانة",
    waitingParts: "بانتظار القطع",
    ready: "جاهزة للاستلام",
    basedOnOrders: "حسب الطلبات المسجلة",
    tableDesc: "ابحث عن الطلب وعدّل بياناته أو حالته أو احذفه.",
    search: "ابحث برقم الطلب أو الاسم...",
    orderNumber: "رقم الطلب",
    customer: "الزبون",
    deviceIssue: "الجهاز والعطل",
    receivedDate: "تاريخ الاستلام",
    status: "الحالة",
    price: "السعر (₺)",
    actions: "الإجراءات",
    edit: "تعديل",
    delete: "حذف",
    deleting: "جارٍ الحذف...",
    cancel: "إلغاء",
    save: "حفظ التعديلات",
    create: "إنشاء الطلب",
    saving: "جارٍ الحفظ...",
    customerName: "اسم الزبون",
    fullNamePlaceholder: "الاسم الكامل",
    phone: "رقم الهاتف",
    device: "نوع الجهاز والموديل",
    issue: "العطل",
    issuePlaceholder: "وصف العطل",
    estimatedPrice: "السعر التقديري بالليرة",
    loading: "جارٍ تحميل الطلبات...",
    noResults: "لا توجد طلبات مطابقة للبحث.",
    resultsCount: "عدد النتائج",
    comingSoon: "هذه الصفحة سنبنيها في المرحلة التالية.",
    backToDashboard: "العودة للوحة التحكم",
    centerTitle: "مركز الصيانة",
    centerText: "إدارة طلبات الصيانة ومتابعتها.",
    printReceipt: "طباعة وصل الاستلام",
    qrTitle: "QR خاص لكل جهاز",
    qrDesc: "اضغط لاختيار طلب وطباعة وصل حراري يتضمن رمز QR لتتبع حالة الجهاز.",
    pickAndPrint: "اختيار الطلب وطباعة الوصل ←",
    readyForPickup: "جاهز للاستلام",
    devicesUnit: "أجهزة",
    updateHint: "يمكنك تحديث حالة أي طلب من الجدول أعلاه.",
    pickerTitle: "اختيار طلب لطباعة الوصل",
    pickerDesc: "اختر الجهاز المطلوب، وسيفتح وصل الاستلام مع QR الخاص به.",
    noRepairsForReceipt: "لا توجد طلبات صيانة لطباعة وصل لها.",
    openReceipt: "فتح الوصل",
    close: "إغلاق",
    newRepairTitle: "إضافة طلب صيانة جديد",
    editRepairTitle: "تعديل طلب الصيانة",
    saveEditHint: "سيتم حفظ التعديلات في قاعدة البيانات.",
    saveNewHint: "سيتم حفظ الطلب الجديد في قاعدة البيانات.",
    footer: "FixTrack © 2026 — نظام إدارة صيانة الهواتف",
    userInitial: "م",
    switchLang: "🇹🇷 Türkçe",
    errLoad: "تعذر تحميل طلبات الصيانة",
    errFill: "يرجى تعبئة جميع الحقول المطلوبة",
    errPrice: "السعر غير صالح",
    errCreate: "تعذر إنشاء الطلب",
    errEdit: "تعذر تعديل الطلب",
    errStatus: "تعذر تحديث حالة الطلب",
    errDelete: "تعذر حذف الطلب",
    errGeneric: "حدث خطأ غير متوقع",
    errNoToken: "هذا الطلب لا يحتوي على رمز تتبّع. حدّث بيانات الـ API أولاً.",
    okCreated: (id: string) => `تم إنشاء الطلب ${id} بنجاح`,
    okEdited: (id: string) => `تم تعديل الطلب ${id} بنجاح`,
    okStatus: (id: string) => `تم تحديث حالة الطلب ${id} بنجاح`,
    okDeleted: (id: string) => `تم حذف الطلب ${id} بنجاح`,
    confirmDelete: (id: string, name: string) =>
      `هل أنت متأكد من حذف الطلب ${id} للزبون ${name}؟\n\nلا يمكن التراجع عن الحذف.`,
  },
  tr: {
    dashboard: "Kontrol Paneli",
    repairs: "Tamir Talepleri",
    customers: "Müşteriler",
    accounts: "Hesaplar",
    reports: "Raporlar",
    settings: "Ayarlar",
    shopTitle: "Telefon Tamir Yönetimi",
    mainMenu: "Ana Menü",
    shopSystem: "Mağaza Yönetim Sistemi",
    welcome: "Hoş geldiniz 👋",
    welcomeTitle: "FixTrack'e Hoş Geldiniz",
    welcomeText: "Tamir işlemlerini ve müşteri taleplerini tek yerden yönetin.",
    addRepair: "Tamir Talebi Ekle",
    totalRepairs: "Toplam Talepler",
    inRepair: "Tamir Ediliyor",
    waitingParts: "Parça Bekliyor",
    ready: "Teslime Hazır",
    basedOnOrders: "Kayıtlı taleplere göre",
    tableDesc: "Talebi arayın, bilgilerini veya durumunu düzenleyin ya da silin.",
    search: "Talep numarası veya isim ara...",
    orderNumber: "Talep No",
    customer: "Müşteri",
    deviceIssue: "Cihaz ve Arıza",
    receivedDate: "Teslim Alma Tarihi",
    status: "Durum",
    price: "Fiyat (₺)",
    actions: "İşlemler",
    edit: "Düzenle",
    delete: "Sil",
    deleting: "Siliniyor...",
    cancel: "İptal",
    save: "Değişiklikleri Kaydet",
    create: "Talep Oluştur",
    saving: "Kaydediliyor...",
    customerName: "Müşteri Adı",
    fullNamePlaceholder: "Ad Soyad",
    phone: "Telefon Numarası",
    device: "Cihaz ve Model",
    issue: "Arıza",
    issuePlaceholder: "Arıza açıklaması",
    estimatedPrice: "Tahmini fiyat (₺)",
    loading: "Talepler yükleniyor...",
    noResults: "Aramayla eşleşen talep yok.",
    resultsCount: "Sonuç sayısı",
    comingSoon: "Bu sayfayı bir sonraki aşamada yapacağız.",
    backToDashboard: "Kontrol paneline dön",
    centerTitle: "Tamir Merkezi",
    centerText: "Tamir taleplerini yönetin ve takip edin.",
    printReceipt: "Teslim fişi yazdır",
    qrTitle: "Her cihaz için özel QR",
    qrDesc:
      "Bir talep seçip cihaz durumunu takip etmek için QR kodlu termal fiş yazdırın.",
    pickAndPrint: "Talep seç ve fişi yazdır →",
    readyForPickup: "Teslime hazır",
    devicesUnit: "cihaz",
    updateHint: "Yukarıdaki tablodan herhangi bir talebin durumunu güncelleyebilirsiniz.",
    pickerTitle: "Fiş için talep seçin",
    pickerDesc: "Cihazı seçin, QR kodlu teslim fişi açılacaktır.",
    noRepairsForReceipt: "Fiş yazdırılacak tamir talebi yok.",
    openReceipt: "Fişi aç",
    close: "Kapat",
    newRepairTitle: "Yeni Tamir Talebi Ekle",
    editRepairTitle: "Tamir Talebini Düzenle",
    saveEditHint: "Değişiklikler veritabanına kaydedilecek.",
    saveNewHint: "Yeni talep veritabanına kaydedilecek.",
    footer: "FixTrack © 2026 — Telefon Tamir Yönetim Sistemi",
    userInitial: "M",
    switchLang: "🇸🇦 العربية",
    errLoad: "Tamir talepleri yüklenemedi",
    errFill: "Lütfen tüm zorunlu alanları doldurun",
    errPrice: "Geçersiz fiyat",
    errCreate: "Talep oluşturulamadı",
    errEdit: "Talep düzenlenemedi",
    errStatus: "Talep durumu güncellenemedi",
    errDelete: "Talep silinemedi",
    errGeneric: "Beklenmeyen bir hata oluştu",
    errNoToken: "Bu talepte takip kodu yok. Önce API verilerini güncelleyin.",
    okCreated: (id: string) => `${id} numaralı talep oluşturuldu`,
    okEdited: (id: string) => `${id} numaralı talep düzenlendi`,
    okStatus: (id: string) => `${id} numaralı talebin durumu güncellendi`,
    okDeleted: (id: string) => `${id} numaralı talep silindi`,
    confirmDelete: (id: string, name: string) =>
      `${name} müşterisine ait ${id} numaralı talebi silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz.`,
  },
};

const emptyForm = {
  customer: "",
  phone: "",
  device: "",
  issue: "",
  price: "0",
};

export default function Home() {
  const [language, setLanguage] = useState<Lang>("ar");
  const t = translations[language];
  const isAr = language === "ar";

  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [activeNav, setActiveNav] = useState<NavId>("dashboard");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showReceiptPicker, setShowReceiptPicker] = useState(false);
      const [userName, setUserName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as {
          name?: string;
          username?: string;
          role?: string;
        };
        setUserName(data.name || data.username || "");
        setRole(data.role || "");
      } catch {
        // تجاهل أخطاء الشبكة
      }
    }

    void loadUser();
  }, []);

  // الحسابات لمالك المحل فقط.
  const visibleNav = navItems.filter(
    ([, id]) => id !== "accounts" || role === "OWNER"
  );

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { name?: string; username?: string };
        setUserName(data.name || data.username || "");
      } catch {
        // تجاهل أخطاء الشبكة
      }
    }

    void loadUser();
  }, []);

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

  const statusLabel = (status: string) =>
    isAr ? status : statusLabelsTr[status] ?? status;

  async function loadRepairs() {
    try {
      const response = await fetch("/api/repairs");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || translations[language].errLoad);
      }

      setRepairs(data as Repair[]);
    } catch (error) {
      console.error(error);
      setNotice(error instanceof Error ? error.message : t.errLoad);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRepairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = repairs.filter((repair) =>
    [
      repair.id,
      repair.customer,
      repair.phone,
      repair.device,
      repair.issue,
      repair.status,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const count = (status: string) =>
    repairs.filter((repair) => repair.status === status).length;

  function openNewForm() {
    setEditingRepair(null);
    setForm(emptyForm);
    setNotice("");
    setShowForm(true);
  }

  function openEditForm(repair: Repair) {
    setEditingRepair(repair);
    setForm({
      customer: repair.customer,
      phone: repair.phone,
      device: repair.device,
      issue: repair.issue,
      price: String(repair.price),
    });
    setNotice("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditingRepair(null);
    setForm(emptyForm);
  }

  async function saveRepair(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setNotice("");

    const payload = {
      customer: form.customer.trim(),
      phone: form.phone.trim(),
      device: form.device.trim(),
      issue: form.issue.trim(),
      price: form.price === "" ? 0 : Number(form.price),
    };

    if (
      !payload.customer ||
      !payload.phone ||
      !payload.device ||
      !payload.issue
    ) {
      setNotice(t.errFill);
      setSaving(false);
      return;
    }

    if (!Number.isFinite(payload.price) || payload.price < 0) {
      setNotice(t.errPrice);
      setSaving(false);
      return;
    }

    try {
      const isEditing = editingRepair !== null;

      const response = await fetch("/api/repairs", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditing ? { id: editingRepair.id, ...payload } : payload
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || (isEditing ? t.errEdit : t.errCreate)
        );
      }

      if (isEditing) {
        setRepairs((previous) =>
          previous.map((repair) =>
            repair.id === data.id ? (data as Repair) : repair
          )
        );
        setNotice(t.okEdited(data.id));
      } else {
        setRepairs((previous) => [data as Repair, ...previous]);
        setNotice(t.okCreated(data.id));
      }

      setShowForm(false);
      setEditingRepair(null);
      setForm(emptyForm);
      setActiveNav("repairs");
    } catch (error) {
      console.error(error);
      setNotice(error instanceof Error ? error.message : t.errGeneric);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id: string, status: string) {
    const existing = repairs.find((repair) => repair.id === id);

    if (!existing || existing.status === status || updatingId) return;

    setUpdatingId(id);
    setNotice("");

    try {
      const response = await fetch("/api/repairs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.errStatus);
      }

      setRepairs((previous) =>
        previous.map((repair) => (repair.id === id ? (data as Repair) : repair))
      );

      setNotice(t.okStatus(id));
    } catch (error) {
      console.error(error);
      setNotice(error instanceof Error ? error.message : t.errGeneric);
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteRepair(repair: Repair) {
    const confirmed = window.confirm(t.confirmDelete(repair.id, repair.customer));

    if (!confirmed) return;

    setDeletingId(repair.id);
    setNotice("");

    try {
      const response = await fetch("/api/repairs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: repair.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.errDelete);
      }

      setRepairs((previous) => previous.filter((item) => item.id !== repair.id));

      setNotice(t.okDeleted(repair.id));
    } catch (error) {
      console.error(error);
      setNotice(error instanceof Error ? error.message : t.errGeneric);
    } finally {
      setDeletingId(null);
    }
  }

  const textStart = isAr ? "text-right" : "text-left";

  const formFields = [
    { name: "customer", label: t.customerName, placeholder: t.fullNamePlaceholder },
    { name: "phone", label: t.phone, placeholder: "05xxxxxxxx" },
    { name: "device", label: t.device, placeholder: "iPhone 13" },
    { name: "issue", label: t.issue, placeholder: t.issuePlaceholder },
    { name: "price", label: t.estimatedPrice, placeholder: "0" },
  ];

  return (
    <main
      dir={isAr ? "rtl" : "ltr"}
      lang={language}
      className="min-h-screen bg-[#f4f7fb] text-slate-800"
    >
      <aside
        className={`fixed top-0 z-20 hidden h-screen w-64 flex-col bg-[#10213d] text-white lg:flex ${
          isAr ? "right-0" : "left-0"
        }`}
      >
        <div className="flex h-24 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-2xl">
            🔧
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-wide">FixTrack</h1>
            <p className="mt-1 text-xs text-slate-400">{t.shopTitle}</p>
          </div>
        </div>

        <p className="px-6 pb-3 pt-8 text-xs text-slate-400">{t.mainMenu}</p>

        <nav className="space-y-2 px-3">
          {visibleNav.map(([icon, id]) => (
            <button
              key={id}
              onClick={() => setActiveNav(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition ${textStart} ${
                activeNav === id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <span className="w-6 text-center text-lg">{icon}</span>
              <span>{t[id]}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-bold">{t.centerTitle}</p>
            <p className="mt-2 text-xs leading-6 text-slate-400">{t.centerText}</p>
          </div>
        </div>
      </aside>

      <section className={`min-w-0 ${isAr ? "lg:mr-64" : "lg:ml-64"}`}>
        <header className="sticky top-0 z-10 flex min-h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
          <div>
            <p className="text-sm text-slate-500">{t.shopSystem}</p>
            <h2 className="mt-1 text-xl font-extrabold">{t[activeNav]}</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-100"
            >
              {t.switchLang}
            </button>

                        <span className="hidden text-sm text-slate-500 sm:block">
              {userName ? `${t.welcome} ${userName}` : t.welcome}
            </span>

                       <button
              type="button"
              onClick={async () => {
                try {
                  await fetch("/api/auth/logout", { method: "POST" });
                } finally {
                  window.location.href = "/login";
                }
              }}
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
            >
              ⎋ {isAr ? "خروج" : "Çıkış"}
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-8">
          {notice && (
            <div
              role="status"
              className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              <span>{notice}</span>
              <button onClick={() => setNotice("")} aria-label={t.close}>
                ✕
              </button>
            </div>
          )}

                   {activeNav === "customers" ? (
            <CustomersPanel language={language} />
          ) : activeNav === "accounts" ? (
            <AccountsPanel language={language} />
                      ) : activeNav === "reports" ? (
            <ReportsPanel language={language} />
                      ) : activeNav === "settings" ? (
            <SettingsPanel language={language} />
          ) : activeNav !== "dashboard" && activeNav !== "repairs" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <h3 className="text-xl font-bold">{t[activeNav]}</h3>
              <p className="mt-3 text-slate-500">{t.comingSoon}</p>
              <button
                onClick={() => setActiveNav("dashboard")}
                className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
              >
                {t.backToDashboard}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-2xl font-extrabold">{t.welcomeTitle}</h3>
                  <p className="mt-2 text-sm text-slate-500">{t.welcomeText}</p>
                </div>
                <button
                  onClick={openNewForm}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  ＋ {t.addRepair}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { title: t.totalRepairs, value: repairs.length, icon: "▣" },
                  {
                    title: t.inRepair,
                    value: repairs.filter((repair) =>
                      ["قيد الفحص", "قيد الإصلاح", "قيد الاختبار"].includes(
                        repair.status
                      )
                    ).length,
                    icon: "🔧",
                  },
                  {
                    title: t.waitingParts,
                    value: count("بانتظار قطعة الغيار"),
                    icon: "◷",
                  },
                  {
                    title: t.ready,
                    value: count("جاهز للاستلام"),
                    icon: "✓",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">{item.title}</span>
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
                        {item.icon}
                      </span>
                    </div>
                    <p className="mt-4 text-3xl font-extrabold">
                      {loading ? "…" : item.value}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{t.basedOnOrders}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-lg font-extrabold">{t.repairs}</h3>
                    <p className="mt-1 text-sm text-slate-500">{t.tableDesc}</p>
                  </div>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t.search}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 sm:max-w-xs"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className={`w-full min-w-[1050px] text-sm ${textStart}`}>
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-semibold">{t.orderNumber}</th>
                        <th className="px-5 py-4 font-semibold">{t.customer}</th>
                        <th className="px-5 py-4 font-semibold">{t.deviceIssue}</th>
                        <th className="px-5 py-4 font-semibold">{t.receivedDate}</th>
                        <th className="px-5 py-4 font-semibold">{t.status}</th>
                        <th className="px-5 py-4 font-semibold">{t.price}</th>
                        <th className="px-5 py-4 font-semibold">{t.actions}</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="p-10 text-center text-slate-400">
                            {t.loading}
                          </td>
                        </tr>
                      ) : (
                        <>
                          {filtered.map((repair) => (
                            <tr key={repair.id} className="transition hover:bg-slate-50">
                              <td className="px-5 py-4 font-bold text-blue-700">
                                {repair.id}
                              </td>
                              <td className="px-5 py-4">
                                <p className="font-semibold">{repair.customer}</p>
                                <p
                                  dir="ltr"
                                  className={`mt-1 text-xs text-slate-400 ${textStart}`}
                                >
                                  {repair.phone}
                                </p>
                              </td>
                              <td className="px-5 py-4">
                                <p className="font-semibold">{repair.device}</p>
                                <p className="mt-1 text-xs text-slate-500">{repair.issue}</p>
                              </td>
                              <td className="px-5 py-4 text-slate-500">{repair.date}</td>
                              <td className="px-5 py-4">
                                <select
                                  value={repair.status}
                                  disabled={
                                    updatingId === repair.id || deletingId === repair.id
                                  }
                                  onChange={(event) =>
                                    changeStatus(repair.id, event.target.value)
                                  }
                                  className="max-w-48 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold outline-none focus:border-blue-500 disabled:opacity-50"
                                >
                                  {statuses.map((status) => (
                                    <option key={status} value={status}>
                                      {statusLabel(status)}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-5 py-4 font-bold">
                                {repair.price.toLocaleString("tr-TR")} ₺
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openEditForm(repair)}
                                    disabled={deletingId === repair.id}
                                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                                  >
                                    ✏️ {t.edit}
                                  </button>
                                  <button
                                    onClick={() => deleteRepair(repair)}
                                    disabled={
                                      deletingId === repair.id || updatingId === repair.id
                                    }
                                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                  >
                                    {deletingId === repair.id
                                      ? t.deleting
                                      : `🗑️ ${t.delete}`}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}

                          {filtered.length === 0 && (
                            <tr>
                              <td colSpan={7} className="p-10 text-center text-slate-400">
                                {t.noResults}
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-400">
                  {t.resultsCount}: {filtered.length}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowReceiptPicker(true)}
                  className={`rounded-2xl bg-[#10213d] p-6 text-white transition hover:bg-[#18345d] focus:outline-none focus:ring-2 focus:ring-blue-500 ${textStart}`}
                >
                  <p className="text-sm text-blue-200">{t.printReceipt}</p>
                  <h3 className="mt-2 text-xl font-extrabold">{t.qrTitle}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{t.qrDesc}</p>
                  <span className="mt-4 inline-block rounded-lg bg-white/10 px-4 py-2 text-sm font-bold">
                    {t.pickAndPrint}
                  </span>
                </button>
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <p className="text-sm text-slate-500">{t.readyForPickup}</p>
                  <h3 className="mt-2 text-3xl font-extrabold">
                    {count("جاهز للاستلام")} {t.devicesUnit}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">{t.updateHint}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {showReceiptPicker && (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
          <div className="my-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold">{t.pickerTitle}</h3>
                <p className="mt-1 text-sm text-slate-500">{t.pickerDesc}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptPicker(false)}
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
                aria-label={t.close}
              >
                ✕
              </button>
            </div>
            <div className="max-h-[55vh] space-y-2 overflow-y-auto">
              {repairs.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                  {t.noRepairsForReceipt}
                </p>
              ) : (
                repairs.map((repair) => (
                  <button
                    key={repair.id}
                    type="button"
                    onClick={() => {
                      if (!repair.trackingToken) {
                        setNotice(t.errNoToken);
                        setShowReceiptPicker(false);
                        return;
                      }
                      window.location.href = `/receipt/${encodeURIComponent(
                        repair.trackingToken
                      )}`;
                    }}
                    className={`flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50 ${textStart}`}
                  >
                    <span className="min-w-0">
                      <span className="block font-bold text-slate-800">
                        {repair.id} · {repair.device}
                      </span>
                      <span className="mt-1 block truncate text-sm text-slate-500">
                        {repair.customer} — {repair.issue}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white">
                      {t.openReceipt}
                    </span>
                  </button>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowReceiptPicker(false)}
              className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <form
            onSubmit={saveRepair}
            className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-extrabold">
                {editingRepair ? t.editRepairTitle : t.newRepairTitle}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {formFields.map((field) => (
                <label
                  key={field.name}
                  className="flex flex-col gap-2 text-sm font-semibold"
                >
                  {field.label}
                  <input
                    name={field.name}
                    type={field.name === "price" ? "number" : "text"}
                    min={field.name === "price" ? 0 : undefined}
                    step={field.name === "price" ? "0.01" : undefined}
                    required={field.name !== "price"}
                    placeholder={field.placeholder}
                    value={form[field.name as keyof typeof form]}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        [field.name]: event.target.value,
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500"
                  />
                </label>
              ))}
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              {editingRepair ? t.saveEditHint : t.saveNewHint}
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? t.saving : editingRepair ? t.save : t.create}
              </button>
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-3 font-semibold disabled:opacity-50"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      <footer className="px-6 pb-6 text-center text-xs text-slate-400">
        {t.footer}
      </footer>
    </main>
  );
}