"use client";

import { ArrowLeft, Check, Loader2, Pencil, Printer, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrPhoneInput } from "@/components/tr-phone-input";
import { formatTrNationalDisplay, trPhoneDigitsOnly } from "@/lib/tr-phone";
import { cn } from "@/lib/utils";

type Detail = {
  id: string;
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
  notes: string | null;
  createdAt: string;
  isSold: boolean;
  soldAt: string | null;
  soldPrice: number | null;
  buyerName: string | null;
  buyerPhone: string | null;
  buyerTcNo: string | null;
  deviceType: { name: string } | null;
  brand: { name: string } | null;
  deviceModel: { name: string } | null;
};

type SaleFormValues = {
  buyerName: string;
  buyerPhone: string;
  buyerTcNo: string;
  soldPrice: string;
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

function BoolLine({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      {value ? (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
          <Check className="size-4" aria-hidden />
          Var
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600">
          <X className="size-4" aria-hidden />
          Yok
        </span>
      )}
    </div>
  );
}

export default function IkinciElDetayPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [row, setRow] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [saleSubmitting, setSaleSubmitting] = useState(false);

  const saleForm = useForm<SaleFormValues>({
    defaultValues: {
      buyerName: "",
      buyerPhone: "",
      buyerTcNo: "",
      soldPrice: "",
    },
  });

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/second-hand/${id}`);
      const data = (await res.json()) as Detail | { error?: string };
      if (!res.ok) {
        setRow(null);
        setError(
          typeof data === "object" && data && "error" in data
            ? String((data as { error: string }).error)
            : "Kayıt yüklenemedi",
        );
        return;
      }
      setRow(data as Detail);
    } catch {
      setRow(null);
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/second-hand/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        toast.error(j.error ?? "Silinemedi");
        return;
      }
      toast.success("Kayıt silindi");
      router.push("/ikinci-el");
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  async function submitSale(values: SaleFormValues) {
    const name = values.buyerName.trim();
    if (!name) {
      toast.error("Alıcı adı soyadı zorunludur");
      return;
    }
    const price = parseFloat(values.soldPrice.replace(",", "."));
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Geçerli bir satış fiyatı girin");
      return;
    }
    setSaleSubmitting(true);
    try {
      const res = await fetch(`/api/second-hand/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isSold: true,
          buyerName: name,
          buyerPhone: values.buyerPhone,
          buyerTcNo: values.buyerTcNo.trim() || null,
          soldPrice: price,
        }),
      });
      const json = (await res.json()) as { error?: string; details?: string };
      if (!res.ok) {
        toast.error(
          json.details
            ? `${json.error ?? "Kayıt güncellenemedi"}: ${json.details}`
            : (json.error ?? "Kayıt güncellenemedi"),
        );
        return;
      }
      toast.success("Satış kaydedildi");
      setSaleOpen(false);
      saleForm.reset({
        buyerName: "",
        buyerPhone: "",
        buyerTcNo: "",
        soldPrice: "",
      });
      void load();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSaleSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-600">
        <Loader2 className="size-6 animate-spin" aria-hidden />
        <span>Yükleniyor…</span>
      </div>
    );
  }

  if (error || !row) {
    return (
      <div className="space-y-4">
        <Link
          href="/ikinci-el"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "inline-flex gap-2",
          )}
        >
          <ArrowLeft className="size-4" />
          Geri Dön
        </Link>
        <p className="text-sm text-destructive" role="alert">
          {error ?? "Kayıt bulunamadı"}
        </p>
      </div>
    );
  }

  const profit =
    row.soldPrice != null && row.soldAt
      ? row.soldPrice - row.purchasePrice
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/ikinci-el"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-2",
            )}
          >
            <ArrowLeft className="size-4" />
            Geri Dön
          </Link>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-violet-700 sm:text-3xl">
              {row.deviceCode}
            </span>
            {row.isSold ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
                Satıldı
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!row.isSold ? (
              <Link
                href={`/ikinci-el/${id}/duzenle`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-1",
                )}
              >
                <Pencil className="size-3.5" aria-hidden />
                ✏ Düzenle
              </Link>
            ) : null}
            <Link
              href={`/ikinci-el-fis/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1",
              )}
            >
              <Printer className="size-3.5" aria-hidden />
              🖨 Alım fişi
            </Link>
            {row.isSold ? (
              <Link
                href={`/ikinci-el-satis-fisi/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-1",
                )}
              >
                <Printer className="size-3.5" aria-hidden />
                🖨 Satış fişi
              </Link>
            ) : null}
            {!row.isSold ? (
              <Button
                type="button"
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => setSaleOpen(true)}
              >
                ✓ Satıldı olarak işaretle
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-1 size-3.5" aria-hidden />
              🗑 Sil
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Satıcı bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Ad soyad</p>
                <p className="font-medium text-slate-900">{row.sellerName}</p>
              </div>
              <div>
                <p className="text-slate-500">Telefon</p>
                <p className="font-medium text-slate-900">
                  {formatPhone(row.sellerPhone)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">TC kimlik no</p>
                <p className="font-medium text-slate-900">
                  {row.sellerTcNo ?? "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cihaz bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Cihaz türü</p>
                <p className="font-medium text-slate-900">
                  {row.deviceType?.name ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Marka</p>
                <p className="font-medium text-slate-900">
                  {row.brand?.name ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Model</p>
                <p className="font-medium text-slate-900">
                  {row.deviceModel?.name ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Seri no</p>
                <p className="font-medium text-slate-900">
                  {row.noSerialNo ? "—" : (row.serialNo ?? "—")}
                </p>
              </div>
            </CardContent>
          </Card>

          {row.notes ? (
            <Card>
              <CardHeader>
                <CardTitle>Notlar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-slate-800">
                  {row.notes}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Durum</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-4">
              <BoolLine label="Fatura" value={row.hasInvoice} />
              <BoolLine label="Garanti" value={row.hasWarranty} />
              <BoolLine label="Kutu" value={row.hasBox} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alım fiyatı</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-3xl font-bold tabular-nums text-slate-900">
                {formatTry(row.purchasePrice)}
              </p>
              <div>
                <p className="text-sm text-slate-500">Kayıt tarihi</p>
                <p className="text-sm font-medium text-slate-800">
                  {new Date(row.createdAt).toLocaleString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {row.isSold &&
          row.buyerName &&
          row.soldPrice != null &&
          row.soldAt ? (
            <Card>
              <CardHeader>
                <CardTitle>Satış bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500">Alıcı</p>
                  <p className="font-medium text-slate-900">{row.buyerName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Telefon</p>
                  <p className="font-medium text-slate-900">
                    {formatPhone(row.buyerPhone)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">TC kimlik no</p>
                  <p className="font-medium text-slate-900">
                    {row.buyerTcNo ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Satış fiyatı</p>
                  <p className="text-2xl font-bold tabular-nums text-emerald-700">
                    {formatTry(row.soldPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Satış tarihi</p>
                  <p className="font-medium text-slate-900">
                    {new Date(row.soldAt).toLocaleString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {profit !== null ? (
                  <div>
                    <p className="text-slate-500">Kar / zarar</p>
                    <p
                      className={cn(
                        "text-xl font-bold tabular-nums",
                        profit >= 0 ? "text-emerald-700" : "text-red-600",
                      )}
                    >
                      {profit >= 0 ? "" : "−"}
                      {formatTry(Math.abs(profit))}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <Dialog open={saleOpen} onOpenChange={setSaleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Satış bilgileri</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={saleForm.handleSubmit(submitSale)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="buyerName">
                Alıcı adı soyadı <span className="text-destructive">*</span>
              </Label>
              <Input id="buyerName" {...saleForm.register("buyerName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyerPhone">Alıcı telefonu (+90)</Label>
              <Controller
                name="buyerPhone"
                control={saleForm.control}
                render={({ field }) => (
                  <TrPhoneInput
                    id="buyerPhone"
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyerTc">Alıcı TC kimlik no</Label>
              <Input id="buyerTc" maxLength={11} {...saleForm.register("buyerTcNo")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soldPrice">
                Satış fiyatı (₺) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  ₺
                </span>
                <Input
                  id="soldPrice"
                  className="pl-8"
                  inputMode="decimal"
                  {...saleForm.register("soldPrice")}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSaleOpen(false)}
              >
                İptal
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={saleSubmitting}
              >
                {saleSubmitting ? "Kaydediliyor…" : "Satışı kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kaydı silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz.
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
