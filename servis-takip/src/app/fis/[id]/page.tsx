"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import Barcode from "@/components/Barcode";
import { formatServiceOrderNo } from "@/lib/service-order-number";

type ShopProfile = {
  name: string;
};

type FisOrder = {
  id: string;
  orderNumber: string | null;
  serialNo: string | null;
  noSerialNo: boolean;
  warrantyStatus: string | null;
  isTampered: boolean;
  arrivedByCargo: boolean;
  cargoInfo: string | null;
  complaint: string | null;
  accessories: string | null;
  physicalDamage: string | null;
  arrivedAt: string;
  deviceTypeName: string | null;
  brandName: string | null;
  modelName: string | null;
  shop: { name: string };
  customer: { name: string; phone: string | null };
  deviceType: { name: string } | null;
  brand: { name: string } | null;
  deviceModel: { name: string } | null;
};

type PrintSettings = Record<string, string>;

function pageSize(size: string, orientation: string) {
  if (size === "80mm termal") return "80mm 200mm";
  if (size === "58mm termal") return "58mm 200mm";
  return `${size} ${orientation}`;
}

function pageMargin(v: string) {
  if (v === "yok") return "0";
  if (v === "dar") return "0.3cm";
  if (v === "genis") return "2cm";
  return "1cm";
}

function dash(v: string | null | undefined) {
  const t = v?.trim();
  return t ? t : "—";
}

function warrantyText(v: string | null) {
  if (v === "guaranteed") return "Garantili";
  if (v === "no_warranty") return "Garantisiz";
  return "Belirtilmemiş";
}

