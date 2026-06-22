"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { SecondHandTogglePair } from "../../../cihaz-kayit/second-hand-form";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrPhoneInput } from "@/components/tr-phone-input";
import { trPhoneDigitsOnly } from "@/lib/tr-phone";
import { cn } from "@/lib/utils";

type IdName = { id: string; name: string };

const nativeSelectClassName =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60";

type RowDetail = {
  id: string;
  deviceCode: string;
  sellerName: string;
  sellerPhone: string | null;
  sellerTcNo: string | null;
  deviceTypeId: string | null;
  brandId: string | null;
  deviceModelId: string | null;
  serialNo: string | null;
  noSerialNo: boolean;
  hasInvoice: boolean;
  hasWarranty: boolean;
  hasBox: boolean;
  purchasePrice: number;
  purchasedAt: string | null;
  notes: string | null;
  isSold: boolean;
  soldAt: string | null;
  buyerName: string | null;
  buyerPhone: string | null;
  buyerTcNo: string | null;
  soldPrice: number | null;
};

type FormValues = {
  sellerName: string;
  sellerPhone: string;
  sellerTcNo: string;
  deviceTypeId: string;
  brandId: string;
  deviceModelId: string;
  serialNo: string;
  noSerialNo: boolean;
  hasInvoice: boolean;
  hasWarranty: boolean;
  hasBox: boolean;
  purchasePrice: string;
  purchasedAt: string;
  soldAt: string;
  buyerName: string;
  buyerPhone: string;
  buyerTcNo: string;
  soldPrice: string;
  notes: string;
};

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatPurchasedAtDisplay(datetimeLocal: string): string {
  const d = new Date(datetimeLocal);
  if (isNaN(d.getTime())) return datetimeLocal;
  return d.toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });
}

function normalizePhoneForInput(phone: string | null): string {
  if (!phone) return "";
  const digits = trPhoneDigitsOnly(phone);
  if (digits.startsWith("90")) return digits.slice(2, 12);
  if (digits.startsWith("0")) return digits.slice(1, 11);
  return digits.slice(0, 10);
}

