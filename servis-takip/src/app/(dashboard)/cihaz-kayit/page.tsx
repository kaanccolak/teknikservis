"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import {
  createServiceOrderSchema,
  type CreateServiceOrderFormValues,
} from "@/lib/validation/create-service-order";

type IdName = { id: string; name: string };
type CustomerSearchOrder = {
  id: string;
  orderNumber: string | null;
  serialNo: string | null;
  deviceTypeId: string | null;
  brandId: string | null;
  deviceModelId: string | null;
  deviceType: { name: string } | null;
  brand: { name: string } | null;
  deviceModel: { name: string } | null;
};
type CustomerSearchItem = {
  id: string;
  name: string;
  phone: string | null;
  orders: CustomerSearchOrder[];
};
type CariRow = {
  id: string;
  name: string;
  phone: string | null;
  taxOrTcNo: string | null;
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

const defaultValuesBase: Omit<CreateServiceOrderFormValues, "arrivedAt"> = {
  customerName: "",
  phone: "",
  arrivedByCargo: false,
  cargoInfo: "",
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
};

function getDefaultValues(): CreateServiceOrderFormValues {
  return {
    ...defaultValuesBase,
    arrivedAt: toDatetimeLocalValue(new Date()),
  };
}

export default function CihazKayitPage() {
  const [deviceTypes, setDeviceTypes] = useState<IdName[]>([]);
  const [brands, setBrands] = useState<IdName[]>([]);
  const [models, setModels] = useState<IdName[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [customerResults, setCustomerResults] = useState<CustomerSearchItem[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerPanelOpen, setCustomerPanelOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<{
    customer: CustomerSearchItem;
    order: CustomerSearchOrder;
  } | null>(null);
  const [cariDialogOpen, setCariDialogOpen] = useState(false);
  const [cariSearch, setCariSearch] = useState("");
  const [cariRows, setCariRows] = useState<CariRow[]>([]);
  const [cariLoading, setCariLoading] = useState(false);
  const [selectedCariId, setSelectedCariId] = useState<string | null>(null);
  const [selectedCariName, setSelectedCariName] = useState<string | null>(null);
  const skipDeviceCascade = useRef(false);
  const skipBrandCascade = useRef(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateServiceOrderFormValues>({
    resolver: zodResolver(createServiceOrderSchema),
    defaultValues: getDefaultValues(),
  });

  const deviceTypeId = watch("deviceTypeId");
  const brandId = watch("brandId");
  const arrivedByCargo = watch("arrivedByCargo");
  const noSerialNo = watch("noSerialNo");
  const arrivedAt = watch("arrivedAt");
  const customerName = watch("customerName");
  const formValues = watch();

  const isDirty = useMemo(() => {
    const textFields = [
      formValues.customerName,
      formValues.phone,
      formValues.cargoInfo,
      formValues.serialNo,
      formValues.complaint,
      formValues.accessories,
      formValues.physicalDamage,
    ];
    const hasText = textFields.some((v) => (v ?? "").trim() !== "");
    const hasSelection =
      (formValues.deviceTypeId ?? "") !== "" ||
      (formValues.brandId ?? "") !== "" ||
      (formValues.deviceModelId ?? "") !== "";
    const hasToggle =
      formValues.arrivedByCargo === true ||
      formValues.noSerialNo === true ||
      formValues.isTampered === true ||
      formValues.warrantyStatus === "guaranteed";
    return hasText || hasSelection || hasToggle;
  }, [formValues]);

  useEffect(() => {
    window.__formIsDirty = isDirty;
  }, [isDirty]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    return () => {
      window.__formIsDirty = false;
    };
  }, []);

  const loadDeviceTypes = useCallback(async () => {
    setListError(null);
    try {
      const res = await fetch("/api/device-types");
      const data = await res.json();
      if (!res.ok) {
        setListError(data.error ?? "Cihaz türleri alınamadı");
        return;
      }
      setDeviceTypes(data);
    } catch {
      setListError("Cihaz türleri alınamadı");
    }
  }, []);

  useEffect(() => {
    void loadDeviceTypes();
  }, [loadDeviceTypes]);

  useEffect(() => {
    if (skipDeviceCascade.current) {
      skipDeviceCascade.current = false;
      return;
    }
    setValue("brandId", "");
    setValue("deviceModelId", "");
    setBrands([]);
    setModels([]);
    if (!deviceTypeId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/brands?deviceTypeId=${encodeURIComponent(deviceTypeId)}`,
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
    if (skipBrandCascade.current) {
      skipBrandCascade.current = false;
      return;
    }
    setValue("deviceModelId", "");
    setModels([]);
    if (!brandId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/models?brandId=${encodeURIComponent(brandId)}`,
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

  useEffect(() => {
    const q = (customerName ?? "").trim();
    if (q.length < 3) {
      setCustomerLoading(false);
      setCustomerResults([]);
      setCustomerPanelOpen(false);
      return;
    }
    const t = window.setTimeout(async () => {
      setCustomerLoading(true);
      try {
        const res = await fetch(`/api/customers/search?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as CustomerSearchItem[] | { error?: string };
        if (!res.ok) {
          setCustomerResults([]);
          setCustomerPanelOpen(false);
          return;
        }
        const rows = data as CustomerSearchItem[];
        setCustomerResults(rows);
        setCustomerPanelOpen(rows.length > 0);
      } catch {
        setCustomerResults([]);
        setCustomerPanelOpen(false);
      } finally {
        setCustomerLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [customerName]);

  useEffect(() => {
    if (!cariDialogOpen) return;
    const q = cariSearch.trim();
    if (q.length < 2) {
      setCariRows([]);
      setCariLoading(false);
      return;
    }
    const t = window.setTimeout(async () => {
      setCariLoading(true);
      try {
        const res = await fetch(`/api/cari?search=${encodeURIComponent(q)}`);
        const data = (await res.json()) as CariRow[] | { error?: string };
        if (!res.ok) {
          setCariRows([]);
          return;
        }
        setCariRows(data as CariRow[]);
      } catch {
        setCariRows([]);
      } finally {
        setCariLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [cariDialogOpen, cariSearch]);

  function normalizePhoneForInput(phone: string | null): string {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("90")) return digits.slice(2, 12);
    if (digits.startsWith("0")) return digits.slice(1, 11);
    return digits.slice(0, 10);
  }

  async function applyOrderToForm(customer: CustomerSearchItem, order: CustomerSearchOrder) {
    const phoneInput = normalizePhoneForInput(customer.phone);
    setValue("customerName", customer.name, { shouldDirty: true });
    setValue("phone", phoneInput, { shouldDirty: true });

    const dtId = order.deviceTypeId ?? "";
    const brId = order.brandId ?? "";
    const mdId = order.deviceModelId ?? "";
    if (dtId && brId && mdId) {
      try {
        const [brRes, mdRes] = await Promise.all([
          fetch(`/api/brands?deviceTypeId=${encodeURIComponent(dtId)}`),
          fetch(`/api/models?brandId=${encodeURIComponent(brId)}`),
        ]);
        const brData = (await brRes.json()) as IdName[] | { error?: string };
        const mdData = (await mdRes.json()) as IdName[] | { error?: string };
        if (brRes.ok) setBrands(brData as IdName[]);
        if (mdRes.ok) setModels(mdData as IdName[]);
      } catch {
        // Liste yüklenemezse mevcut alanları yine de doldur.
      }
      skipDeviceCascade.current = true;
      skipBrandCascade.current = true;
      setValue("deviceTypeId", dtId, { shouldDirty: true });
      setValue("brandId", brId, { shouldDirty: true });
      setValue("deviceModelId", mdId, { shouldDirty: true });
    }
    setValue("serialNo", order.serialNo ?? "", { shouldDirty: true });
    setValue("noSerialNo", false, { shouldDirty: true });
    setCustomerPanelOpen(false);
    toast.success("Bilgiler aktarıldı");
  }

  function applyOnlyCustomer(customer: CustomerSearchItem) {
    const phoneInput = normalizePhoneForInput(customer.phone);
    setValue("customerName", customer.name, { shouldDirty: true });
    setValue("phone", phoneInput, { shouldDirty: true });
    setCustomerPanelOpen(false);
    toast.success("Bilgiler aktarıldı");
  }

  function orderSummary(order: CustomerSearchOrder) {
    return `${order.deviceType?.name ?? "—"} / ${order.brand?.name ?? "—"} / ${
      order.deviceModel?.name ?? "—"
    }`;
  }

  async function onSubmit(data: CreateServiceOrderFormValues) {
    const payload = createServiceOrderSchema.parse(data);
    try {
      const res = await fetch("/api/service-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, cariId: selectedCariId ?? undefined }),
      });
      const json = (await res.json()) as {
        id?: string;
        orderNumber?: string;
        error?: string;
      };

      if (!res.ok) {
        toast.error(json.error ?? "Kayıt başarısız");
        return;
      }

      if (json.orderNumber) {
        toast.success(`Kayıt oluşturuldu! No: #${json.orderNumber}`);
        reset(getDefaultValues());
        window.__formIsDirty = false;
        setShowDateEditor(false);
        setCustomerResults([]);
        setCustomerPanelOpen(false);
        setPendingSelection(null);
        setSelectedCariId(null);
        setSelectedCariName(null);
      }
    } catch {
      toast.error("Bağlantı hatası. Tekrar deneyin.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Cihaz kayıt</h1>
        <p className="mt-1 text-sm text-slate-600">
          Yeni servis kaydı oluşturun. Tanımlar sayfasından cihaz türü, marka ve
          model ekleyebilirsiniz.
        </p>
      </div>

      {listError ? (
        <p className="text-sm text-destructive" role="alert">
          {listError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex gap-6">
          <div className="min-w-0 flex-1 space-y-6">
            <Card className="border-slate-200/80 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Müşteri bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="customerName">
                    Ad soyad <span className="text-destructive">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCariDialogOpen(true);
                      setCariSearch("");
                      setCariRows([]);
                    }}
                  >
                    <Building2 className="mr-1 size-4" />
                    Cari Seç
                  </Button>
                </div>
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
                      onChange={(e) => {
                        field.onChange(e);
                        if (!e.target.value.trim()) {
                          setCustomerResults([]);
                          setCustomerPanelOpen(false);
                        }
                      }}
                      onBlur={field.onBlur}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setCustomerPanelOpen(false);
                        }
                      }}
                      ref={field.ref}
                    />
                  )}
                />
                {errors.customerName ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.customerName.message}
                  </p>
                ) : null}
                {selectedCariId && selectedCariName ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
                    <span>🏢 {selectedCariName}</span>
                    <button
                      type="button"
                      className="text-slate-500 hover:text-slate-800"
                      onClick={() => {
                        setSelectedCariId(null);
                        setSelectedCariName(null);
                      }}
                    >
                      ✕
                    </button>
                  </div>
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
                  <span className="text-sm font-medium">
                    Cihaz kargo ile geldi
                  </span>
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
                  <span className="text-sm font-medium">
                    Seri numarası yok
                  </span>
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
              <Label htmlFor="physicalDamage">
                Fiziksel hasar / dış görünüm
              </Label>
              <Textarea
                id="physicalDamage"
                rows={3}
                {...register("physicalDamage")}
              />
            </div>
          </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Kaydediliyor…" : "Kaydet"}
              </Button>
            </div>
          </div>

          <div className="w-96 shrink-0">
            {customerPanelOpen && customerResults.length > 0 ? (
              <aside className="sticky top-4 rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-4">
                  <h3 className="text-sm font-medium text-slate-900">Geçmiş Kayıtlar</h3>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {customerLoading ? (
                    <div className="flex items-center gap-2 px-4 py-4 text-sm text-slate-600">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Müşteri aranıyor...
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {customerResults.map((customer) => (
                        <div key={customer.id} className="p-3">
                          <div className="mb-2">
                            <p className="font-semibold text-slate-900">{customer.name}</p>
                            <p className="text-sm text-slate-500">
                              {customer.phone ?? "Telefon yok"}
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            {customer.orders.map((order) => (
                              <div
                                key={order.id}
                                className="rounded-md px-2 py-2 transition-colors hover:bg-slate-50"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm text-slate-700">
                                    {order.orderNumber ?? "—"} | {orderSummary(order)}
                                  </p>
                                  <button
                                    type="button"
                                    className="text-sm font-medium text-primary hover:underline"
                                    onClick={() => setPendingSelection({ customer, order })}
                                  >
                                    Seç
                                  </button>
                                </div>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  Seri: {order.serialNo ?? "Yok"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </form>

      <AlertDialog open={pendingSelection !== null} onOpenChange={(open) => !open && setPendingSelection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ne aktarılsın?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingSelection ? (
                <>
                  <span className="block font-medium text-slate-800">
                    {pendingSelection.customer.name}
                  </span>
                  <span className="block">
                    {orderSummary(pendingSelection.order)}
                  </span>
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 px-3 py-3 text-left hover:bg-slate-50"
              onClick={() => {
                if (!pendingSelection) return;
                applyOnlyCustomer(pendingSelection.customer);
                setPendingSelection(null);
              }}
            >
              <p className="font-medium text-slate-900">Sadece Müşteri Bilgileri</p>
              <p className="text-sm text-slate-600">İsim ve telefon aktarılır</p>
            </button>
            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 px-3 py-3 text-left hover:bg-slate-50"
              onClick={() => {
                if (!pendingSelection) return;
                void applyOrderToForm(
                  pendingSelection.customer,
                  pendingSelection.order,
                );
                setPendingSelection(null);
              }}
            >
              <p className="font-medium text-slate-900">Müşteri + Cihaz Bilgileri</p>
              <p className="text-sm text-slate-600">
                İsim, telefon, cihaz türü, marka, model ve seri no aktarılır
              </p>
            </button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={cariDialogOpen} onOpenChange={setCariDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cari Seç</DialogTitle>
            <DialogDescription>En az 2 karakterle cari arayın.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="İsim, telefon veya vergi no ara..."
              value={cariSearch}
              onChange={(e) => setCariSearch(e.target.value)}
            />
            <div className="max-h-72 overflow-y-auto rounded-md border border-slate-200">
              {cariLoading ? (
                <p className="px-3 py-3 text-sm text-slate-600">Yükleniyor...</p>
              ) : cariRows.length === 0 ? (
                <p className="px-3 py-3 text-sm text-slate-600">Sonuç bulunamadı</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cariRows.map((cari) => (
                    <button
                      key={cari.id}
                      type="button"
                      className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50"
                      onClick={() => {
                        setValue("customerName", cari.name, { shouldDirty: true });
                        setValue("phone", normalizePhoneForInput(cari.phone), { shouldDirty: true });
                        setSelectedCariId(cari.id);
                        setSelectedCariName(cari.name);
                        setCariDialogOpen(false);
                        toast.success(`Cari seçildi: ${cari.name}`);
                      }}
                    >
                      <div>
                        <p className="font-medium text-slate-900">{cari.name}</p>
                        <p className="text-xs text-slate-500">{cari.phone ?? "Telefon yok"}</p>
                      </div>
                      <span className="text-xs text-slate-500">{cari.taxOrTcNo ?? "—"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
