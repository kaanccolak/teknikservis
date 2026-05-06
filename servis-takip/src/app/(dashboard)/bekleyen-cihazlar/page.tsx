"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatServiceOrderNo } from "@/lib/service-order-number";
import {
  SERVICE_ORDER_STATUS_OPTIONS,
  serviceOrderStatusBadgeClass,
  serviceOrderStatusLabel,
} from "@/lib/service-order-status";

const nativeSelectClassName =
  "h-9 w-full min-w-[9rem] rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

/** Bu sayfada "Teslim Edildi" filtresi yok */
const STATUS_FILTER_OPTIONS = SERVICE_ORDER_STATUS_OPTIONS.filter(
  (o) => o.value !== "delivered",
);

type IdName = { id: string; name: string; deviceTypeId?: string };
type Customer = { name: string; phone: string | null };
type Named = { name: string };

type ServiceOrderListRow = {
  id: string;
  orderNumber: string | null;
  arrivedAt: string;
  serialNo: string | null;
  noSerialNo: boolean;
  status: string;
  deviceTypeName: string | null;
  brandName: string | null;
  modelName: string | null;
  customer: Customer;
  deviceType: Named | null;
  brand: Named | null;
  deviceModel: Named | null;
};

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

/** Geliş tarihinden bugüne tam gün sayısı (yerel takvim) */
function waitingCalendarDays(arrivedAtIso: string): number {
  const arrived = new Date(arrivedAtIso);
  if (Number.isNaN(arrived.getTime())) return 0;
  const today = new Date();
  const a = new Date(
    arrived.getFullYear(),
    arrived.getMonth(),
    arrived.getDate(),
  );
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(
    0,
    Math.round((t.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)),
  );
}

function waitingDaysClass(days: number): string {
  if (days <= 3) {
    return "text-emerald-700 font-semibold tabular-nums";
  }
  if (days <= 7) {
    return "text-orange-700 font-semibold tabular-nums";
  }
  return "text-red-700 font-semibold tabular-nums";
}

