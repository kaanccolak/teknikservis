"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrPhoneInput } from "@/components/tr-phone-input";
import {
  parseDatetimeLocal,
  toDatetimeLocalValue,
} from "@/lib/datetime-local";
import { formatServiceOrderNo } from "@/lib/service-order-number";
import { normalizeNationalPhoneInput } from "@/lib/tr-phone";
import { cn } from "@/lib/utils";
import {
  createServiceOrderSchema,
  editServiceOrderSchema,
  formEstimatedPriceToDb,
  type CreateServiceOrderFormValues,
} from "@/lib/validation/create-service-order";

type IdName = { id: string; name: string };

type OrderApiRow = {
  id: string;
  orderNumber: string | null;
  personnelId?: string | null;
  deviceTypeId: string | null;
  brandId: string | null;
  deviceModelId: string | null;
  serialNo: string | null;
  noSerialNo: boolean;
  warrantyStatus: string | null;
  isTampered: boolean;
  complaint: string | null;
  accessories: string | null;
  physicalDamage: string | null;
  estimatedPrice: number | null;
  arrivedByCargo: boolean;
  cargoInfo: string | null;
  arrivedAt: string;
  customer: { id: string; name: string; phone: string | null };
  deviceType: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  deviceModel: { id: string; name: string } | null;
};

const nativeSelectClassName =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60";

