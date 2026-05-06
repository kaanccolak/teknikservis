"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { formatServiceOrderNo } from "@/lib/service-order-number";

type FisOrder = {
  id: string;
  orderNumber: string | null;
  serialNo: string | null;
  noSerialNo: boolean;
  warrantyStatus: string | null;
  isTampered: boolean;
  complaint: string | null;
  accessories: string | null;
  physicalDamage: string | null;
  arrivedByCargo: boolean;
  cargoInfo: string | null;
  arrivedAt: string;
  deviceTypeName: string | null;
  brandName: string | null;
  modelName: string | null;
  totalPrice: number | null;
  shop: { name: string };
  customer: { name: string; phone: string | null };
  deviceType: { name: string } | null;
  brand: { name: string } | null;
  deviceModel: { name: string } | null;
  sparePartUsages: Array<{
    id: string;
    quantity: number;
    costAtTime: number;
    sparePart: { name: string; partCode: string | null };
  }>;
};

function formatTry(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatArrivedAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFisDateToday() {
  return new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function warrantyLabel(w: string | null) {
  if (w === "guaranteed") return "Garantili";
  if (w === "no_warranty") return "Garantisiz";
  return "—";
}

function dash(s: string | null | undefined) {
  const t = s?.trim();
  return t ? t : "—";
}

const printStyles = `
  @page {
    size: A4;
    margin: 1cm;
  }
  @media print {
    body * {
      visibility: hidden;
    }
    .fis-print,
    .fis-print * {
      visibility: visible;
    }
    .fis-print {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      max-width: none;
      margin: 0;
      padding: 0;
      background: #fff !important;
      color: #000 !important;
    }
    .no-print {
      display: none !important;
    }
    .fis-section {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .fis-table {
      break-inside: avoid;
    }
  }
`;

export default function ServisFisPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [order, setOrder] = useState<FisOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) {
      setError("Geçersiz kayıt");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/service-orders/${encodeURIComponent(id)}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Kayıt yüklenemedi");
        setOrder(null);
        return;
      }
      setOrder(j as FisOrder);
    } catch {
      setError("Kayıt yüklenemedi");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const partsTotal =
    order?.sparePartUsages?.reduce(
      (acc, u) => acc + u.quantity * u.costAtTime,
      0,
    ) ?? 0;
  const labor =
    order?.totalPrice != null
      ? Math.max(0, order.totalPrice - partsTotal)
      : null;
  const grandTotal = order?.totalPrice ?? null;

  const deviceType = order?.deviceType?.name ?? order?.deviceTypeName ?? "—";
  const brand = order?.brand?.name ?? order?.brandName ?? "—";
  const model = order?.deviceModel?.name ?? order?.modelName ?? "—";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />

      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
        <Link
          href={id ? `/servis-detay/${encodeURIComponent(id)}` : "/cihaz-sorgula"}
          className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Geri Dön
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          disabled={!order}
          className="inline-flex items-center gap-2 rounded-md border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          <Printer className="size-4" aria-hidden />
          Yazdır / PDF Kaydet
        </button>
      </div>

      {loading ? (
        <p className="no-print text-sm text-neutral-600">Yükleniyor…</p>
      ) : error ? (
        <p className="no-print text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : order ? (
        <div
          className="fis-print mx-auto max-w-[210mm] bg-white text-black"
          style={{
            fontFamily: 'system-ui, "Segoe UI", sans-serif',
            fontSize: "11pt",
            lineHeight: 1.45,
          }}
        >
          <header
            className="fis-section flex flex-wrap items-end justify-between gap-4 border-b-2 border-black pb-3"
            style={{ marginBottom: "12pt" }}
          >
            <div
              className="font-bold"
              style={{ fontSize: "16pt", maxWidth: "55%" }}
            >
              {order.shop.name}
            </div>
            <div
              className="text-right font-bold uppercase tracking-wide"
              style={{ fontSize: "13pt" }}
            >
              Servis Giriş Fişi
            </div>
          </header>

          <section
            className="fis-section flex flex-wrap items-baseline justify-between gap-2 text-sm"
            style={{ marginBottom: "14pt" }}
          >
            <div className="space-y-1">
              <div>
                <span className="font-semibold">Kayıt No:</span>{" "}
                #{formatServiceOrderNo(order)}
              </div>
              <div>
                <span className="font-semibold">Geliş Tarihi:</span>
                {formatArrivedAt(order.arrivedAt)}
              </div>
            </div>
            <div>
              <span className="font-semibold">Fiş Tarihi:</span>
              {formatFisDateToday()}
            </div>
          </section>

          <section className="fis-section" style={{ marginBottom: "12pt" }}>
            <div
              className="font-semibold"
              style={{ marginBottom: "6pt", fontSize: "10pt" }}
            >
              Müşteri Bilgileri
            </div>
            <div
              className="border border-black px-3 py-2"
              style={{ padding: "10pt 12pt" }}
            >
              <div>
                <span className="font-semibold">Ad Soyad:</span>{" "}
                {dash(order.customer.name)}
              </div>
              <div style={{ marginTop: "4pt" }}>
                <span className="font-semibold">Telefon:</span>{" "}
                {dash(order.customer.phone)}
              </div>
            </div>
          </section>

          <section className="fis-section" style={{ marginBottom: "12pt" }}>
            <div
              className="font-semibold"
              style={{ marginBottom: "6pt", fontSize: "10pt" }}
            >
              Cihaz Bilgileri
            </div>
            <div className="border border-black" style={{ padding: "0" }}>
              <table className="fis-table w-full border-collapse text-left text-sm">
                <tbody>
                  <tr className="border-b border-black">
                    <th
                      className="border-r border-black font-semibold"
                      style={{ padding: "8pt 10pt", width: "33%" }}
                    >
                      Cihaz Türü
                    </th>
                    <th
                      className="border-r border-black font-semibold"
                      style={{ padding: "8pt 10pt", width: "33%" }}
                    >
                      Marka
                    </th>
                    <th className="font-semibold" style={{ padding: "8pt 10pt" }}>
                      Model
                    </th>
                  </tr>
                  <tr className="border-b border-black">
                    <td
                      className="border-r border-black"
                      style={{ padding: "8pt 10pt" }}
                    >
                      {deviceType}
                    </td>
                    <td
                      className="border-r border-black"
                      style={{ padding: "8pt 10pt" }}
                    >
                      {brand}
                    </td>
                    <td style={{ padding: "8pt 10pt" }}>{model}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td
                      className="border-r border-black font-semibold"
                      colSpan={1}
                      style={{ padding: "8pt 10pt" }}
                    >
                      Seri No
                    </td>
                    <td colSpan={2} style={{ padding: "8pt 10pt" }}>
                      {order.noSerialNo
                        ? "Belirtilmedi"
                        : dash(order.serialNo)}
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td
                      className="border-r border-black font-semibold"
                      style={{ padding: "8pt 10pt" }}
                    >
                      Garanti Durumu
                    </td>
                    <td colSpan={2} style={{ padding: "8pt 10pt" }}>
                      {warrantyLabel(order.warrantyStatus)}
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td
                      className="border-r border-black font-semibold"
                      style={{ padding: "8pt 10pt" }}
                    >
                      Genel Durum
                    </td>
                    <td colSpan={2} style={{ padding: "8pt 10pt" }}>
                      {order.isTampered ? "Kurcalanmış" : "Kurcalanmamış"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      className="border-r border-black font-semibold"
                      style={{ padding: "8pt 10pt" }}
                    >
                      Kargo ile geldi mi
                    </td>
                    <td colSpan={2} style={{ padding: "8pt 10pt" }}>
                      {order.arrivedByCargo ? "Evet" : "Hayır"}
                      {order.arrivedByCargo && order.cargoInfo?.trim()
                        ? ` (${order.cargoInfo.trim()})`
                        : ""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="fis-section" style={{ marginBottom: "12pt" }}>
            <div
              className="font-semibold"
              style={{ marginBottom: "6pt", fontSize: "10pt" }}
            >
              Arıza Bilgisi
            </div>
            <div
              className="space-y-2 border border-black px-3 py-2"
              style={{ padding: "10pt 12pt" }}
            >
              <div>
                <span className="font-semibold">Şikayet / Arıza Bilgisi:</span>
                <div style={{ marginTop: "4pt", whiteSpace: "pre-wrap" }}>
                  {dash(order.complaint)}
                </div>
              </div>
              <div style={{ marginTop: "8pt" }}>
                <span className="font-semibold">Cihazla Gelen Aksesuarlar:</span>
                <div style={{ marginTop: "4pt", whiteSpace: "pre-wrap" }}>
                  {dash(order.accessories)}
                </div>
              </div>
              <div style={{ marginTop: "8pt" }}>
                <span className="font-semibold">
                  Fiziksel Hasar / Dış Görünüm:
                </span>
                <div style={{ marginTop: "4pt", whiteSpace: "pre-wrap" }}>
                  {dash(order.physicalDamage)}
                </div>
              </div>
            </div>
          </section>

          {(order.sparePartUsages?.length ?? 0) > 0 ? (
            <section className="fis-section" style={{ marginBottom: "12pt" }}>
              <div
                className="font-semibold"
                style={{ marginBottom: "6pt", fontSize: "10pt" }}
              >
                Kullanılan Parçalar
              </div>
              <table className="fis-table w-full border-collapse border border-black text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="font-semibold" style={{ padding: "8pt 10pt" }}>
                      Parça Adı
                    </th>
                    <th
                      className="border-l border-black font-semibold"
                      style={{ padding: "8pt 10pt", width: "12%" }}
                    >
                      Adet
                    </th>
                    <th
                      className="border-l border-black font-semibold"
                      style={{ padding: "8pt 10pt", width: "22%" }}
                    >
                      Birim Fiyat
                    </th>
                    <th
                      className="border-l border-black font-semibold"
                      style={{ padding: "8pt 10pt", width: "22%" }}
                    >
                      Toplam
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.sparePartUsages.map((u) => {
                    const line = u.quantity * u.costAtTime;
                    const name =
                      u.sparePart.name +
                      (u.sparePart.partCode
                        ? ` (${u.sparePart.partCode})`
                        : "");
                    return (
                      <tr key={u.id} className="border-b border-black">
                        <td style={{ padding: "8pt 10pt" }}>{name}</td>
                        <td
                          className="border-l border-black tabular-nums"
                          style={{ padding: "8pt 10pt" }}
                        >
                          {u.quantity}
                        </td>
                        <td
                          className="border-l border-black tabular-nums"
                          style={{ padding: "8pt 10pt" }}
                        >
                          {formatTry(u.costAtTime)}
                        </td>
                        <td
                          className="border-l border-black tabular-nums font-medium"
                          style={{ padding: "8pt 10pt" }}
                        >
                          {formatTry(line)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          ) : null}

          <section
            className="fis-section text-right"
            style={{ marginBottom: "16pt" }}
          >
            <div className="inline-block min-w-[200px] text-left text-sm">
              <div className="flex justify-between gap-8 border-b border-black py-1">
                <span className="font-semibold">Parça Toplamı:</span>
                <span className="tabular-nums">{formatTry(partsTotal)}</span>
              </div>
              <div className="flex justify-between gap-8 border-b border-black py-1">
                <span className="font-semibold">İşçilik:</span>
                <span className="tabular-nums">
                  {labor != null ? formatTry(labor) : "—"}
                </span>
              </div>
              <div
                className="flex justify-between gap-8 py-2"
                style={{ fontSize: "12pt" }}
              >
                <span className="font-bold">Genel Toplam:</span>
                <span className="tabular-nums font-bold">
                  {formatTry(grandTotal)}
                </span>
              </div>
            </div>
          </section>

          <footer className="fis-section" style={{ marginTop: "24pt" }}>
            <div className="flex flex-wrap justify-between gap-8">
              <div className="flex-1" style={{ minWidth: "40%" }}>
                <div
                  className="border-b border-black"
                  style={{ minHeight: "36pt", marginBottom: "4pt" }}
                />
                <div className="text-center text-xs">Müşteri İmzası</div>
              </div>
              <div className="flex-1" style={{ minWidth: "40%" }}>
                <div
                  className="border-b border-black"
                  style={{ minHeight: "36pt", marginBottom: "4pt" }}
                />
                <div className="text-center text-xs">Yetkili İmzası</div>
              </div>
            </div>
            <p
              className="text-center text-xs text-black"
              style={{ marginTop: "16pt", opacity: 0.85 }}
            >
              Bu fiş teknik servis kaydınızın belgesidir.
            </p>
          </footer>
        </div>
      ) : null}
    </>
  );
}
