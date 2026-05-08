"use client";

import { Loader2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MutableRefObject,
  type RefObject,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

type IdName = { id: string; name: string };

const nativeSelectClassName =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60";

function handleEnterKey(
  e: KeyboardEvent<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >,
  nextRef: RefObject<HTMLElement | null>,
) {
  if (e.key !== "Enter") return;
  if (e.currentTarget instanceof HTMLTextAreaElement && e.shiftKey) return;
  e.preventDefault();
  nextRef.current?.focus();
}

type SecondHandFormValues = {
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
  notes: string;
};

export type SecondHandRegisterInfo = {
  deviceCode: string;
  sellerName: string;
  sellerPhone: string;
  deviceName: string;
  purchasePrice: number;
};

const defaultSecondHand: SecondHandFormValues = {
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
  notes: "",
};

export function SecondHandTogglePair({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-800">{label}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            value
              ? "bg-emerald-600 text-white shadow-sm"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
          )}
        >
          Var
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            !value
              ? "bg-red-600 text-white shadow-sm"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
          )}
        >
          Yok
        </button>
      </div>
    </div>
  );
}

export function SecondHandDeviceForm(props: {
  onRegistered?: (info: SecondHandRegisterInfo) => void;
}) {
  const { onRegistered } = props;
  const [deviceTypes, setDeviceTypes] = useState<IdName[]>([]);
  const [brands, setBrands] = useState<IdName[]>([]);
  const [models, setModels] = useState<IdName[]>([]);
  const [metaError, setMetaError] = useState<string | null>(null);

  const sellerNameRef = useRef<HTMLInputElement>(null);
  const sellerPhoneRef = useRef<HTMLInputElement>(null);
  const sellerTcNoRef = useRef<HTMLInputElement>(null);
  const deviceTypeRef = useRef<HTMLSelectElement>(null);
  const brandRef = useRef<HTMLSelectElement>(null);
  const modelRef = useRef<HTMLSelectElement>(null);
  const serialNoRef = useRef<HTMLInputElement>(null);
  const purchasePriceRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const { register, control, handleSubmit, watch, setValue, reset, formState } =
    useForm<SecondHandFormValues>({
      defaultValues: defaultSecondHand,
    });

  const deviceTypeId = watch("deviceTypeId");
  const brandId = watch("brandId");
  const noSerialNo = watch("noSerialNo");
  const values = watch();

  const isDirty = useMemo(() => {
    const t = [
      values.sellerName,
      values.sellerPhone,
      values.sellerTcNo,
      values.serialNo,
      values.purchasePrice,
      values.notes,
    ].some((v) => (v ?? "").trim() !== "");
    const sel =
      values.deviceTypeId !== "" ||
      values.brandId !== "" ||
      values.deviceModelId !== "";
    const toggles =
      values.hasInvoice || values.hasWarranty || values.hasBox || values.noSerialNo;
    return t || sel || toggles;
  }, [values]);

  useEffect(() => {
    window.__formIsDirty = isDirty;
    return () => {
      window.__formIsDirty = false;
    };
  }, [isDirty]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/device-types")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setDeviceTypes(data as IdName[]);
          setMetaError(null);
        } else {
          setDeviceTypes([]);
          setMetaError("Cihaz türleri yüklenemedi");
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
        if (!cancelled) setBrands(Array.isArray(data) ? (data as IdName[]) : []);
      })
      .catch(() => {
        if (!cancelled) setBrands([]);
      });
    return () => {
      cancelled = true;
    };
  }, [deviceTypeId, setValue]);

  useEffect(() => {
    setValue("deviceModelId", "");
    setModels([]);
    if (!brandId) return;
    let cancelled = false;
    void fetch(`/api/models?brandId=${encodeURIComponent(brandId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setModels(Array.isArray(data) ? (data as IdName[]) : []);
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      });
    return () => {
      cancelled = true;
    };
  }, [brandId, setValue]);

  const onSubmit = useCallback(
    async (data: SecondHandFormValues) => {
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

      const hasDevice =
        Boolean(data.deviceTypeId) ||
        Boolean(data.brandId) ||
        Boolean(data.deviceModelId);
      if (hasDevice) {
        if (!data.deviceTypeId || !data.brandId || !data.deviceModelId) {
          toast.error("Cihaz türü, marka ve modeli birlikte seçin");
          return;
        }
      }

      try {
        const res = await fetch("/api/second-hand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sellerName: name,
            sellerPhone: data.sellerPhone,
            sellerTcNo: data.sellerTcNo.trim() || undefined,
            deviceTypeId: data.deviceTypeId || undefined,
            brandId: data.brandId || undefined,
            deviceModelId: data.deviceModelId || undefined,
            serialNo: data.noSerialNo ? undefined : data.serialNo.trim() || undefined,
            noSerialNo: data.noSerialNo,
            hasInvoice: data.hasInvoice,
            hasWarranty: data.hasWarranty,
            hasBox: data.hasBox,
            purchasePrice: price,
            notes: data.notes.trim() || undefined,
          }),
        });
        const json = (await res.json()) as {
          deviceCode?: string;
          error?: string;
          details?: string;
        };
        if (!res.ok) {
          const base = json.error ?? "Kayıt oluşturulamadı";
          toast.error(
            json.details ? `${base}: ${json.details}` : base,
          );
          return;
        }
        if (json.deviceCode) {
          toast.success(`Kayıt oluşturuldu! No: #${json.deviceCode}`);
          const dt = deviceTypes.find((x) => x.id === data.deviceTypeId)?.name;
          const br = brands.find((x) => x.id === data.brandId)?.name;
          const md = models.find((x) => x.id === data.deviceModelId)?.name;
          const deviceName = [dt, br, md].filter(Boolean).join(" · ") || "—";
          onRegistered?.({
            deviceCode: json.deviceCode,
            sellerName: name,
            sellerPhone: data.sellerPhone,
            deviceName,
            purchasePrice: price,
          });
        } else {
          toast.success("Kayıt oluşturuldu");
        }
        reset(defaultSecondHand);
        window.__formIsDirty = false;
      } catch {
        toast.error("Bağlantı hatası");
      }
    },
    [reset, onRegistered, deviceTypes, brands, models],
  );

  const regSellerName = register("sellerName");
  const regSellerTcNo = register("sellerTcNo");
  const regDeviceTypeId = register("deviceTypeId");
  const regBrandId = register("brandId");
  const regDeviceModelId = register("deviceModelId");
  const regSerialNo = register("serialNo");
  const regPurchasePrice = register("purchasePrice");
  const regNotes = register("notes");

  const sellerNameRefCallback = useCallback(
    (el: HTMLInputElement | null) => {
      regSellerName.ref(el);
      (sellerNameRef as MutableRefObject<HTMLInputElement | null>).current = el;
    },
    [regSellerName],
  );

  const sellerTcNoRefCallback = useCallback(
    (el: HTMLInputElement | null) => {
      regSellerTcNo.ref(el);
      (sellerTcNoRef as MutableRefObject<HTMLInputElement | null>).current = el;
    },
    [regSellerTcNo],
  );

  const deviceTypeRefCallback = useCallback(
    (el: HTMLSelectElement | null) => {
      regDeviceTypeId.ref(el);
      (deviceTypeRef as MutableRefObject<HTMLSelectElement | null>).current = el;
    },
    [regDeviceTypeId],
  );

  const brandRefCallback = useCallback(
    (el: HTMLSelectElement | null) => {
      regBrandId.ref(el);
      (brandRef as MutableRefObject<HTMLSelectElement | null>).current = el;
    },
    [regBrandId],
  );

  const modelRefCallback = useCallback(
    (el: HTMLSelectElement | null) => {
      regDeviceModelId.ref(el);
      (modelRef as MutableRefObject<HTMLSelectElement | null>).current = el;
    },
    [regDeviceModelId],
  );

  const serialNoRefCallback = useCallback(
    (el: HTMLInputElement | null) => {
      regSerialNo.ref(el);
      (serialNoRef as MutableRefObject<HTMLInputElement | null>).current = el;
    },
    [regSerialNo],
  );

  const purchasePriceRefCallback = useCallback(
    (el: HTMLInputElement | null) => {
      regPurchasePrice.ref(el);
      (purchasePriceRef as MutableRefObject<HTMLInputElement | null>).current = el;
    },
    [regPurchasePrice],
  );

  const notesRefCallback = useCallback(
    (el: HTMLTextAreaElement | null) => {
      regNotes.ref(el);
      (notesRef as MutableRefObject<HTMLTextAreaElement | null>).current = el;
    },
    [regNotes],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          İkinci el cihaz alımı
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Satıcı ve cihaz bilgilerini girerek stok dışı ikinci el alım kaydı
          oluşturun.
        </p>
      </div>

      {metaError ? (
        <p className="text-sm text-destructive" role="alert">
          {metaError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Satıcı bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="sh-sellerName">
                Ad soyad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sh-sellerName"
                autoComplete="name"
                autoFocus
                {...regSellerName}
                ref={sellerNameRefCallback}
                onKeyDown={(e) => handleEnterKey(e, sellerPhoneRef)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="sh-phone">Telefon (+90)</Label>
              <Controller
                name="sellerPhone"
                control={control}
                render={({ field }) => (
                  <TrPhoneInput
                    ref={sellerPhoneRef}
                    id="sh-phone"
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    onKeyDown={(e) => handleEnterKey(e, sellerTcNoRef)}
                  />
                )}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="sh-tc">TC kimlik no</Label>
              <Input
                id="sh-tc"
                inputMode="numeric"
                maxLength={11}
                {...regSellerTcNo}
                ref={sellerTcNoRefCallback}
                onKeyDown={(e) => handleEnterKey(e, deviceTypeRef)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Cihaz bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="sh-dt">Cihaz türü</Label>
              <select
                id="sh-dt"
                className={nativeSelectClassName}
                {...regDeviceTypeId}
                ref={deviceTypeRefCallback}
                onKeyDown={(e) => handleEnterKey(e, brandRef)}
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
              <Label htmlFor="sh-brand">Marka</Label>
              <select
                id="sh-brand"
                className={nativeSelectClassName}
                disabled={!deviceTypeId}
                {...regBrandId}
                ref={brandRefCallback}
                onKeyDown={(e) => handleEnterKey(e, modelRef)}
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
              <Label htmlFor="sh-model">Model</Label>
              <select
                id="sh-model"
                className={nativeSelectClassName}
                disabled={!brandId}
                {...regDeviceModelId}
                ref={modelRefCallback}
                onKeyDown={(e) => handleEnterKey(e, serialNoRef)}
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
              <Label htmlFor="sh-serial">Seri no</Label>
              <Input
                id="sh-serial"
                disabled={noSerialNo}
                {...regSerialNo}
                ref={serialNoRefCallback}
                onKeyDown={(e) => handleEnterKey(e, purchasePriceRef)}
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

        <Card className="border-slate-200/80 bg-white shadow-sm">
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

        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Satın alım</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="sh-price">
                Satın alınan fiyat (₺){" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  ₺
                </span>
                <Input
                  id="sh-price"
                  type="text"
                  inputMode="decimal"
                  className="pl-8"
                  placeholder="0,00"
                  {...regPurchasePrice}
                  ref={purchasePriceRefCallback}
                  onKeyDown={(e) => handleEnterKey(e, notesRef)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sh-notes">Notlar</Label>
              <Textarea
                id="sh-notes"
                rows={3}
                placeholder="Opsiyonel açıklama…"
                {...regNotes}
                ref={notesRefCallback}
                onKeyDown={(e) => handleEnterKey(e, submitRef)}
              />
            </div>
          </CardContent>
        </Card>

        <button
          type="submit"
          ref={submitRef}
          disabled={formState.isSubmitting}
          className={cn(
            buttonVariants(),
            "w-full bg-violet-600 text-white hover:bg-violet-700 sm:w-auto",
          )}
        >
          {formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Kaydediliyor…
            </>
          ) : (
            "İkinci el kaydını oluştur"
          )}
        </button>
      </form>
    </div>
  );
}
