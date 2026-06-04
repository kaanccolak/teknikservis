"use client";

import { Check, Loader2, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const BarcodeScanner = dynamic(() => import("@/components/barcode-scanner"), {
  ssr: false,
});

import PageGuideModal from "@/components/onboarding/PageGuideModal";
import YetkiYok from "@/components/YetkiYok";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTrNationalDisplay, trPhoneDigitsOnly } from "@/lib/tr-phone";
import { usePersonelYetki } from "@/hooks/usePersonelYetki";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  deviceCode: string;
  sellerName: string;
  sellerPhone: string | null;
  serialNo: string | null;
  noSerialNo: boolean;
  hasInvoice: boolean;
  hasWarranty: boolean;
  hasBox: boolean;
  purchasePrice: number;
  createdAt: string;
  purchasedAt: string | null;
  isSold: boolean;
  soldAt: string | null;
  deviceType: { name: string } | null;
  brand: { name: string } | null;
  deviceModel: { name: string } | null;
};

type IdName = { id: string; name: string };

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

function IkinciElInner() {
  const { yetkiVar } = usePersonelYetki();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParam = searchParams.get("search") ?? "";
  const soldParamRaw = searchParams.get("sold") ?? "";
  const statusFilter: "all" | "stock" | "sold" =
    soldParamRaw === "stock" || soldParamRaw === "sold" ? soldParamRaw : "all";

  const deviceTypeFilter = searchParams.get("deviceType") || "";
  const brandFilter = searchParams.get("brand") || "";
  const modelFilter = searchParams.get("model") || "";

  const [search, setSearch] = useState(searchParam);
  const [showScanner, setShowScanner] = useState(false);
  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeletePasswordModal, setShowDeletePasswordModal] =
    useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");
  const [deletingWithPassword, setDeletingWithPassword] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [hasSettingsPassword, setHasSettingsPassword] = useState<
    boolean | null
  >(null);
  const [deviceTypes, setDeviceTypes] = useState<IdName[]>([]);
  const [brands, setBrands] = useState<IdName[]>([]);
  const [models, setModels] = useState<IdName[]>([]);
  const [metaError, setMetaError] = useState<string | null>(null);

  useEffect(() => {
    setSearch(searchParam);
  }, [searchParam]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/shop/settings-password")
      .then((r) => r.json())
      .then((j: { hasPassword?: boolean }) => {
        if (!cancelled) setHasSettingsPassword(!!j.hasPassword);
      })
      .catch(() => {
        if (!cancelled) setHasSettingsPassword(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const replaceQuery = useCallback(
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

  const setStatusFilter = useCallback(
    (v: "all" | "stock" | "sold") => {
      const p = new URLSearchParams(searchParams.toString());
      if (v === "all") p.delete("sold");
      else p.set("sold", v);
      const s = p.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const fetchSecondHand = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const q = search.trim();
      if (q) params.set("search", q);
      if (statusFilter !== "all") params.set("sold", statusFilter);
      if (deviceTypeFilter) params.set("deviceTypeId", deviceTypeFilter);
      if (brandFilter) params.set("brandId", brandFilter);
      if (modelFilter) params.set("deviceModelId", modelFilter);
      const res = await fetch(`/api/second-hand?${params}`, { cache: "no-store" });
      const data = (await res.json()) as
        | { items?: Row[]; total?: number; error?: string; details?: string }
        | { error: string; details?: string };
      if (!res.ok) {
        setItems([]);
        setTotal(0);
        const msg =
          "error" in data && typeof data.error === "string"
            ? data.error
            : "Kayıtlar yüklenemedi";
        const details =
          "details" in data && typeof data.details === "string"
            ? data.details
            : undefined;
        setError(details ? `${msg}: ${details}` : msg);
        return;
      }
      setItems((data as { items: Row[] }).items ?? []);
      setTotal((data as { total: number }).total ?? 0);
    } catch {
      setError("Bağlantı hatası");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, deviceTypeFilter, brandFilter, modelFilter]);

  useEffect(() => {
    void fetchSecondHand();
  }, [fetchSecondHand]);

  async function ensureHasSettingsPassword(): Promise<boolean> {
    try {
      const r = await fetch("/api/shop/settings-password");
      const j = (await r.json()) as { hasPassword?: boolean; error?: string };
      if (!r.ok) {
        setHasSettingsPassword(false);
        return false;
      }
      const v = !!j.hasPassword;
      setHasSettingsPassword(v);
      return v;
    } catch {
      setHasSettingsPassword(false);
      return false;
    }
  }

  async function runSecondHandDelete(
    settingsPassword: string,
    id?: string,
    _force?: boolean,
  ) {
    const deleteId = id ?? pendingDeleteId;
    void _force;
    if (!deleteId) return;
    setDeletingWithPassword(true);
    setDeletePasswordError("");
    try {
      const res = await fetch(`/api/second-hand/${deleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settingsPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        if (res.status === 403) {
          setDeletePasswordError(data.error ?? "Parola yanlış");
          return;
        }
        toast.error(data.error ?? "Silinemedi");
        return;
      }
      setShowDeletePasswordModal(false);
      setDeletePassword("");
      setPendingDeleteId(null);
      setDeleteId(null);
      toast.success("Silindi");
      await new Promise((r) => setTimeout(r, 500));
      await fetchSecondHand();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setDeletingWithPassword(false);
    }
  }

  async function confirmDeleteWithPassword() {
    if (hasSettingsPassword !== false && !deletePassword.trim()) {
      setDeletePasswordError("Parola girin");
      return;
    }
    await runSecondHandDelete(
      hasSettingsPassword === false ? "" : deletePassword,
    );
  }

  const totalLabel = useMemo(
    () => `${total} kayıt`,
    [total],
  );

  const hasAdvancedFilters =
    Boolean(deviceTypeFilter) ||
    Boolean(brandFilter) ||
    Boolean(modelFilter);

  const clearDeviceFilters = useCallback(() => {
    replaceQuery({ deviceType: "", brand: "", model: "" });
  }, [replaceQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            İkinci el cihazlar
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Satın alınan ikinci el cihaz kayıtları
          </p>
        </div>
        {yetkiVar("canCreateRecord") && (
          <Link
            href="/cihaz-kayit?mode=secondhand"
            className={cn(
              buttonVariants({ size: "default" }),
              "shrink-0 bg-violet-600 text-white hover:bg-violet-700",
            )}
          >
            Yeni kayıt ekle
          </Link>
        )}
      </div>

      {metaError ? (
        <p className="text-sm text-amber-800" role="status">
          {metaError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-md flex-1">
            <label htmlFor="sh-search" className="sr-only">
              Ara
            </label>
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Input
                id="sh-search"
                type="search"
                placeholder="Satıcı, telefon, kod, cihaz veya seri no ara..."
                value={search}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearch(v);
                  replaceQuery({ search: v.trim() });
                }}
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
                replaceQuery({ search: value.trim() });
                setShowScanner(false);
              }}
              onClose={() => setShowScanner(false)}
            />
          ) : null}
          <p className="text-sm font-medium text-slate-600">{totalLabel}</p>
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Durum filtresi"
        >
          <Button
            type="button"
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            className={
              statusFilter === "all"
                ? "bg-slate-800 text-white hover:bg-slate-900"
                : ""
            }
            onClick={() => setStatusFilter("all")}
          >
            Tümü
          </Button>
          <Button
            type="button"
            size="sm"
            variant={statusFilter === "stock" ? "default" : "outline"}
            className={
              statusFilter === "stock"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : ""
            }
            onClick={() => setStatusFilter("stock")}
          >
            Stokta
          </Button>
          <Button
            type="button"
            size="sm"
            variant={statusFilter === "sold" ? "default" : "outline"}
            className={
              statusFilter === "sold"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : ""
            }
            onClick={() => setStatusFilter("sold")}
          >
            Satıldı
          </Button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "4px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <select
            aria-label="Cihaz türü"
            value={deviceTypeFilter}
            onChange={(e) => {
              const v = e.target.value;
              replaceQuery({ deviceType: v, brand: "", model: "" });
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
              replaceQuery({ brand: v, model: "" });
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
              replaceQuery({ model: e.target.value });
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

          {hasAdvancedFilters ? (
            <button
              type="button"
              onClick={clearDeviceFilters}
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
              Cihaz filtresini temizle ✕
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="relative overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-600">
            <Loader2 className="size-6 animate-spin" aria-hidden />
            <span>Yükleniyor…</span>
          </div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-600">
            Kayıt bulunamadı
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[1180px]"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "var(--app-font-size, 12px)",
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
                    Kayıt kodu
                  </th>
                  <th
                    className="font-medium text-slate-700"
                    style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                  >
                    Durum
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
                    Satıcı adı
                  </th>
                  <th
                    className="font-medium text-slate-700"
                    style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                  >
                    Telefon
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
                    Cihaz
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
                    Seri no
                  </th>
                  <th
                    className="font-medium text-slate-700"
                    style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                  >
                    Fatura
                  </th>
                  <th
                    className="font-medium text-slate-700"
                    style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                  >
                    Garanti
                  </th>
                  <th
                    className="font-medium text-slate-700"
                    style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                  >
                    Kutu
                  </th>
                  <th
                    className="font-medium text-slate-700"
                    style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                  >
                    Satın alım
                  </th>
                  <th
                    className="font-medium text-slate-700"
                    style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                  >
                    Tarih
                  </th>
                  <th
                    className="font-medium text-slate-700"
                    style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                  >
                    Satış tarihi
                  </th>
                  <th
                    className="font-medium text-slate-700"
                    style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                  >
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, i) => (
                  <tr
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/ikinci-el/${row.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/ikinci-el/${row.id}`);
                      }
                    }}
                    className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-100/80 focus-visible:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    }`}
                  >
                    <td
                      className="font-medium text-slate-900"
                      style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                    >
                      {row.deviceCode}
                    </td>
                    <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                      {row.isSold ? (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontSize: "calc(var(--app-font-size, 12px) * 0.92)",
                            fontWeight: "500",
                            background: "#d1fae5",
                            color: "#065f46",
                            border: "1px solid #6ee7b7",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Satıldı
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontSize: "calc(var(--app-font-size, 12px) * 0.92)",
                            fontWeight: "500",
                            background: "#dbeafe",
                            color: "#1e40af",
                            border: "1px solid #93c5fd",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Stokta
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
                      {row.sellerName}
                    </td>
                    <td
                      className="text-slate-700"
                      style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                    >
                      {formatPhone(row.sellerPhone)}
                    </td>
                    <td
                      className="text-slate-700"
                      style={{
                        padding: "8px 6px",
                        whiteSpace: "nowrap",
                        maxWidth: "120px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {row.deviceModel?.name ?? "—"}
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
                    <td style={{ padding: "8px 6px", textAlign: "center" }}>
                      {row.hasInvoice ? (
                        <Check className="mx-auto size-5 text-emerald-600" aria-label="Var" />
                      ) : (
                        <X className="mx-auto size-5 text-red-500" aria-label="Yok" />
                      )}
                    </td>
                    <td style={{ padding: "8px 6px", textAlign: "center" }}>
                      {row.hasWarranty ? (
                        <Check className="mx-auto size-5 text-emerald-600" aria-label="Var" />
                      ) : (
                        <X className="mx-auto size-5 text-red-500" aria-label="Yok" />
                      )}
                    </td>
                    <td style={{ padding: "8px 6px", textAlign: "center" }}>
                      {row.hasBox ? (
                        <Check className="mx-auto size-5 text-emerald-600" aria-label="Var" />
                      ) : (
                        <X className="mx-auto size-5 text-red-500" aria-label="Yok" />
                      )}
                    </td>
                    <td
                      className="font-medium text-slate-900"
                      style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                    >
                      {formatTry(row.purchasePrice)}
                    </td>
                    <td
                      className="text-slate-700"
                      style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                    >
                      {(() => {
                        const d = new Date(row.purchasedAt ?? row.createdAt);
                        const pad = (n: number) => String(n).padStart(2, "0");
                        return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
                      })()}
                    </td>
                    <td
                      className="text-slate-700"
                      style={{ padding: "8px 6px", whiteSpace: "nowrap" }}
                    >
                      {row.isSold && row.soldAt
                        ? (() => {
                            const d = new Date(row.soldAt!);
                            const pad = (n: number) => String(n).padStart(2, "0");
                            return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
                          })()
                        : "—"}
                    </td>
                    <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                      <div className="flex flex-wrap gap-1.5">
                        <Link
                          href={`/ikinci-el/${row.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "pointer-events-auto",
                          )}
                        >
                          Detay
                        </Link>
                        {yetkiVar("canEditIkinciEl") && (
                          <Link
                            href={`/ikinci-el/${row.id}/duzenle`}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "pointer-events-auto",
                            )}
                          >
                            Düzenle
                          </Link>
                        )}
                        {yetkiVar("canDeleteIkinciEl") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="pointer-events-auto text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(row.id);
                            }}
                          >
                            Sil
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kaydı silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. İkinci el cihaz kaydı kalıcı olarak silinir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                void (async () => {
                  if (!deleteId) return;
                  const idToDelete = deleteId;
                  const forceDelete = false;
                  setDeleteId(null);
                  let hp = hasSettingsPassword;
                  if (hp === null) {
                    hp = await ensureHasSettingsPassword();
                  }
                  if (!hp) {
                    await runSecondHandDelete("", idToDelete, forceDelete);
                    return;
                  }
                  setPendingDeleteId(idToDelete);
                  setShowDeletePasswordModal(true);
                })();
              }}
            >
              Evet, sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showDeletePasswordModal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "32px",
              width: "100%",
              maxWidth: "380px",
              margin: "0 16px",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                textAlign: "center",
                marginBottom: "12px",
              }}
            >
              🗑️
            </div>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 600,
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              Silme İşlemi
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              Bu işlemi onaylamak için yönetici parolasını girin
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && void confirmDeleteWithPassword()
              }
              placeholder="Yönetici parolası"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: deletePasswordError
                  ? "1px solid #fca5a5"
                  : "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: "8px",
              }}
              autoFocus
            />
            {deletePasswordError ? (
              <p
                style={{
                  fontSize: "12px",
                  color: "#dc2626",
                  marginBottom: "8px",
                }}
              >
                {deletePasswordError}
              </p>
            ) : null}
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => void confirmDeleteWithPassword()}
                disabled={deletingWithPassword}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                {deletingWithPassword ? "Siliniyor..." : "Sil"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeletePasswordModal(false);
                  setDeletePassword("");
                  setDeletePasswordError("");
                  setPendingDeleteId(null);
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "white",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function IkinciElPage() {
  const [yetkiVar, setYetkiVar] = useState(true);

  useEffect(() => {
    const isAdmin = sessionStorage.getItem("activePersonnelIsAdmin");
    if (isAdmin === null || isAdmin === "true") return;
    const permsRaw = sessionStorage.getItem("activePersonnelPermissions");
    if (!permsRaw) {
      setYetkiVar(false);
      return;
    }
    try {
      const perms = JSON.parse(permsRaw) as Record<string, boolean>;
      setYetkiVar(!!perms.canViewIkinciEl);
    } catch {
      setYetkiVar(false);
    }
  }, []);

  if (!yetkiVar) return <YetkiYok />;

  return (
    <>
      <PageGuideModal
        pageKey="ikinci_el"
        icon="♻️"
        title="İkinci El Cihazlar"
        description="Müşterilerden satın aldığınız veya elinizde bulunan ikinci el cihazları yönetin. Alım/satım kar zarar takibi otomatik yapılır."
        tips={[
          "Alış fiyatı ve cihaz bilgilerini kaydedin",
          "Satıldığında satış fiyatını girerek anlık kar/zarar görün",
          "Raporlar sayfasında ikinci el ciro ve karlılık takibi yapın",
          "Alış ve satış nüshaları çıkartarak müşterilere teslim edebilirsiniz",
        ]}
      />
      <Suspense
        fallback={
          <div className="flex items-center justify-center gap-2 py-24 text-slate-600">
            <Loader2 className="size-6 animate-spin" aria-hidden />
            <span>Yükleniyor…</span>
          </div>
        }
      >
        <IkinciElInner />
      </Suspense>
    </>
  );
}
