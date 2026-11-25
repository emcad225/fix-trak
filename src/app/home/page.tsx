import type { Metadata } from "next";
import Landing from "../../components/Landing";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://fixtrack.company";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title:
    "FixTrack | نظام إدارة محلات صيانة الهواتف | Telefon Tamir Yönetim Sistemi",
  description:
    "نظام لإدارة محلات صيانة الهواتف: الطلبات، تتبع الجهاز بـ QR، الزبائن، الحسابات والتقارير. Telefon tamirhaneleri için talep takibi, QR ile müşteri takibi, hesaplar ve raporlar.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "FixTrack | نظام إدارة محلات صيانة الهواتف",
    description:
      "Telefon tamir yönetim sistemi. نظام إدارة محلات صيانة الهواتف.",
    url: "/",
    siteName: "FixTrack",
    type: "website",
  },
};

export default function HomePage() {
  return <Landing />;
}