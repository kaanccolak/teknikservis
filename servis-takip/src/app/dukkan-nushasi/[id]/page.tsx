"use client";

import { ArrowLeft, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import Barcode from "@/components/Barcode";
import { formatServiceOrderNo } from "@/lib/service-order-number";

type ShopProfile = {
  name: string;
};

type DukkanNushasiOrder = {
  id: string;
  orderNumber: string | null;
  arrivedAt: string;
  complaint: string | null;
  totalPrice: number | null;
  customer: { name: string; phone: string | null };
  shop: { name: string } | null;
  deviceTypeName: string | null;
  brandName: string | null;
  modelName: string | null;
  deviceType: { name: string } | null;
  brand: { name: string } | null;
  deviceModel: { name: string } | null;
};

type PrintSettings = Record<string, string>;

function textOrFallback(v: string | null | undefined, fallback: string) {
  const t = v?.trim();
  return t ? t : fallback;
}

export default function DukkanNushasiPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [order, setOrder] = useState<DukkanNushasiOrder | null>(null);
  const [shopProfile, setShopProfile] = useState<ShopProfile | null>(null);
  const [settings, setSettings] = useState<PrintSettings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const printStyles = useMemo(() => {
    const genislik = settings.etiket_genislik ?? "80";
    const fontBoyutu = settings.etiket_font_boyutu ?? "13";
    const thermal = Number(genislik) <= 100;

    if (thermal) {
      const w = Number(genislik);
      // 60x40 gibi yatay etiketler için landscape
      const isLandscape = w <= 60;
      const height = isLandscape ? Math.round(w * 0.67) : undefined;
      const pageSize = isLandscape
        ? `${w}mm ${height}mm landscape`
        : `${w}mm auto`;

      return `
      body { background: #f3f4f6; }
      @media print {
        .no-print { display: none !important; }
        body { background: white !important; margin: 0; padding: 0; }
        .fis-card {
          box-shadow: none !important;
          border-radius: 0 !important;
          margin: 0 !important;
          width: ${w}mm !important;
          max-width: ${w}mm !important;
          padding: ${isLandscape ? "1.5mm" : "3mm"} !important;
          font-size: ${fontBoyutu}px !important;
        }
        @page {
          size: ${pageSize};
          margin: 0;
        }
        svg { display: block !important; }
      }
    `;
    }

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
      @page { size: A5 portrait; margin: 0.5cm; }
      svg { display: block !important; }
    }
  `;
  }, [settings]);

  const isThermal =
    ["58", "60", "72", "80"].includes((settings.etiket_genislik ?? "80").trim()) ||
    Number(settings.etiket_genislik) <= 100;

  const load = useCallback(async () => {
    if (!id) {
      setError("Geçersiz kayıt");
      setLoading(false);
      return;
    }

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
        setError(
          typeof orderData.error === "string" ? orderData.error : "Kayıt yüklenemedi",
        );
        setOrder(null);
        return;
      }

      setOrder(orderData as DukkanNushasiOrder);
      setSettings(settingsData as PrintSettings);
      if (shopRes.ok && typeof (shopData as ShopProfile)?.name === "string") {
        setShopProfile({ name: (shopData as ShopProfile).name });
      } else {
        setShopProfile(null);
      }
    } catch {
      setError("Bağlantı hatası");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />

      <div className="no-print mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => router.push(id ? `/servis-detay/${encodeURIComponent(id)}` : "/cihaz-sorgula")}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Geri Dön
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <Printer className="size-4" aria-hidden />
          Yazdır / PDF Kaydet
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
        ayarlarında &quot;Üstbilgiler ve altbilgiler&quot; seçeneğini kapatın.
      </p>

      {loading ? (
        <p className="text-sm text-slate-600">Yükleniyor…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : order ? (
        (() => {
          const genislik = settings.etiket_genislik ?? "80";
          const brand = order.brand?.name ?? order.brandName ?? "";
          const model = order.deviceModel?.name ?? order.modelName ?? "";
          const cihaz = model || brand || "";

          if (isThermal) {
            const isLandscape = Number(genislik) <= 60;
            const fontSize = Number(settings.etiket_font_boyutu ?? 13);

            return (
              <div
                className="fis-card bg-white text-black"
                style={{
                  fontFamily: "monospace",
                  fontSize: `${fontSize}px`,
                  lineHeight: "1.4",
                  maxWidth: `${genislik}mm`,
                  width: "100%",
                  margin: "0 auto",
                  padding: isLandscape ? "2mm" : "4mm",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                  borderRadius: "4px",
                  display: isLandscape ? "flex" : "block",
                  gap: isLandscape ? "3mm" : undefined,
                  alignItems: isLandscape ? "center" : undefined,
                }}
              >
                <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: `${fontSize + 1}px`,
                      marginBottom: "1px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {textOrFallback(shopProfile?.name ?? order.shop?.name, "Dükkan")}
                  </p>
                  <p
                    style={{
                      fontSize: `${fontSize - 2}px`,
                      color: "#555",
                      marginBottom: "4px",
                    }}
                  >
                    {new Date(order.arrivedAt).toLocaleString("tr-TR")}
                  </p>
                  <div style={{ borderTop: "1px dashed #999", margin: "3px 0" }} />
                  <p
                    style={{
                      fontWeight: 700,
                      marginBottom: "1px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {textOrFallback(order.customer?.name, "—")}
                  </p>
                  <p style={{ marginBottom: "1px", fontSize: `${fontSize - 1}px` }}>
                    {textOrFallback(order.customer?.phone, "—")}
                  </p>
                  {cihaz ? (
                    <p
                      style={{
                        marginBottom: "1px",
                        fontSize: `${fontSize - 1}px`,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cihaz}
                    </p>
                  ) : null}
                  {order.complaint?.trim() ? (
                    <p
                      style={{
                        marginBottom: "1px",
                        fontSize: `${fontSize - 1}px`,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {order.complaint.trim()}
                    </p>
                  ) : null}
                  {order.totalPrice != null ? (
                    <p
                      style={{
                        fontSize: `${fontSize}px`,
                        fontWeight: 700,
                        marginTop: "2px",
                      }}
                    >
                      {order.totalPrice.toLocaleString("tr-TR")} ₺
                    </p>
                  ) : null}
                </div>

                {order.orderNumber?.trim() ? (
                  <div
                    style={{
                      flexShrink: 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Barcode
                      value={order.orderNumber.trim()}
                      width={isLandscape ? 0.7 : 1}
                      height={isLandscape ? 28 : 40}
                      fontSize={isLandscape ? 7 : 10}
                      margin={isLandscape ? 2 : 4}
                    />
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <div
              className="fis-card mx-auto max-w-[400px] rounded-lg bg-white p-8 text-black shadow-[0_2px_12px_rgba(0,0,0,0.1)]"
              style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
            >
              <div className="mb-5 border-b-2 border-slate-900 pb-4 text-center">
                <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  CİHAZ ETİKETİ
                </p>
                <p className="text-[20px] font-bold leading-tight">
                  {textOrFallback(shopProfile?.name ?? order.shop?.name, "Dükkan")}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(order.arrivedAt).toLocaleString("tr-TR")}
                </p>
              </div>
              <div className="mb-5 flex items-center justify-between rounded-md bg-slate-50 px-4 py-2.5">
                <span className="text-xs text-slate-500">Kayıt No</span>
                <span className="font-mono text-base font-bold text-slate-900">
                  #{formatServiceOrderNo(order)}
                </span>
              </div>
              <div className="mb-5 border-b border-slate-200 pb-4">
                <p className="mb-2 text-[10px] uppercase tracking-[0.1em] text-slate-400">
                  MÜŞTERİ BİLGİLERİ
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {textOrFallback(order.customer?.name, "Belirtilmemiş")}
                </p>
                <p className="mt-1 text-[13px] text-slate-600">
                  {textOrFallback(order.customer?.phone, "Belirtilmemiş")}
                </p>
              </div>
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.1em] text-slate-400">
                  ŞİKAYET / ARIZA
                </p>
                <p className="min-h-10 text-[13px] leading-6 text-slate-700">
                  {textOrFallback(order.complaint, "Belirtilmemiş")}
                </p>
              </div>
              {order.orderNumber?.trim() ? (
                <div
                  style={{
                    textAlign: "center",
                    display: "flex",
                    justifyContent: "center",
                    paddingTop: "16px",
                    borderTop: "1px solid #eee",
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
            </div>
          );
        })()
      ) : null}
    </>
  );
}
