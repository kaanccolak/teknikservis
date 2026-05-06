"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatServiceOrderNo } from "@/lib/service-order-number";
import {
  SERVICE_ORDER_DELIVERED_STATUS_SET,
  SERVICE_ORDER_STATUS_OPTIONS,
} from "@/lib/service-order-status";
import { getStatusBadge } from "@/lib/statusConfig";

const nativeSelectClassName =
  "h-9 w-full min-w-[9rem] rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

/** Bu sayfada teslim edilmiş durumlar filtresi yok */
const STATUS_FILTER_OPTIONS = SERVICE_ORDER_STATUS_OPTIONS.filter(
  (o) => !SERVICE_ORDER_DELIVERED_STATUS_SET.has(o.value),
);

const STATUS_FILTER_VALUES = new Set<string>(
  STATUS_FILTER_OPTIONS.map((o) => o.value),
);

type IdName = { id: string; name: string };
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
type ServiceOrderListResponse = {
  orders: ServiceOrderListRow[];
  total: number;
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

function BekleyenCihazlarInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParam = searchParams.get("search") || "";
  const statusParam = searchParams.get("status") || "all";

  const statusFromUrl =
    statusParam !== "all" && STATUS_FILTER_VALUES.has(statusParam)
      ? statusParam
      : "all";

  const deviceTypeFilter = searchParams.get("deviceType") || "";
  const brandFilter = searchParams.get("brand") || "";
  const modelFilter = searchParams.get("model") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const [searchInput, setSearchInput] = useState(searchParam);
  const [deviceTypes, setDeviceTypes] = useState<IdName[]>([]);
  const [brands, setBrands] = useState<IdName[]>([]);
  const [models, setModels] = useState<IdName[]>([]);
  const [orders, setOrders] = useState<ServiceOrderListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);

  const updateURL = useCallback(
    (params: Record<string, string>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== "all") {
          current.set(key, value);
        } else {
          current.delete(key);
        }
      });
      const query = current.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/device-types")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setDeviceTypes(data as IdName[]);
          setMetaError(null);
        } else if (
          typeof data === "object" &&
          data &&
          "error" in data &&
          typeof (data as { error: string }).error === "string"
        ) {
          setDeviceTypes([]);
          setMetaError((data as { error: string }).error);
        } else {
          setDeviceTypes([]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDeviceTypes([]);
          setMetaError("Cihaz türleri yüklenemedi");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!deviceTypeFilter) {
      setBrands([]);
      return;
    }
    let cancelled = false;
    void fetch(
      `/api/brands?deviceTypeId=${encodeURIComponent(deviceTypeFilter)}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setBrands(Array.isArray(data) ? (data as IdName[]) : []);
      })
      .catch(() => {
        if (!cancelled) setBrands([]);
      });
    return () => {
      cancelled = true;
    };
  }, [deviceTypeFilter]);

  useEffect(() => {
    if (!brandFilter) {
      setModels([]);
      return;
    }
    let cancelled = false;
    void fetch(`/api/models?brandId=${encodeURIComponent(brandFilter)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setModels(Array.isArray(data) ? (data as IdName[]) : []);
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      });
    return () => {
      cancelled = true;
    };
  }, [brandFilter]);

  useEffect(() => {
    const ac = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        setListError(null);
        setLoading(true);
        try {
          const params = new URLSearchParams();
          params.set("hideDelivered", "true");
          const q = searchInput.trim();
          if (q) params.set("search", q);
          if (statusFromUrl && statusFromUrl !== "all") {
            params.set("status", statusFromUrl);
          }
          if (deviceTypeFilter) params.set("deviceTypeId", deviceTypeFilter);
          if (brandFilter) params.set("brandId", brandFilter);
          if (modelFilter) params.set("deviceModelId", modelFilter);
          if (dateFrom) params.set("dateFrom", dateFrom);
          if (dateTo) params.set("dateTo", dateTo);

          const res = await fetch(`/api/service-orders?${params.toString()}`, {
            signal: ac.signal,
          });
          const data = (await res.json()) as
            | ServiceOrderListResponse
            | { error?: string };
          if (ac.signal.aborted) return;
          if (!res.ok) {
            setListError(
              typeof data === "object" && data && "error" in data
                ? String((data as { error: string }).error)
                : "Kayıtlar yüklenemedi",
            );
            setOrders([]);
            return;
          }
          setOrders((data as ServiceOrderListResponse).orders);
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          if (!ac.signal.aborted) {
            setListError("Bağlantı hatası");
            setOrders([]);
          }
        } finally {
          if (!ac.signal.aborted) setLoading(false);
        }
      })();
    }, 300);
    return () => {
      ac.abort();
      window.clearTimeout(timer);
    };
  }, [
    searchInput,
    statusFromUrl,
    deviceTypeFilter,
    brandFilter,
    modelFilter,
    dateFrom,
    dateTo,
  ]);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    router.replace(pathname);
  }, [pathname, router]);

  const hasAdvancedFilters =
    Boolean(deviceTypeFilter) ||
    Boolean(brandFilter) ||
    Boolean(modelFilter) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const totalLabel = useMemo(() => {
    const n = orders.length;
    return `${n} cihaz listeleniyor`;
  }, [orders.length]);

  function goDetail(id: string) {
    const query = searchParams.toString();
    const currentUrl = query ? `${pathname}?${query}` : pathname;
    router.push(
      `/servis-detay/${encodeURIComponent(id)}?from=${encodeURIComponent(currentUrl)}`,
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Bekleyen Cihazlar</h1>
        <p className="mt-1 text-sm text-slate-600">
          Teslim edilmemiş kayıtlar. Durum, cihaz ve geliş tarihine göre süzebilirsiniz.
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
            onChange={(e) => {
              const value = e.target.value;
              setSearchInput(value);
              updateURL({ search: value });
            }}
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
              value={statusFromUrl}
              onChange={(e) => {
                const value = e.target.value;
                updateURL({ status: value });
              }}
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
        </div>
        <p className="shrink-0 text-sm font-medium text-slate-700 xl:ml-auto xl:text-right">
          {totalLabel}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "10px",
          flexWrap: "wrap",
        }}
      >
        <select
          aria-label="Cihaz türü"
          value={deviceTypeFilter}
          onChange={(e) => {
            const v = e.target.value;
            updateURL({ deviceType: v, brand: "", model: "" });
          }}
          style={{
            padding: "8px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            fontSize: "13px",
            minWidth: "150px",
          }}
        >
          <option value="">Tüm cihaz türleri</option>
          {deviceTypes.map((dt) => (
            <option key={dt.id} value={dt.id}>
              {dt.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Marka"
          value={brandFilter}
          onChange={(e) => {
            const v = e.target.value;
            updateURL({ brand: v, model: "" });
          }}
          disabled={!deviceTypeFilter}
          style={{
            padding: "8px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            fontSize: "13px",
            minWidth: "150px",
          }}
        >
          <option value="">Tüm markalar</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Model"
          value={modelFilter}
          onChange={(e) => {
            const v = e.target.value;
            updateURL({ model: v });
          }}
          disabled={!brandFilter}
          style={{
            padding: "8px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            fontSize: "13px",
            minWidth: "150px",
          }}
        >
          <option value="">Tüm modeller</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              color: "#6b7280",
              whiteSpace: "nowrap",
            }}
          >
            Geliş:
          </span>
          <input
            type="date"
            aria-label="Geliş tarihi başlangıç"
            value={dateFrom}
            onChange={(e) => {
              const v = e.target.value;
              updateURL({ dateFrom: v });
            }}
            style={{
              padding: "8px 10px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "13px",
            }}
          />
          <span style={{ fontSize: "12px", color: "#6b7280" }}>—</span>
          <input
            type="date"
            aria-label="Geliş tarihi bitiş"
            value={dateTo}
            onChange={(e) => {
              const v = e.target.value;
              updateURL({ dateTo: v });
            }}
            style={{
              padding: "8px 10px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "13px",
            }}
          />
        </div>

        {hasAdvancedFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            style={{
              padding: "8px 14px",
              border: "1px solid #fca5a5",
              borderRadius: "6px",
              fontSize: "13px",
              color: "#ef4444",
              background: "#fef2f2",
              cursor: "pointer",
            }}
          >
            Filtreleri temizle ✕
          </button>
        ) : null}
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
                  const statusBadge = getStatusBadge(row.status);
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
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "500",
                            background: statusBadge.bg,
                            color: statusBadge.color,
                            border: `1px solid ${statusBadge.border}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {statusBadge.label}
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

export default function BekleyenCihazlarPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex items-center justify-center gap-2 py-24 text-slate-600"
          role="status"
        >
          <Loader2 className="size-6 animate-spin" aria-hidden />
          <span>Yükleniyor…</span>
        </div>
      }
    >
      <BekleyenCihazlarInner />
    </Suspense>
  );
}