export default function ServisFisPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [order, setOrder] = useState<FisOrder | null>(null);
  const [shopProfile, setShopProfile] = useState<ShopProfile | null>(null);
  const [settings, setSettings] = useState<PrintSettings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const printStyles = useMemo(() => {
    const size = pageSize(
      settings.servis_fisi_boyut ?? "A4",
      settings.servis_fisi_yon ?? "portrait",
    );
    const margin = pageMargin(settings.servis_fisi_kenar ?? "normal");
    return `
      body { background: #f3f4f6; }
      @media print {
        .no-print { display: none !important; }
        body { background: white !important; margin: 0; padding: 0; }
        .fis-card {
          box-shadow: none !important;
          border-radius: 0 !important;
          margin: 0 !important;
          max-width: 100% !important;
          padding: 16px !important;
        }
        @page {
          size: ${size};
          margin: ${margin};
          margin-top: 0.5cm;
          margin-bottom: 0.5cm;
        }
        svg {
          display: block !important;
        }
      }
    `;
  }, [settings]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [orderRes, settingsRes, shopRes] = await Promise.all([
        fetch(`/api/service-orders/${encodeURIComponent(id)}`),
        fetch("/api/settings"),
        fetch("/api/shop"),
      ]);
      const orderData = await orderRes.json().catch(() => ({}));
      const settingsData = await settingsRes.json().catch(() => ({}));
      const shopData = await shopRes.json().catch(() => ({}));
      if (!orderRes.ok) {
        setError(typeof orderData.error === "string" ? orderData.error : "Kayıt yüklenemedi");
        return;
      }
      setOrder(orderData as FisOrder);
      setSettings(settingsData as PrintSettings);
      if (shopRes.ok && typeof (shopData as ShopProfile)?.name === "string") {
        setShopProfile({ name: (shopData as ShopProfile).name });
      } else {
        setShopProfile(null);
      }
    } catch {
      setError("Kayıt yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const deviceType = order?.deviceType?.name ?? order?.deviceTypeName ?? "—";
  const brand = order?.brand?.name ?? order?.brandName ?? "—";
  const model = order?.deviceModel?.name ?? order?.modelName ?? "—";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div className="no-print mb-4 flex gap-2">
        <Link
          href={id ? `/servis-detay/${encodeURIComponent(id)}` : "/cihaz-sorgula"}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
        >
          <ArrowLeft className="size-4" /> Geri Dön
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <Printer className="size-4" /> Yazdır / PDF Kaydet
        </button>
      </div>
      <p
        className="no-print"
        style={{
          fontSize: "11px",
          color: "#888",
          marginTop: "6px",
          maxWidth: "320px",
          lineHeight: "1.5",
        }}
      >
        💡 Üst/alt bilgileri (tarih, URL) kaldırmak için tarayıcının yazdırma
        ayarlarında "Üstbilgiler ve altbilgiler" seçeneğini kapatın.
      </p>
      {loading ? (
        <p className="text-sm text-slate-600">Yükleniyor…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : order ? (
        <div
          className="fis-card mx-auto max-w-[580px] rounded-lg bg-white p-10 text-black shadow-[0_2px_12px_rgba(0,0,0,0.1)]"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          <div className="mb-6 flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div>
              <p className="text-[22px] font-bold leading-tight">
                {shopProfile?.name ?? order.shop.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">SERVİS GİRİŞ FİŞİ</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[20px] font-bold">
                #{formatServiceOrderNo(order)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(order.arrivedAt).toLocaleString("tr-TR")}
              </p>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-6 border-b border-slate-200 pb-5">
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.1em] text-slate-400">
                MÜŞTERİ
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {dash(order.customer.name)}
              </p>
              <p className="mt-0.5 text-[13px] text-slate-600">
                {dash(order.customer.phone)}
              </p>
            </div>
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.1em] text-slate-400">
                CİHAZ
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {deviceType} / {brand} / {model}
              </p>
              <p className="mt-0.5 text-[13px] text-slate-600">
                Seri: {order.noSerialNo ? "-" : dash(order.serialNo)}
              </p>
            </div>
          </div>

          <table className="mb-5 w-full border-collapse text-xs">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="w-[140px] py-1.5 text-slate-500">Geliş Tarihi</td>
                <td className="py-1.5 font-medium text-slate-800">
                  {new Date(order.arrivedAt).toLocaleString("tr-TR")}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-1.5 text-slate-500">Garanti</td>
                <td className="py-1.5 font-medium text-slate-800">
                  {warrantyText(order.warrantyStatus)}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-1.5 text-slate-500">Genel Durum</td>
                <td className="py-1.5 font-medium text-slate-800">
                  {order.isTampered ? "Kurcalanmış" : "Kurcalanmamış"}
                </td>
              </tr>
              {order.arrivedByCargo ? (
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 text-slate-500">Kargo Bilgisi</td>
                  <td className="py-1.5 font-medium text-slate-800">
                    {dash(order.cargoInfo) === "—" ? "Evet" : dash(order.cargoInfo)}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <div className="mb-5 border-b border-slate-200 pb-5">
            <p className="mb-2 text-[10px] uppercase tracking-[0.1em] text-slate-400">
              ŞİKAYET / ARIZA
            </p>
            <p className="text-[13px] leading-6 text-slate-700">
              {dash(order.complaint) === "—" ? "Belirtilmemiş" : dash(order.complaint)}
            </p>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-6">
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.1em] text-slate-400">
                AKSESUARLAR
              </p>
              <p className="text-[13px] text-slate-700">
                {dash(order.accessories) === "—" ? "Yok" : dash(order.accessories)}
              </p>
            </div>
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.1em] text-slate-400">
                FİZİKSEL DURUM
              </p>
              <p className="text-[13px] text-slate-700">
                {dash(order.physicalDamage) === "—" ? "Yok" : dash(order.physicalDamage)}
              </p>
            </div>
          </div>

          {order.orderNumber?.trim() ? (
            <div
              style={{
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  margin: "20px 0",
                }}
              >
                <Barcode
                  value={order.orderNumber.trim()}
                  width={2}
                  height={50}
                  fontSize={12}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-10">
            <div className="text-center">
              <div className="border-t border-slate-700 pt-2 text-xs text-slate-500">
                Müşteri İmzası
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-slate-700 pt-2 text-xs text-slate-500">
                Yetkili İmzası
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400">
            Bu fiş teknik servis kaydınızın belgesidir.
          </p>
        </div>
      ) : null}
    </>
  );
}