export default function BekleyenCihazlarPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deviceTypeId, setDeviceTypeId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [deviceTypes, setDeviceTypes] = useState<IdName[]>([]);
  const [brands, setBrands] = useState<IdName[]>([]);
  const [orders, setOrders] = useState<ServiceOrderListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadMeta = useCallback(async () => {
    setMetaError(null);
    try {
      const [dtRes, brRes] = await Promise.all([
        fetch("/api/device-types"),
        fetch("/api/brands"),
      ]);
      const dtJson = (await dtRes.json()) as IdName[] | { error?: string };
      const brJson = (await brRes.json()) as IdName[] | { error?: string };
      if (!dtRes.ok) {
        setMetaError(
          typeof dtJson === "object" && dtJson && "error" in dtJson
            ? String((dtJson as { error: string }).error)
            : "Cihaz türleri alınamadı",
        );
        setDeviceTypes([]);
      } else {
        setDeviceTypes(dtJson as IdName[]);
      }
      if (!brRes.ok) {
        const brMsg =
          typeof brJson === "object" && brJson && "error" in brJson
            ? String((brJson as { error: string }).error)
            : "Markalar alınamadı";
        setMetaError((prev) => (prev ? `${prev} ${brMsg}` : brMsg));
        setBrands([]);
      } else {
        setBrands(brJson as IdName[]);
      }
    } catch {
      setMetaError("Tanım listeleri yüklenemedi");
      setDeviceTypes([]);
      setBrands([]);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  const loadOrders = useCallback(async () => {
    setListError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("hideDelivered", "true");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (deviceTypeId) params.set("deviceTypeId", deviceTypeId);
      if (brandId) params.set("brandId", brandId);

      const res = await fetch(`/api/service-orders?${params.toString()}`);
      const data = (await res.json()) as
        | ServiceOrderListRow[]
        | { error?: string };
      if (!res.ok) {
        setListError(
          typeof data === "object" && data && "error" in data
            ? String((data as { error: string }).error)
            : "Kayıtlar yüklenemedi",
        );
        setOrders([]);
        return;
      }
      setOrders(data as ServiceOrderListRow[]);
    } catch {
      setListError("Bağlantı hatası");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, deviceTypeId, brandId]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const totalLabel = useMemo(() => {
    const n = orders.length;
    return `${n} cihaz listeleniyor`;
  }, [orders.length]);

  function goDetail(id: string) {
    router.push(`/servis-detay/${encodeURIComponent(id)}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Bekleyen Cihazlar</h1>
        <p className="mt-1 text-sm text-slate-600">
          Teslim edilmemiş kayıtlar. Durum, cihaz türü ve markaya göre süzebilirsiniz.
        </p>
      </div>

      {metaError ? (
        <p className="text-sm text-amber-800" role="status">
          {metaError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">
        <div className="min-w-0 flex-1 space-y-1.5 xl:min-w-[200px]">
          <Label htmlFor="svc-search" className="sr-only">
            Arama
          </Label>
          <Input
            id="svc-search"
            type="search"
            placeholder="Müşteri adı, telefon veya kayıt no ara..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-1 xl:flex-wrap xl:items-end xl:gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="svc-status" className="text-xs text-slate-600">
              Durum
            </Label>
            <select
              id="svc-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={nativeSelectClassName}
            >
              <option value="all">Hepsi</option>
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="svc-dt" className="text-xs text-slate-600">
              Cihaz türü
            </Label>
            <select
              id="svc-dt"
              value={deviceTypeId}
              onChange={(e) => {
                setDeviceTypeId(e.target.value);
                setBrandId("");
              }}
              className={nativeSelectClassName}
            >
              <option value="">Hepsi</option>
              {deviceTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="svc-brand" className="text-xs text-slate-600">
              Marka
            </Label>
            <select
              id="svc-brand"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className={nativeSelectClassName}
            >
              <option value="">Hepsi</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="shrink-0 text-sm font-medium text-slate-700 xl:ml-auto xl:text-right">
          {totalLabel}
        </p>
      </div>

      {listError ? (
        <p className="text-sm text-destructive" role="alert">
          {listError}
        </p>
      ) : null}

      <div className="relative overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm">
        {loading ? (
          <div
            className="flex items-center justify-center gap-2 py-20 text-slate-600"
            role="status"
          >
            <Loader2 className="size-6 animate-spin" aria-hidden />
            <span>Yükleniyor…</span>
          </div>
        ) : orders.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-600">
            Bekleyen cihaz bulunamadı
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Kayıt No
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Müşteri Adı
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Telefon
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Geliş Tarihi
                  </th>
                  <th className="px-3 py-3 font-medium text-slate-700">Cihaz Türü</th>
                  <th className="px-3 py-3 font-medium text-slate-700">Marka</th>
                  <th className="px-3 py-3 font-medium text-slate-700">Model</th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Seri No
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Durum
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Bekleme Süresi
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((row, i) => {
                  const days = waitingCalendarDays(row.arrivedAt);
                  return (
                    <tr
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => goDetail(row.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          goDetail(row.id);
                        }
                      }}
                      className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-100/80 focus-visible:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                        i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      }`}
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 font-medium text-slate-900">
                        {formatServiceOrderNo(row)}
                      </td>
                      <td className="px-3 py-2.5 text-slate-800">{row.customer.name}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                        {row.customer.phone ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                        {formatArrivedAt(row.arrivedAt)}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {row.deviceType?.name ?? row.deviceTypeName ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {row.brand?.name ?? row.brandName ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {row.deviceModel?.name ?? row.modelName ?? "—"}
                      </td>
                      <td className="max-w-[120px] truncate px-3 py-2.5 text-slate-700">
                        {row.noSerialNo ? "—" : (row.serialNo ?? "—")}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span
                          className={serviceOrderStatusBadgeClass(row.status)}
                        >
                          {serviceOrderStatusLabel(row.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className={waitingDaysClass(days)}>
                          {days} gün
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="pointer-events-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            goDetail(row.id);
                          }}
                        >
                          Detay
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
