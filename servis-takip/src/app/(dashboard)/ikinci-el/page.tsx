"use client";

import { Check, Loader2, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
  isSold: boolean;
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

function deviceSummary(r: Row): string {
  const parts = [
    r.deviceType?.name,
    r.brand?.name,
    r.deviceModel?.name,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function IkinciElInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParam = searchParams.get("search") ?? "";
  const soldParamRaw = searchParams.get("sold") ?? "";
  const statusFilter: "all" | "stock" | "sold" =
    soldParamRaw === "stock" || soldParamRaw === "sold" ? soldParamRaw : "all";

  const [search, setSearch] = useState(searchParam);
  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setSearch(searchParam);
  }, [searchParam]);

  const updateURL = useCallback(
    (q: string) => {
      const p = new URLSearchParams(searchParams.toString());
      if (q.trim()) p.set("search", q.trim());
      else p.delete("search");
      const s = p.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

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
      const res = await fetch(`/api/second-hand?${params}`);
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
  }, [search, statusFilter]);

  useEffect(() => {
    void fetchSecondHand();
  }, [fetchSecondHand]);

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/second-hand/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        toast.error(j.error ?? "Silinemedi");
        return;
      }
      toast.success("Kayıt silindi");
      setDeleteId(null);
      void fetchSecondHand();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setDeleting(false);
    }
  }

  const totalLabel = useMemo(
    () => `${total} kayıt`,
    [total],
  );

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
        <Link
          href="/cihaz-kayit?mode=secondhand"
          className={cn(
            buttonVariants({ size: "default" }),
            "shrink-0 bg-violet-600 text-white hover:bg-violet-700",
          )}
        >
          Yeni kayıt ekle
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-md flex-1">
            <label htmlFor="sh-search" className="sr-only">
              Ara
            </label>
            <Input
              id="sh-search"
              type="search"
              placeholder="Satıcı, telefon, kod, cihaz veya seri no ara..."
              value={search}
              onChange={(e) => {
                const v = e.target.value;
                setSearch(v);
                updateURL(v);
              }}
            />
          </div>
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
            <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Kayıt kodu
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Durum
                  </th>
                  <th className="px-3 py-3 font-medium text-slate-700">
                    Satıcı adı
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Telefon
                  </th>
                  <th className="px-3 py-3 font-medium text-slate-700">Cihaz</th>
                  <th className="px-3 py-3 font-medium text-slate-700">Seri no</th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Fatura
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Garanti
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Kutu
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Satın alım
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Tarih
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
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
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className="font-semibold text-violet-700">
                        {row.deviceCode}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      {row.isSold ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          Satıldı
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                          Stokta
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-800">{row.sellerName}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                      {formatPhone(row.sellerPhone)}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2.5 text-slate-700">
                      {deviceSummary(row)}
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-2.5 text-slate-700">
                      {row.noSerialNo ? "—" : (row.serialNo ?? "—")}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {row.hasInvoice ? (
                        <Check className="mx-auto size-5 text-emerald-600" aria-label="Var" />
                      ) : (
                        <X className="mx-auto size-5 text-red-500" aria-label="Yok" />
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {row.hasWarranty ? (
                        <Check className="mx-auto size-5 text-emerald-600" aria-label="Var" />
                      ) : (
                        <X className="mx-auto size-5 text-red-500" aria-label="Yok" />
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {row.hasBox ? (
                        <Check className="mx-auto size-5 text-emerald-600" aria-label="Var" />
                      ) : (
                        <X className="mx-auto size-5 text-red-500" aria-label="Yok" />
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium text-slate-900">
                      {formatTry(row.purchasePrice)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                      {new Date(row.createdAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
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
            <AlertDialogCancel disabled={deleting}>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? "Siliniyor…" : "Evet, sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function IkinciElPage() {
  return (
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
  );
}
