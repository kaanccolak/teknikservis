"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatServiceOrderNo } from "@/lib/service-order-number";
import {
  SERVICE_ORDER_STATUS_OPTIONS,
  SERVICE_ORDER_STATUS_VALUES,
  serviceOrderStatusBadgeClass,
  serviceOrderStatusLabel,
} from "@/lib/service-order-status";

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
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const searchParam = searchParams.get("search");
  const hideCompletedParam = searchParams.get("hideCompleted");

  const initialStatus =
    statusParam && SERVICE_ORDER_STATUS_VALUES.has(statusParam)
      ? statusParam
      : "all";

  const [search, setSearch] = useState(searchParam ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(
    () => (searchParam ?? "").trim(),
  );
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [hideCompleted, setHideCompleted] = useState(
    hideCompletedParam === "false" ? false : true,
  );
  const [orders, setOrders] = useState<ServiceOrderListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (statusParam && SERVICE_ORDER_STATUS_VALUES.has(statusParam)) {
      setStatusFilter(statusParam);
    } else {
      setStatusFilter("all");
    }
  }, [statusParam]);

  useEffect(() => {
    const q = searchParam ?? "";
    setSearch(q);
    setDebouncedSearch(q.trim());
  }, [searchParam]);

  useEffect(() => {
    if (hideCompletedParam === "false") setHideCompleted(false);
    else if (hideCompletedParam === "true") setHideCompleted(true);
  }, [hideCompletedParam]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const loadOrders = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (hideCompleted) params.set("hideCompleted", "true");
      const res = await fetch(`/api/service-orders?${params.toString()}`);
      const data = (await res.json()) as ServiceOrderListRow[] | { error?: string };
      if (!res.ok) {
        setError(
          typeof data === "object" && data && "error" in data
            ? String((data as { error: string }).error)
            : "Kayıtlar yüklenemedi",
        );
        setOrders([]);
        return;
      }
      setOrders(data as ServiceOrderListRow[]);
    } catch {
      setError("Bağlantı hatası");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, hideCompleted]);

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

  function goDetail(id: string) {
    router.push(`/servis-detay/${encodeURIComponent(id)}`);
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
            placeholder="Müşteri adı, telefon veya kayıt no ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              onChange={(e) => setStatusFilter(e.target.value)}
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
              onCheckedChange={(c) => setHideCompleted(c === true)}
            />
            <span className="text-sm font-medium text-slate-700">
              Tamamlananları gizle
            </span>
          </label>
        </div>
        <div className="flex justify-end lg:ml-auto">
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
                {orders.map((row, i) => (
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
                        className={serviceOrderStatusBadgeClass(row.status)}
                      >
                        {serviceOrderStatusLabel(row.status)}
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
                ))}
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
