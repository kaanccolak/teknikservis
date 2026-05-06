"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatServiceOrderNo } from "@/lib/service-order-number";
import {
  SERVICE_ORDER_STATUS_OPTIONS,
  SERVICE_ORDER_STATUS_VALUES,
  serviceOrderStatusLabel,
} from "@/lib/service-order-status";
import { getStatusBadge } from "@/lib/statusConfig";

const nativeSelectClassName =
  "h-8 w-full min-w-[11rem] rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

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

type IdName = { id: string; name: string };

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

function csvEscape(cell: string) {
  if (/[",\n\r]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

function yyyymmFileSuffix(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function CihazSorgulaInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParam = searchParams.get("search") || "";
  const statusParam = searchParams.get("status") || "all";
  const hideDeliveredParam = searchParams.get("hideDelivered");
  const hideDelivered = hideDeliveredParam !== "false";
  const initialStatus =
    statusParam !== "all" && SERVICE_ORDER_STATUS_VALUES.has(statusParam)
      ? statusParam
      : "all";

  const [search, setSearch] = useState(searchParam);
  const [debouncedSearch, setDebouncedSearch] = useState(
    () => searchParam.trim(),
  );
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [hideCompleted, setHideCompleted] = useState(hideDelivered);
  const [deviceTypes, setDeviceTypes] = useState<IdName[]>([]);
  const [brands, setBrands] = useState<IdName[]>([]);
  const [models, setModels] = useState<IdName[]>([]);
  const [orders, setOrders] = useState<ServiceOrderListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (statusParam && SERVICE_ORDER_STATUS_VALUES.has(statusParam)) {
      setStatusFilter(statusParam);
    } else {
      setStatusFilter("all");
    }
  }, [statusParam]);

  useEffect(() => {
    setSearch(searchParam);
    setDebouncedSearch(searchParam.trim());
  }, [searchParam]);

  useEffect(() => {
    setHideCompleted(hideDelivered);
  }, [hideDelivered]);

  const deviceTypeFilter = searchParams.get("deviceType") || "";
  const brandFilter = searchParams.get("brand") || "";
  const modelFilter = searchParams.get("model") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/device-types")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setDeviceTypes(Array.isArray(data) ? (data as IdName[]) : []);
      })
      .catch(() => {
        if (!cancelled) setDeviceTypes([]);
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
    const t = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setHideCompleted(true);
    router.replace(pathname);
  }, [pathname, router]);

  const loadOrders = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (hideCompleted) params.set("hideDelivered", "true");
      if (deviceTypeFilter) params.set("deviceTypeId", deviceTypeFilter);
      if (brandFilter) params.set("brandId", brandFilter);
      if (modelFilter) params.set("deviceModelId", modelFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/service-orders?${params.toString()}`);
      const data = (await res.json()) as ServiceOrderListResponse | { error?: string };
      if (!res.ok) {
        setError(
          typeof data === "object" && data && "error" in data
            ? String((data as { error: string }).error)
            : "Kayıtlar yüklenemedi",
        );
        setOrders([]);
        setTotal(0);
        return;
      }
      setOrders((data as ServiceOrderListResponse).orders);
      setTotal((data as ServiceOrderListResponse).total);
    } catch {
      setError("Bağlantı hatası");
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    statusFilter,
    hideCompleted,
    deviceTypeFilter,
    brandFilter,
    modelFilter,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  function exportCsv() {
    const headers = [
      "Kayıt No",
      "Müşteri Adı",
      "Telefon",
      "Geliş Tarihi",
      "Cihaz Türü",
      "Marka",
      "Model",
      "Seri No",
      "Durum",
    ];
    const lines = [
      headers.map(csvEscape).join(","),
      ...orders.map((r) =>
        [
          csvEscape(formatServiceOrderNo(r)),
          csvEscape(r.customer.name),
          csvEscape(r.customer.phone ?? ""),
          csvEscape(formatArrivedAt(r.arrivedAt)),
          csvEscape(r.deviceType?.name ?? r.deviceTypeName ?? ""),
          csvEscape(r.brand?.name ?? r.brandName ?? ""),
          csvEscape(r.deviceModel?.name ?? r.modelName ?? ""),
          csvEscape(r.serialNo ?? ""),
          csvEscape(serviceOrderStatusLabel(r.status)),
        ].join(","),
      ),
    ];
    const bom = "\uFEFF";
    const blob = new Blob([bom + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `servis-kayitlari-${yyyymmFileSuffix(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasAdvancedFilters =
    Boolean(deviceTypeFilter) ||
    Boolean(brandFilter) ||
    Boolean(modelFilter) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

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
        <h1 className="text-2xl font-semibold text-slate-900">Cihaz Sorgula</h1>
        <p className="mt-1 text-sm text-slate-600">
          Servis kayıtlarında müşteri, telefon veya kayıt numarası ile arayın.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="search" className="sr-only">
            Arama
          </Label>
          <Input
            id="search"
            type="search"
            placeholder="Müşteri adı, telefon, kayıt no veya seri no ara..."
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              updateURL({ search: value });
            }}
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="status-filter" className="text-xs text-slate-600">
              Durum
            </Label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                const value = e.target.value;
                setStatusFilter(value);
                updateURL({ status: value });
              }}
              className={nativeSelectClassName}
            >
              <option value="all">Hepsi</option>
              {SERVICE_ORDER_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 pb-1.5 sm:pb-2">
            <Checkbox
              checked={hideCompleted}
              onCheckedChange={(c) => {
                const value = c === true;
                setHideCompleted(value);
                updateURL({ hideDelivered: String(value) });
              }}
            />
            <span className="text-sm font-medium text-slate-700">
              Tamamlananları gizle
            </span>
          </label>
        </div>
        <div className="flex flex-col items-end gap-2 lg:ml-auto">
          <span className="text-sm text-gray-500">
            {search.trim() ||
            statusFilter !== "all" ||
            hasAdvancedFilters
              ? `${total} sonuç bulundu`
              : `Toplam ${total} kayıt`}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={exportCsv}
            disabled={orders.length === 0}
          >
            Excel&apos;e Aktar
          </Button>
        </div>
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

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="relative overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm">
        {loading ? (
          <div
            className="flex items-center justify-center gap-2 py-20 text-slate-600"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="size-6 animate-spin" aria-hidden />
            <span>Yükleniyor…</span>
          </div>
        ) : orders.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-600">
            Kayıt bulunamadı
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
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
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Cihaz Türü
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Marka
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Model
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Seri No
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Durum
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((row, i) => {
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
                    <td className="px-3 py-2.5 text-slate-800">
                      {row.customer.name}
                    </td>
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
                    <td className="max-w-[140px] truncate px-3 py-2.5 text-slate-700">
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

export default function CihazSorgulaPage() {
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
      <CihazSorgulaInner />
    </Suspense>
  );
}
