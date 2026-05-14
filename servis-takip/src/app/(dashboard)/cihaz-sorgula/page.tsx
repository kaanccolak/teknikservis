"use client";

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

const BarcodeScanner = dynamic(() => import("@/components/barcode-scanner"), {
  ssr: false,
});

import PageGuideModal from "@/components/onboarding/PageGuideModal";
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
  bayiId: string | null;
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
  const onlyBayiParam = searchParams.get("onlyBayi") === "true";
  const initialStatus =
    statusParam !== "all" && SERVICE_ORDER_STATUS_VALUES.has(statusParam)
      ? statusParam
      : "all";

  const [search, setSearch] = useState(searchParam);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [hideCompleted, setHideCompleted] = useState(hideDelivered);
  const [onlyBayi, setOnlyBayi] = useState(onlyBayiParam);
  const [showScanner, setShowScanner] = useState(false);
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
  }, [searchParam]);

  useEffect(() => {
    setHideCompleted(hideDelivered);
  }, [hideDelivered]);

  useEffect(() => {
    setOnlyBayi(onlyBayiParam);
  }, [onlyBayiParam]);

  const deviceTypeFilter = searchParams.get("deviceType") || "";
  const brandFilter = searchParams.get("brand") || "";
  const modelFilter = searchParams.get("model") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/device-types", { cache: "no-store" })
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
      { cache: "no-store" },
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
    void fetch(`/api/models?brandId=${encodeURIComponent(brandFilter)}`, {
      cache: "no-store",
    })
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

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setHideCompleted(true);
    setOnlyBayi(false);
    router.replace(pathname);
  }, [pathname, router]);

  useEffect(() => {
    const ac = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        setError(null);
        setLoading(true);
        try {
          const params = new URLSearchParams();
          const q = search.trim();
          if (q) params.set("search", q);
          if (statusFilter && statusFilter !== "all") {
            params.set("status", statusFilter);
          }
          if (hideCompleted) params.set("hideDelivered", "true");
          if (deviceTypeFilter) params.set("deviceTypeId", deviceTypeFilter);
          if (brandFilter) params.set("brandId", brandFilter);
          if (modelFilter) params.set("deviceModelId", modelFilter);
          if (dateFrom) params.set("dateFrom", dateFrom);
          if (dateTo) params.set("dateTo", dateTo);
          if (onlyBayi) params.set("onlyBayi", "true");
          const res = await fetch(`/api/service-orders?${params.toString()}`, {
            signal: ac.signal,
            cache: "no-store",
          });
          const data = (await res.json()) as
            | ServiceOrderListResponse
            | { error?: string };
          if (ac.signal.aborted) return;
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
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          if (!ac.signal.aborted) {
            setError("Bağlantı hatası");
            setOrders([]);
            setTotal(0);
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
    search,
    statusFilter,
    hideCompleted,
    deviceTypeFilter,
    brandFilter,
    modelFilter,
    dateFrom,
    dateTo,
    onlyBayi,
  ]);

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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Cihaz Sorgula</h1>
        <p className="mt-1 text-sm text-slate-600">
          Servis kayıtlarında müşteri, telefon veya kayıt numarası ile arayın.
        </p>
      </div>

      <div className="flex flex-col flex-wrap gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="search" className="sr-only">
            Arama
          </Label>
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              width: "100%",
            }}
          >
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
              className="w-full sm:w-auto"
            />
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              title="Barkod Okut"
              style={{
                padding: "8px 12px",
                flexShrink: 0,
                background: "#4f46e5",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <line x1="7" y1="12" x2="17" y2="12" />
                <line x1="12" y1="7" x2="12" y2="17" />
              </svg>
            </button>
          </div>
        </div>
        {showScanner ? (
          <BarcodeScanner
            onScan={(value) => {
              setSearch(value);
              updateURL({ search: value });
              setShowScanner(false);
            }}
            onClose={() => setShowScanner(false)}
          />
        ) : null}
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
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={onlyBayi}
            onChange={(e) => {
              const checked = e.target.checked;
              setOnlyBayi(checked);
              updateURL({ onlyBayi: checked ? "true" : "" });
            }}
          />
          Sadece Bayi Kayıtları
        </label>

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
          <div
            style={{
              overflowX: "auto",
              overflowY: "auto",
              maxHeight: "600px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
                textAlign: "left",
              }}
            >
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  background: "white",
                  zIndex: 1,
                }}
              >
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th
                    className="font-medium text-slate-700"
                    style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                  >
                    Kayıt No
                  </th>
                  <th
                    className="font-medium text-slate-700"
                    style={{
                      padding: "8px 6px",
                      whiteSpace: "nowrap",
                      maxWidth: "120px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    Müşteri Adı
                  </th>
                  <th
                    className="font-medium text-slate-700"
                    style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                  >
                    Telefon
                  </th>
                  <th
                    className="font-medium text-slate-700"
                    style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                  >
                    Geliş Tarihi
                  </th>
                  <th
                    className="font-medium text-slate-700"
                    style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                  >
                    Cihaz Türü
                  </th>
                  <th
                    className="font-medium text-slate-700"
                    style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                  >
                    Marka
                  </th>
                  <th
                    className="font-medium text-slate-700"
                    style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                  >
                    Model
                  </th>
                  <th
                    className="font-medium text-slate-700"
                    style={{
                      padding: "8px 6px",
                      whiteSpace: "nowrap",
                      maxWidth: "100px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    Seri No
                  </th>
                  <th
                    className="font-medium text-slate-700"
                    style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                  >
                    Durum
                  </th>
                  <th
                    className="font-medium text-slate-700"
                    style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                  >
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((row, i) => {
                  const statusBadge = getStatusBadge(row.status);
                  const rowStyle = {
                    borderLeft: row.bayiId
                      ? "3px solid #8B5CF6"
                      : "3px solid transparent",
                    background: row.bayiId
                      ? "#F5F3FF"
                      : i % 2 === 0
                        ? "white"
                        : "#f8fafc80",
                  };
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
                    style={rowStyle}
                  >
                    <td
                      className="font-medium text-slate-900"
                      style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                    >
                      {formatServiceOrderNo(row)}
                      {row.bayiId && (
                        <span
                          style={{
                            background: "#EDE9FE",
                            color: "#7C3AED",
                            fontSize: "10px",
                            fontWeight: "600",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            marginLeft: "6px",
                          }}
                        >
                          BAYI
                        </span>
                      )}
                    </td>
                    <td
                      className="text-slate-800"
                      style={{
                        padding: "8px 6px",
                        whiteSpace: "nowrap",
                        maxWidth: "120px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {row.customer.name}
                    </td>
                    <td
                      className="text-slate-700"
                      style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                    >
                      {row.customer.phone ?? "—"}
                    </td>
                    <td
                      className="text-slate-700"
                      style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                    >
                      {formatArrivedAt(row.arrivedAt)}
                    </td>
                    <td
                      className="text-slate-700"
                      style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                    >
                      {row.deviceType?.name ?? row.deviceTypeName ?? "—"}
                    </td>
                    <td
                      className="text-slate-700"
                      style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                    >
                      {row.brand?.name ?? row.brandName ?? "—"}
                    </td>
                    <td
                      className="text-slate-700"
                      style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                    >
                      {row.deviceModel?.name ?? row.modelName ?? "—"}
                    </td>
                    <td
                      className="text-slate-700"
                      style={{
                        padding: "8px 6px",
                        maxWidth: "100px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.noSerialNo ? "—" : (row.serialNo ?? "—")}
                    </td>
                    <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
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
                    <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
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
    <>
      <PageGuideModal
        pageKey="cihaz_sorgula"
        icon="🔍"
        title="Cihaz Sorgula"
        description="Tüm servis kayıtlarınızı görüntüleyin, filtreleyin ve yönetin. Kayıt durumlarını buradan güncelleyin."
        tips={[
          "Durum butonlarıyla kayıtları filtreleyin — Bekliyor, Tamirde, Teslime Hazır ve daha fazlası",
          "Kayıt numarası veya müşteri adıyla anlık arama yapın",
          "Bir kayda tıklayarak detayına girin — durum güncelleyin, WhatsApp gönderin, fiş çıkartın",
          "Teslim edilecek cihazlar için teslim fişi oluşturun",
        ]}
      />
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
    </>
  );
}