export default function IkinciElDuzenlePage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [deviceTypes, setDeviceTypes] = useState<IdName[]>([]);
  const [brands, setBrands] = useState<IdName[]>([]);
  const [models, setModels] = useState<IdName[]>([]);
  const [loadingRow, setLoadingRow] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deviceCode, setDeviceCode] = useState("");
  const isInitializing = useRef(false);
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [showSoldDateEditor, setShowSoldDateEditor] = useState(false);
  const [isSoldState, setIsSoldState] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState } =
    useForm<FormValues>({
      defaultValues: {
        sellerName: "",
        sellerPhone: "",
        sellerTcNo: "",
        deviceTypeId: "",
        brandId: "",
        deviceModelId: "",
        serialNo: "",
        noSerialNo: false,
        hasInvoice: false,
        hasWarranty: false,
        hasBox: false,
        purchasePrice: "",
        purchasedAt: "",
        soldAt: "",
        buyerName: "",
        buyerPhone: "",
        buyerTcNo: "",
        soldPrice: "",
        notes: "",
      },
    });

  const deviceTypeId = watch("deviceTypeId");
  const brandId = watch("brandId");
  const noSerialNo = watch("noSerialNo");
  const purchasedAt = watch("purchasedAt");
  const soldAt = watch("soldAt");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/device-types")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setDeviceTypes(data as IdName[]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const loadRow = useCallback(async () => {
    if (!id) return;
    setLoadError(null);
    setLoadingRow(true);
    isInitializing.current = true;
    try {
      const res = await fetch(`/api/second-hand/${id}`);
      const data = (await res.json()) as RowDetail | { error?: string };
      if (!res.ok) {
        setLoadError(
          typeof data === "object" && data && "error" in data
            ? String((data as { error: string }).error)
            : "Kayıt yüklenemedi",
        );
        return;
      }
      const row = data as RowDetail;
      setDeviceCode(row.deviceCode);
      setIsSoldState(row.isSold);
      setValue("sellerName", row.sellerName);
      setValue("sellerPhone", normalizePhoneForInput(row.sellerPhone));
      setValue("sellerTcNo", row.sellerTcNo ?? "");
      setValue("deviceTypeId", row.deviceTypeId ?? "");
      setValue("brandId", row.brandId ?? "");
      setValue("deviceModelId", row.deviceModelId ?? "");
      setValue("serialNo", row.serialNo ?? "");
      setValue("noSerialNo", row.noSerialNo);
      setValue("hasInvoice", row.hasInvoice);
      setValue("hasWarranty", row.hasWarranty);
      setValue("hasBox", row.hasBox);
      setValue(
        "purchasePrice",
        Number.isFinite(row.purchasePrice)
          ? String(row.purchasePrice)
          : "",
      );
      setValue(
        "purchasedAt",
        row.purchasedAt
          ? toDatetimeLocalValue(new Date(row.purchasedAt))
          : toDatetimeLocalValue(new Date()),
      );
      setValue("notes", row.notes ?? "");
      setValue(
        "soldAt",
        row.soldAt ? toDatetimeLocalValue(new Date(row.soldAt)) : "",
      );
      setValue("buyerName", row.buyerName ?? "");
      setValue("buyerPhone", normalizePhoneForInput(row.buyerPhone));
      setValue("buyerTcNo", row.buyerTcNo ?? "");
      setValue(
        "soldPrice",
        row.soldPrice != null ? String(row.soldPrice) : "",
      );

      if (row.deviceTypeId) {
        const brRes = await fetch(
          `/api/brands?deviceTypeId=${encodeURIComponent(row.deviceTypeId)}`,
        );
        const brData = await brRes.json();
        if (brRes.ok && Array.isArray(brData)) setBrands(brData as IdName[]);
      }
      if (row.brandId) {
        const mdRes = await fetch(
          `/api/models?brandId=${encodeURIComponent(row.brandId)}`,
        );
        const mdData = await mdRes.json();
        if (mdRes.ok && Array.isArray(mdData)) setModels(mdData as IdName[]);
      }
    } catch {
      setLoadError("Bağlantı hatası");
    } finally {
      isInitializing.current = false;
      setLoadingRow(false);
    }
  }, [id, setValue]);

  useEffect(() => {
    void loadRow();
  }, [loadRow]);

  useEffect(() => {
    if (isInitializing.current) return;
    setValue("brandId", "");
    setValue("deviceModelId", "");
    setBrands([]);
    setModels([]);
    if (!deviceTypeId) return;
    let cancelled = false;
    void fetch(
      `/api/brands?deviceTypeId=${encodeURIComponent(deviceTypeId)}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setBrands(data as IdName[]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [deviceTypeId, setValue]);

  useEffect(() => {
    if (isInitializing.current) return;
    setValue("deviceModelId", "");
    setModels([]);
    if (!brandId) return;
    let cancelled = false;
    void fetch(`/api/models?brandId=${encodeURIComponent(brandId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setModels(data as IdName[]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [brandId, setValue]);

  const onSubmit = useCallback(
    async (data: FormValues) => {
      const name = data.sellerName.trim();
      if (!name) {
        toast.error("Satıcı adı soyadı zorunludur");
        return;
      }
      const price = parseFloat(data.purchasePrice.replace(",", "."));
      if (!Number.isFinite(price) || price <= 0) {
        toast.error("Geçerli bir satın alım fiyatı girin");
        return;
      }
      const hasAny =
        Boolean(data.deviceTypeId) ||
        Boolean(data.brandId) ||
        Boolean(data.deviceModelId);
      if (hasAny) {
        if (!data.deviceTypeId || !data.brandId || !data.deviceModelId) {
          toast.error("Cihaz türü, marka ve modeli birlikte seçin");
          return;
        }
      }

      const payload: Record<string, unknown> = {
        sellerName: name,
        sellerPhone: data.sellerPhone,
        sellerTcNo: data.sellerTcNo.trim() || null,
        serialNo: data.noSerialNo ? null : data.serialNo.trim() || null,
        noSerialNo: data.noSerialNo,
        hasInvoice: data.hasInvoice,
        hasWarranty: data.hasWarranty,
        hasBox: data.hasBox,
        purchasePrice: price,
        purchasedAt: data.purchasedAt,
        soldAt: data.soldAt ? new Date(data.soldAt).toISOString() : undefined,
        notes: data.notes.trim() || null,
        ...(isSoldState && {
          buyerName: data.buyerName.trim() || undefined,
          buyerPhone: data.buyerPhone || undefined,
          buyerTcNo: data.buyerTcNo.trim() || undefined,
          soldPrice: data.soldPrice
            ? parseFloat(data.soldPrice.replace(",", "."))
            : undefined,
        }),
      };

      if (data.deviceTypeId && data.brandId && data.deviceModelId) {
        payload.deviceTypeId = data.deviceTypeId;
        payload.brandId = data.brandId;
        payload.deviceModelId = data.deviceModelId;
      } else {
        payload.deviceTypeId = "";
        payload.brandId = "";
        payload.deviceModelId = "";
      }

      try {
        const res = await fetch(`/api/second-hand/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { error?: string; details?: string };
        if (!res.ok) {
          toast.error(
            json.details
              ? `${json.error ?? "Güncellenemedi"}: ${json.details}`
              : (json.error ?? "Güncellenemedi"),
          );
          return;
        }
        toast.success("Kayıt güncellendi");
        router.push(`/ikinci-el/${id}`);
      } catch {
        toast.error("Bağlantı hatası");
      }
    },
    [id, isSoldState, router],
  );

  const title = useMemo(
    () => (deviceCode ? `Kaydı düzenle — #${deviceCode}` : "Kaydı düzenle"),
    [deviceCode],
  );

  if (loadingRow) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-600">
        <Loader2 className="size-6 animate-spin" aria-hidden />
        <span>Yükleniyor…</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link
          href={id ? `/ikinci-el/${id}` : "/ikinci-el"}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "inline-flex gap-2",
          )}
        >
          <ArrowLeft className="size-4" />
          Detaya dön
        </Link>
        <p className="text-sm text-destructive">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/ikinci-el/${id}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-fit gap-2",
          )}
        >
          <ArrowLeft className="size-4" />
          Detaya dön
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Satıcı bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ed-seller">
                Ad soyad <span className="text-destructive">*</span>
              </Label>
              <Input id="ed-seller" {...register("sellerName")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ed-phone">Telefon (+90)</Label>
              <Controller
                name="sellerPhone"
                control={control}
                render={({ field }) => (
                  <TrPhoneInput
                    id="ed-phone"
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ed-tc">TC kimlik no</Label>
              <Input id="ed-tc" maxLength={11} {...register("sellerTcNo")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cihaz bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ed-dt">Cihaz türü</Label>
              <select
                id="ed-dt"
                className={nativeSelectClassName}
                {...register("deviceTypeId")}
              >
                <option value="">Seçiniz</option>
                {deviceTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ed-brand">Marka</Label>
              <select
                id="ed-brand"
                className={nativeSelectClassName}
                disabled={!deviceTypeId}
                {...register("brandId")}
              >
                <option value="">Seçiniz</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ed-model">Model</Label>
              <select
                id="ed-model"
                className={nativeSelectClassName}
                disabled={!brandId}
                {...register("deviceModelId")}
              >
                <option value="">Seçiniz</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ed-serial">Seri no</Label>
              <Input
                id="ed-serial"
                disabled={noSerialNo}
                {...register("serialNo")}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
              <Checkbox
                checked={noSerialNo}
                onCheckedChange={(c) =>
                  setValue("noSerialNo", c === true, { shouldDirty: true })
                }
              />
              <span className="text-sm font-medium text-slate-700">
                Seri numarası yok
              </span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aksesuar ve durum</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-3">
            <Controller
              name="hasInvoice"
              control={control}
              render={({ field }) => (
                <SecondHandTogglePair
                  label="Fatura"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="hasWarranty"
              control={control}
              render={({ field }) => (
                <SecondHandTogglePair
                  label="Garanti"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="hasBox"
              control={control}
              render={({ field }) => (
                <SecondHandTogglePair
                  label="Kutu"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Satın alım</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Alım tarihi ve saati</Label>
              {!showDateEditor ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-slate-700">
                    {formatPurchasedAtDisplay(
                      purchasedAt ?? toDatetimeLocalValue(new Date()),
                    )}
                  </span>
                  <button
                    type="button"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => setShowDateEditor(true)}
                  >
                    Tarihi değiştir
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-end gap-3">
                  <Input
                    type="datetime-local"
                    className="w-auto min-w-[16rem]"
                    {...register("purchasedAt")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDateEditor(false)}
                  >
                    Kapat
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-price">
                Satın alınan fiyat (₺){" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  ₺
                </span>
                <Input
                  id="ed-price"
                  type="text"
                  inputMode="decimal"
                  className="pl-8"
                  {...register("purchasePrice")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-notes">Notlar</Label>
              <Textarea id="ed-notes" rows={3} {...register("notes")} />
            </div>
          </CardContent>
        </Card>

        {isSoldState && (
          <Card>
            <CardHeader>
              <CardTitle>Satış bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ed-buyer-name">Alıcı ad soyad</Label>
                <Input id="ed-buyer-name" {...register("buyerName")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ed-buyer-phone">Alıcı telefonu (+90)</Label>
                <Controller
                  name="buyerPhone"
                  control={control}
                  render={({ field }) => (
                    <TrPhoneInput
                      id="ed-buyer-phone"
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ed-buyer-tc">Alıcı TC kimlik no</Label>
                <Input id="ed-buyer-tc" maxLength={11} {...register("buyerTcNo")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ed-sold-price">Satış fiyatı (₺)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    ₺
                  </span>
                  <Input
                    id="ed-sold-price"
                    type="text"
                    inputMode="decimal"
                    className="pl-8"
                    {...register("soldPrice")}
                  />
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Satış tarihi ve saati</Label>
                {!showSoldDateEditor ? (
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-slate-700">
                      {soldAt
                        ? new Date(soldAt).toLocaleString("tr-TR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Europe/Istanbul",
                          })
                        : "—"}
                    </span>
                    {soldAt && (
                      <button
                        type="button"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                        onClick={() => setShowSoldDateEditor(true)}
                      >
                        Tarihi değiştir
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-end gap-3">
                    <Input
                      type="datetime-local"
                      className="w-auto min-w-[16rem]"
                      {...register("soldAt")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSoldDateEditor(false)}
                    >
                      Kapat
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/ikinci-el/${id}`)}
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={formState.isSubmitting}
            className="bg-violet-600 text-white hover:bg-violet-700"
          >
            {formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Kaydediliyor…
              </>
            ) : (
              "Değişiklikleri kaydet"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