function formatArrivedAtDisplay(datetimeLocal: string) {
  const d = parseDatetimeLocal(datetimeLocal);
  if (!d) return datetimeLocal;
  return d.toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapOrderToFormValues(order: OrderApiRow): CreateServiceOrderFormValues {
  const warranty =
    order.warrantyStatus === "guaranteed" || order.warrantyStatus === "no_warranty"
      ? order.warrantyStatus
      : "no_warranty";
  return {
    customerName: order.customer.name,
    phone: normalizeNationalPhoneInput(order.customer.phone ?? ""),
    personnelId: order.personnelId ?? "",
    arrivedByCargo: order.arrivedByCargo,
    cargoInfo: order.cargoInfo ?? "",
    arrivedAt: toDatetimeLocalValue(new Date(order.arrivedAt)),
    deviceTypeId: order.deviceTypeId ?? order.deviceType?.id ?? "",
    brandId: order.brandId ?? order.brand?.id ?? "",
    deviceModelId: order.deviceModelId ?? order.deviceModel?.id ?? "",
    serialNo: order.serialNo ?? "",
    noSerialNo: order.noSerialNo,
    warrantyStatus: warranty,
    isTampered: order.isTampered,
    complaint: order.complaint ?? "",
    accessories: order.accessories ?? "",
    physicalDamage: order.physicalDamage ?? "",
    estimatedPrice:
      order.estimatedPrice != null && !Number.isNaN(order.estimatedPrice)
        ? String(order.estimatedPrice)
        : "",
  };
}

export default function ServisDuzenlePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = typeof params.id === "string" ? params.id : "";
  const fromUrl = searchParams.get("from");
  const detailHref = fromUrl
    ? `/servis-detay/${encodeURIComponent(id)}?from=${encodeURIComponent(fromUrl)}`
    : `/servis-detay/${encodeURIComponent(id)}`;

  const [deviceTypes, setDeviceTypes] = useState<IdName[]>([]);
  const [brands, setBrands] = useState<IdName[]>([]);
  const [models, setModels] = useState<IdName[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [titleOrder, setTitleOrder] = useState<{ id: string; orderNumber: string | null } | null>(
    null,
  );
  const [showDateEditor, setShowDateEditor] = useState(false);

  const skipDeviceCascade = useRef(true);
  const skipBrandCascade = useRef(true);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateServiceOrderFormValues>({
    resolver: zodResolver(editServiceOrderSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      personnelId: "",
      arrivedByCargo: false,
      cargoInfo: "",
      arrivedAt: toDatetimeLocalValue(new Date()),
      deviceTypeId: "",
      brandId: "",
      deviceModelId: "",
      serialNo: "",
      noSerialNo: false,
      warrantyStatus: "no_warranty",
      isTampered: false,
      complaint: "",
      accessories: "",
      physicalDamage: "",
      estimatedPrice: "",
    },
  });

  const deviceTypeId = watch("deviceTypeId");
  const brandId = watch("brandId");
  const arrivedByCargo = watch("arrivedByCargo");
  const noSerialNo = watch("noSerialNo");
  const arrivedAt = watch("arrivedAt");

  useEffect(() => {
    skipDeviceCascade.current = true;
    skipBrandCascade.current = true;
    let cancelled = false;

    async function bootstrap() {
      setPageError(null);
      setListError(null);
      setLoadingOrder(true);
      setTitleOrder(null);

      if (!id?.trim()) {
        setPageError("Geçersiz adres");
        setLoadingOrder(false);
        return;
      }

      try {
        const [orderRes, dtRes] = await Promise.all([
          fetch(`/api/service-orders/${encodeURIComponent(id)}`, {
            cache: "no-store",
          }),
          fetch("/api/device-types", { cache: "no-store" }),
        ]);

        const orderJson = (await orderRes.json()) as OrderApiRow | { error?: string };
        if (!orderRes.ok) {
          if (!cancelled) {
            setPageError(
              typeof orderJson === "object" && orderJson && "error" in orderJson
                ? String((orderJson as { error: string }).error)
                : "Kayıt yüklenemedi",
            );
          }
          return;
        }

        const order = orderJson as OrderApiRow;
        const dtData = await dtRes.json();
        if (!dtRes.ok) {
          if (!cancelled) {
            setListError(
              typeof dtData === "object" && dtData && "error" in dtData
                ? String((dtData as { error: string }).error)
                : "Cihaz türleri alınamadı",
            );
            setDeviceTypes([]);
          }
        } else if (!cancelled) {
          setDeviceTypes(dtData as IdName[]);
        }

        const dtId = order.deviceTypeId ?? order.deviceType?.id ?? "";
        const brId = order.brandId ?? order.brand?.id ?? "";

        let brList: IdName[] = [];
        let mdList: IdName[] = [];
        if (dtId) {
          const brRes = await fetch(
            `/api/brands?deviceTypeId=${encodeURIComponent(dtId)}`,
            { cache: "no-store" },
          );
          const brJson = await brRes.json();
          if (brRes.ok && !cancelled) brList = brJson as IdName[];
        }
        if (brId) {
          const mdRes = await fetch(
            `/api/models?brandId=${encodeURIComponent(brId)}`,
            { cache: "no-store" },
          );
          const mdJson = await mdRes.json();
          if (mdRes.ok && !cancelled) mdList = mdJson as IdName[];
        }

        if (cancelled) return;
        setBrands(brList);
        setModels(mdList);
        skipDeviceCascade.current = true;
        skipBrandCascade.current = true;
        reset(mapOrderToFormValues(order));
        setTitleOrder({ id: order.id, orderNumber: order.orderNumber });
        setShowDateEditor(false);
      } catch {
        if (!cancelled) setPageError("Bağlantı hatası");
      } finally {
        if (!cancelled) setLoadingOrder(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [id, reset]);

  useEffect(() => {
    if (!deviceTypeId) return;
    if (skipDeviceCascade.current) {
      skipDeviceCascade.current = false;
      return;
    }
    setValue("brandId", "");
    setValue("deviceModelId", "");
    setBrands([]);
    setModels([]);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/brands?deviceTypeId=${encodeURIComponent(deviceTypeId)}`,
          { cache: "no-store" },
        );
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) toast.error(data.error ?? "Markalar yüklenemedi");
          return;
        }
        if (!cancelled) setBrands(data);
      } catch {
        if (!cancelled) toast.error("Markalar yüklenemedi");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deviceTypeId, setValue]);

  useEffect(() => {
    if (!brandId) return;
    if (skipBrandCascade.current) {
      skipBrandCascade.current = false;
      return;
    }
    setValue("deviceModelId", "");
    setModels([]);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/models?brandId=${encodeURIComponent(brandId)}`,
          { cache: "no-store" },
        );
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) toast.error(data.error ?? "Modeller yüklenemedi");
          return;
        }
        if (!cancelled) setModels(data);
      } catch {
        if (!cancelled) toast.error("Modeller yüklenemedi");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brandId, setValue]);

  const onSubmit = useCallback(
    async (data: CreateServiceOrderFormValues) => {
      const parsed = editServiceOrderSchema.parse(data);
      const payload = {
        ...parsed,
        estimatedPrice: formEstimatedPriceToDb(parsed.estimatedPrice),
      };
      try {
        const res = await fetch(`/api/service-orders/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) {
          toast.error(json.error ?? "Güncelleme başarısız");
          return;
        }
        toast.success("Kayıt güncellendi");
        router.push(detailHref);
      } catch {
        toast.error("Bağlantı hatası. Tekrar deneyin.");
      }
    },
    [detailHref, id, router],
  );

  if (loadingOrder) {
    return (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-slate-600"
        role="status"
      >
        <Loader2 className="size-8 animate-spin" aria-hidden />
        <p className="text-sm">Yükleniyor…</p>
      </div>
    );
  }

  if (pageError || !titleOrder) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Link
          href={id ? detailHref : "/cihaz-sorgula"}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ArrowLeft className="mr-2 size-4" aria-hidden />
          Detaya Dön
        </Link>
        <p className="text-sm text-destructive" role="alert">
          {pageError ?? "Kayıt yüklenemedi"}
        </p>
      </div>
    );
  }

  const titleNo = formatServiceOrderNo(titleOrder);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={detailHref}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
        >
          <ArrowLeft className="mr-2 size-4" aria-hidden />
          Detaya Dön
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          Kaydı Düzenle — #{titleNo}
        </h1>
      </div>

      {listError ? (
        <p className="text-sm text-destructive" role="alert">
          {listError}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Müşteri bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="customerName">
                Ad soyad <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="customerName"
                control={control}
                render={({ field }) => (
                  <Input
                    id="customerName"
                    type="text"
                    autoComplete="name"
                    aria-invalid={!!errors.customerName}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                )}
              />
              {errors.customerName ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.customerName.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="phone">Telefon</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TrPhoneInput
                    id="phone"
                    aria-invalid={!!errors.phone}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.phone ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.phone.message}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Kargo bilgisi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Controller
              name="arrivedByCargo"
              control={control}
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(c) => field.onChange(c === true)}
                  />
                  <span className="text-sm font-medium">Cihaz kargo ile geldi</span>
                </label>
              )}
            />
            <div className={cn("space-y-2", !arrivedByCargo && "hidden")}>
              <Label htmlFor="cargoInfo">Kargo bilgisi</Label>
              <Input id="cargoInfo" autoComplete="off" {...register("cargoInfo")} />
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4">
              <Label>Geliş tarihi ve saati</Label>
              {!showDateEditor ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-slate-700">
                    {formatArrivedAtDisplay(
                      arrivedAt ?? toDatetimeLocalValue(new Date()),
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
                  <div className="space-y-1">
                    <Input
                      type="datetime-local"
                      className="w-auto min-w-[16rem]"
                      aria-invalid={!!errors.arrivedAt}
                      {...register("arrivedAt")}
                    />
                    {errors.arrivedAt ? (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.arrivedAt.message}
                      </p>
                    ) : null}
                  </div>
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
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Cihaz bilgileri</CardTitle>
            <CardDescription>
              Listeler boşsa önce Tanımlar sayfasından ekleyin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>
                  Cihaz türü <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="deviceTypeId"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="form-device-type"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      aria-invalid={!!errors.deviceTypeId}
                      className={nativeSelectClassName}
                    >
                      <option value="">Cihaz türü seçin</option>
                      {deviceTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.deviceTypeId ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.deviceTypeId.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>
                  Marka <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="brandId"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="form-brand"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      disabled={!deviceTypeId || brands.length === 0}
                      aria-invalid={!!errors.brandId}
                      className={nativeSelectClassName}
                    >
                      <option value="">
                        {!deviceTypeId
                          ? "Önce cihaz türü seçin"
                          : brands.length === 0
                            ? "Bu türde marka yok"
                            : "Marka seçin"}
                      </option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.brandId ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.brandId.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>
                  Model <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="deviceModelId"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="form-model"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      disabled={!brandId || models.length === 0}
                      aria-invalid={!!errors.deviceModelId}
                      className={nativeSelectClassName}
                    >
                      <option value="">
                        {!brandId
                          ? "Önce marka seçin"
                          : models.length === 0
                            ? "Bu markada model yok"
                            : "Model seçin"}
                      </option>
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.deviceModelId ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.deviceModelId.message}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNo">Seri no</Label>
              <Controller
                name="serialNo"
                control={control}
                render={({ field }) => (
                  <Input
                    id="serialNo"
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    disabled={noSerialNo}
                    aria-invalid={!!errors.serialNo}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                )}
              />
              {errors.serialNo ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.serialNo.message}
                </p>
              ) : null}
            </div>
            <Controller
              name="noSerialNo"
              control={control}
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(c) => {
                      const on = c === true;
                      field.onChange(on);
                      if (on) setValue("serialNo", "");
                    }}
                  />
                  <span className="text-sm font-medium">Seri numarası yok</span>
                </label>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Garanti bilgisi</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              name="warrantyStatus"
              control={control}
              render={({ field }) => (
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Garanti durumu"
                >
                  {(["guaranteed", "no_warranty"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => field.onChange(value)}
                      className={cn(
                        "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                        field.value === value
                          ? value === "guaranteed"
                            ? "border-green-600 bg-green-600 text-white"
                            : "border-red-600 bg-red-600 text-white"
                          : "border-gray-300 bg-white text-gray-600",
                      )}
                    >
                      {value === "guaranteed" ? "Garantili" : "Garantisiz"}
                    </button>
                  ))}
                </div>
              )}
            />
            {errors.warrantyStatus ? (
              <p className="mt-2 text-sm text-destructive" role="alert">
                {errors.warrantyStatus.message}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Genel durum</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              name="isTampered"
              control={control}
              render={({ field }) => (
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Genel durum"
                >
                  <button
                    type="button"
                    onClick={() => field.onChange(false)}
                    className={cn(
                      "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                      !field.value
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-gray-300 bg-white text-gray-600",
                    )}
                  >
                    Kurcalanmamış
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange(true)}
                    className={cn(
                      "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                      field.value
                        ? "border-red-600 bg-red-600 text-white"
                        : "border-gray-300 bg-white text-gray-600",
                    )}
                  >
                    Kurcalanmış
                  </button>
                </div>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Arıza ve notlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="complaint">Şikayet / arıza bilgisi</Label>
              <Textarea id="complaint" rows={5} {...register("complaint")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessories">Cihazla gelen aksesuarlar</Label>
              <Textarea id="accessories" rows={3} {...register("accessories")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="physicalDamage">Fiziksel hasar / dış görünüm</Label>
              <Textarea id="physicalDamage" rows={3} {...register("physicalDamage")} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Fiyat bilgisi</CardTitle>
            <CardDescription>
              Müşteriye bildirilen tahmini tutar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="estimatedPrice">Tahmini fiyat</Label>
            <div className="relative">
              <span
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500"
                aria-hidden
              >
                ₺
              </span>
              <Input
                id="estimatedPrice"
                type="number"
                min={0}
                step="0.01"
                autoComplete="off"
                placeholder="0,00"
                aria-invalid={!!errors.estimatedPrice}
                className="pl-8"
                {...register("estimatedPrice")}
              />
            </div>
            {errors.estimatedPrice ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.estimatedPrice.message}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Link
            href={detailHref}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "inline-flex items-center justify-center",
            )}
          >
            İptal
          </Link>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
          </Button>
        </div>
      </form>
    </div>
  );
}
