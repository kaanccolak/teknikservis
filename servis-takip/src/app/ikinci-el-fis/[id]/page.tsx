"use client";

import { ArrowLeft, Loader2, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import Barcode from "@/components/Barcode";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatTrNationalDisplay, trPhoneDigitsOnly } from "@/lib/tr-phone";
import { cn } from "@/lib/utils";

type ShopRow = { name: string; ikinciElAlimBelgeNotu?: string | null };

type DeviceRow = {
  deviceCode: string;
  sellerName: string;
  sellerPhone: string | null;
  sellerTcNo: string | null;
  serialNo: string | null;
  noSerialNo: boolean;
  hasInvoice: boolean;
  hasWarranty: boolean;
  hasBox: boolean;
  purchasePrice: number;
  createdAt: string;
  deviceType: { name: string } | null;
  brand: { name: string } | null;
  deviceModel: { name: string } | null;
};

function formatTry(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatPhone(stored: string | null): string {
  if (!stored) return "—";
  const d = trPhoneDigitsOnly(stored);
  if (d.length === 10 && d.startsWith("5")) {
    return `+90 ${formatTrNationalDisplay(d)}`;
  }
  return stored;
}

function deviceLine(r: DeviceRow): string {
  const p = [
    r.deviceType?.name,
    r.brand?.name,
    r.deviceModel?.name,
  ].filter(Boolean);
  return p.length > 0 ? p.join(" / ") : "—";
}

function varYok(v: boolean) {
  return v ? "Var" : "Yok";
}

export default function IkinciElAlimFisPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [row, setRow] = useState<DeviceRow | null>(null);
  const [shop, setShop] = useState<ShopRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const printStyles = useMemo(
    () => `
      body { background: #f3f4f6; }
      @media print {
        .no-print { display: none !important; }
        body { background: white !important; margin: 0; }
        .fis-card {
          box-shadow: none !important;
          border: none !important;
          max-width: 100% !important;
        }
        @page { margin: 1cm; }
      }
    `,
    [],
  );

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [dRes, sRes] = await Promise.all([
        fetch(`/api/second-hand/${encodeURIComponent(id)}`),
        fetch("/api/shop"),
      ]);
      const dJson = await dRes.json().catch(() => ({}));
      const sJson = await sRes.json().catch(() => ({}));
      if (!dRes.ok) {
        setError(
          typeof dJson.error === "string" ? dJson.error : "Kayıt yüklenemedi",
        );
        setRow(null);
        return;
      }
      setRow(dJson as DeviceRow);
      setShop(
        typeof sJson.name === "string"
          ? {
              name: sJson.name,
              ikinciElAlimBelgeNotu:
                typeof sJson.ikinciElAlimBelgeNotu === "string"
                  ? sJson.ikinciElAlimBelgeNotu
                  : null,
            }
          : { name: "—" },
      );
    } catch {
      setError("Bağlantı hatası");
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-slate-600">
        <Loader2 className="size-6 animate-spin" aria-hidden />
        <span>Yükleniyor…</span>
      </div>
    );
  }

  if (error || !row) {
    return (
      <div className="p-8">
        <p className="text-destructive">{error ?? "Kayıt bulunamadı"}</p>
        <Link href="/ikinci-el" className={cn(buttonVariants({ variant: "link" }), "mt-4")}>
          Listeye dön
        </Link>
      </div>
    );
  }

  const docDate = new Date(row.createdAt).toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div className="min-h-screen bg-slate-100 py-6 print:bg-white print:py-0">
        <div className="no-print mx-auto mb-4 flex max-w-lg justify-between gap-2 px-4">
          <Link
            href={`/ikinci-el/${id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
          >
            <ArrowLeft className="size-4" />
            Geri dön
          </Link>
          <Button type="button" size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="mr-1 size-4" />
            Yazdır
          </Button>
        </div>

        <div className="fis-card mx-auto max-w-lg border border-slate-200 bg-white px-6 py-8 shadow-sm print:shadow-none">
          <div className="border-b border-slate-200 pb-4 text-center">
            <h1 className="text-lg font-bold tracking-wide text-slate-900">
              İKİNCİ EL ÜRÜN ALIM BELGESİ
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {shop?.name ?? "—"}
            </p>
            <p className="text-xs text-slate-500">{docDate}</p>
          </div>

          <div className="mt-4 space-y-1 border-b border-slate-100 py-3 text-sm">
            <p>
              <span className="font-medium text-slate-600">Kayıt No:</span>{" "}
              <span className="font-semibold text-violet-700">{row.deviceCode}</span>
            </p>
          </div>

          <div className="mt-4 border-b border-slate-100 pb-4">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Satıcı bilgileri
            </h2>
            <div className="space-y-1 text-sm text-slate-800">
              <p>
                <span className="text-slate-600">Ad soyad:</span> {row.sellerName}
              </p>
              <p>
                <span className="text-slate-600">Telefon:</span>{" "}
                {formatPhone(row.sellerPhone)}
              </p>
              <p>
                <span className="text-slate-600">TC kimlik no:</span>{" "}
                {row.sellerTcNo ?? "—"}
              </p>
            </div>
          </div>

          <div className="mt-4 border-b border-slate-100 pb-4">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Cihaz bilgileri
            </h2>
            <div className="space-y-1 text-sm text-slate-800">
              <p>
                <span className="text-slate-600">Cihaz:</span> {deviceLine(row)}
              </p>
              <p>
                <span className="text-slate-600">Seri no:</span>{" "}
                {row.noSerialNo ? "—" : (row.serialNo ?? "—")}
              </p>
              <p className="text-sm">
                <span className="text-slate-600">Fatura:</span> {varYok(row.hasInvoice)}{" "}
                <span className="mx-2 text-slate-300">|</span>
                <span className="text-slate-600">Garanti:</span>{" "}
                {varYok(row.hasWarranty)}
              </p>
              <p>
                <span className="text-slate-600">Kutu:</span> {varYok(row.hasBox)}
              </p>
            </div>
          </div>

          <div className="mt-4 border-b border-slate-200 pb-4">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Satın alınan fiyat
            </h2>
            <p className="text-2xl font-bold tabular-nums text-slate-900">
              {formatTry(row.purchasePrice)}
            </p>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-slate-700">
            Yukarıda belirtilen cihazı belirtilen bedel karşılığında teslim ettiğimi
            beyan ederim.
          </p>

          <div className="mt-10 flex justify-between gap-8 text-sm text-slate-600">
            <div className="flex-1 border-t border-slate-300 pt-2 text-center">
              Satıcı imzası
            </div>
            <div className="flex-1 border-t border-slate-300 pt-2 text-center">
              Yetkili imzası
            </div>
          </div>

          {shop?.ikinciElAlimBelgeNotu ? (
            <div
              style={{
                marginTop: "24px",
                borderTop: "1px solid #e5e7eb",
                paddingTop: "16px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  marginBottom: "8px",
                  color: "#111827",
                }}
              >
                Notlar
              </p>
              <div style={{ fontSize: "10px", color: "#374151", lineHeight: "1.6" }}>
                {shop.ikinciElAlimBelgeNotu
                  .split("\n")
                  .filter((l) => l.trim())
                  .map((line, i) => (
                    <p key={i} style={{ margin: "2px 0" }}>
                      • {line}
                    </p>
                  ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col items-center gap-2 print:mt-6">
            <Barcode value={row.deviceCode} height={50} width={1.8} fontSize={12} />
          </div>
        </div>
      </div>
    </>
  );
}
