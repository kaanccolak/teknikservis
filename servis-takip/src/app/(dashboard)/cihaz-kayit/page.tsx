"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent, RefObject } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  SecondHandDeviceForm,
  type SecondHandRegisterInfo,
} from "./second-hand-form";

import { WhatsAppBrandIcon } from "@/components/whatsapp-brand-icon";
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
  DialogFooter,
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
import SuggestionTextarea from "@/components/SuggestionTextarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrPhoneInput } from "@/components/tr-phone-input";
import {
  parseDatetimeLocal,
  toDatetimeLocalValue,
} from "@/lib/datetime-local";
import { cn } from "@/lib/utils";
import {
  formatPriceForWa,
  sendWhatsApp,
  WA_SECOND_HAND_PURCHASE,
  WA_TEMPLATES,
} from "@/lib/whatsapp";
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
type BayiSuggestionItem = {
  id: string;
  firmaAdi: string;
  yetkiliKisi: string;
  phone: string;
  phoneDigits: string;
};
type CariRow = {
  id: string;
  name: string;
  phone: string | null;
  taxOrTcNo: string | null;
};
type BayiRow = {
  id: string;
  bayiCode: string;
  firmaAdi: string;
  yetkiliKisi: string;
  phone: string;
  tcVergiNo: string;
};

const nativeSelectClassName =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60";

function handleEnterKey(
  e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  nextRef: RefObject<HTMLElement | null>,
) {
  if (e.key !== "Enter") return;
  if (e.currentTarget instanceof HTMLTextAreaElement && e.shiftKey) return;
  e.preventDefault();
  nextRef.current?.focus();
}

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
  estimatedPrice: "",
};

function getDefaultValues(): CreateServiceOrderFormValues {
  return {
    ...defaultValuesBase,
    arrivedAt: toDatetimeLocalValue(new Date()),
  };
}

function deviceSummaryFromLists(
  data: Pick<
    CreateServiceOrderFormValues,
    "deviceTypeId" | "brandId" | "deviceModelId"
  >,
  deviceTypes: IdName[],
  brands: IdName[],
  models: IdName[],
) {
  const dt = deviceTypes.find((x) => x.id === data.deviceTypeId)?.name;
  const br = brands.find((x) => x.id === data.brandId)?.name;
  const md = models.find((x) => x.id === data.deviceModelId)?.name;
  return [dt, br, md].filter(Boolean).join(" · ") || "—";
}

function CihazKayitServiceInner({
  onServiceOrderCreated,
}: {
  onServiceOrderCreated: (info: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    serialNo: string | null;
    deviceModel: string;
    brand: string;
    deviceName: string;
  }) => void;
}) {
  const [deviceTypes, setDeviceTypes] = useState<IdName[]>([]);
  const [brands, setBrands] = useState<IdName[]>([]);
  const [models, setModels] = useState<IdName[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [customerResults, setCustomerResults] = useState<CustomerSearchItem[]>([]);
  const [bayiSuggestions, setBayiSuggestions] = useState<BayiSuggestionItem[]>([]);
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
  const [bayiDialogOpen, setBayiDialogOpen] = useState(false);
  const [bayiSearch, setBayiSearch] = useState("");
  const [bayiRows, setBayiRows] = useState<BayiRow[]>([]);
  const [bayiLoading, setBayiLoading] = useState(false);
  const [selectedBayiId, setSelectedBayiId] = useState<string | null>(null);
  const [selectedBayiName, setSelectedBayiName] = useState<string | null>(null);
  const [showInlineBayiForm, setShowInlineBayiForm] = useState(false);
  const [inlineBayiSaving, setInlineBayiSaving] = useState(false);
  const [inlineBayiForm, setInlineBayiForm] = useState({
    firmaAdi: "",
    yetkiliKisi: "",
    phone: "",
    vergiDairesi: "",
    tcVergiNo: "",
  });
  const [isReturn, setIsReturn] = useState(false);
  const skipDeviceCascade = useRef(false);
  const skipBrandCascade = useRef(false);

  const customerNameRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const deviceTypeRef = useRef<HTMLSelectElement | null>(null);
  const brandRef = useRef<HTMLSelectElement | null>(null);
  const modelRef = useRef<HTMLSelectElement | null>(null);
  const serialNoRef = useRef<HTMLInputElement | null>(null);
  const complaintRef = useRef<HTMLTextAreaElement | null>(null);
  const accessoriesRef = useRef<HTMLTextAreaElement | null>(null);
  const physicalDamageRef = useRef<HTMLTextAreaElement | null>(null);
  const submitRef = useRef<HTMLButtonElement | null>(null);

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
      formValues.estimatedPrice,
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
      setBayiSuggestions([]);
      setCustomerPanelOpen(false);
      return;
    }
    const t = window.setTimeout(async () => {
      setCustomerLoading(true);
      try {
        const res = await fetch(`/api/customers/search?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as
          | { customers: CustomerSearchItem[]; bayiler: BayiSuggestionItem[] }
          | { error?: string };
        if (!res.ok) {
          setCustomerResults([]);
          setBayiSuggestions([]);
          setCustomerPanelOpen(false);
          return;
        }
        const rows = (data as { customers: CustomerSearchItem[] }).customers ?? [];
        const bayiRows =
          (data as { bayiler: BayiSuggestionItem[] }).bayiler ?? [];
        setCustomerResults(rows);
        setBayiSuggestions(bayiRows);
        setCustomerPanelOpen(rows.length > 0 || bayiRows.length > 0);
      } catch {
        setCustomerResults([]);
        setBayiSuggestions([]);
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

  useEffect(() => {
    if (!bayiDialogOpen) return;
    const q = bayiSearch.trim();
    const t = window.setTimeout(async () => {
      setBayiLoading(true);
      try {
        const qs = q ? `?search=${encodeURIComponent(q)}` : "";
        const res = await fetch(`/api/bayiler${qs}`);
        const data = (await res.json()) as BayiRow[] | { error?: string };
        if (!res.ok) {
          setBayiRows([]);
          return;
        }
        setBayiRows(data as BayiRow[]);
      } catch {
        setBayiRows([]);
      } finally {
        setBayiLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [bayiDialogOpen, bayiSearch]);

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
    setSelectedBayiId(null);
    setSelectedBayiName(null);
    setCustomerPanelOpen(false);
    toast.success("Bilgiler aktarıldı");
  }

  function applyOnlyCustomer(customer: CustomerSearchItem) {
    const phoneInput = normalizePhoneForInput(customer.phone);
    setValue("customerName", customer.name, { shouldDirty: true });
    setValue("phone", phoneInput, { shouldDirty: true });
    setSelectedBayiId(null);
    setSelectedBayiName(null);
    setCustomerPanelOpen(false);
    toast.success("Bilgiler aktarıldı");
  }

  function applyBayiToForm(bayi: BayiSuggestionItem) {
    setValue("customerName", bayi.yetkiliKisi, { shouldDirty: true });
    setValue("phone", normalizePhoneForInput(bayi.phone), { shouldDirty: true });
    setSelectedBayiId(bayi.id);
    setSelectedBayiName(bayi.firmaAdi);
    setCustomerPanelOpen(false);
    toast.success(`Bayi seçildi: ${bayi.firmaAdi}`);
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
        body: JSON.stringify({
          ...payload,
          cariId: selectedCariId ?? undefined,
          bayiId: selectedBayiId ?? undefined,
          isReturn,
        }),
      });
      const json = (await res.json()) as {
        id?: string;
        orderNumber?: string;
        order?: {
          id: string;
          customerName: string;
          customerPhone: string;
          serialNo: string | null;
          deviceModel: string;
          brand: string;
        };
        error?: string;
      };

      if (!res.ok) {
        toast.error(json.error ?? "Kayıt başarısız");
        return;
      }

      if (json.orderNumber && json.order) {
        toast.success("Kayıt oluşturuldu");
        const deviceName = deviceSummaryFromLists(
          payload,
          deviceTypes,
          brands,
          models,
        );
        onServiceOrderCreated({
          id: json.order.id,
          orderNumber: json.orderNumber,
          customerName: json.order.customerName,
          customerPhone: json.order.customerPhone,
          serialNo: json.order.serialNo,
          deviceModel: json.order.deviceModel,
          brand: json.order.brand,
          deviceName,
        });
        reset(getDefaultValues());
        window.__formIsDirty = false;
        setShowDateEditor(false);
        setCustomerResults([]);
        setCustomerPanelOpen(false);
        setPendingSelection(null);
        setSelectedCariId(null);
        setSelectedCariName(null);
        setSelectedBayiId(null);
        setSelectedBayiName(null);
        setIsReturn(false);
      }
    } catch {
      toast.error("Bağlantı hatası. Tekrar deneyin.");
    }
  }

  async function createInlineBayi() {
    if (inlineBayiForm.firmaAdi.trim().length < 2) {
      toast.error("Firma adı zorunludur");
      return;
    }
    if (inlineBayiForm.yetkiliKisi.trim().length < 2) {
      toast.error("Yetkili kişi zorunludur");
      return;
    }
    const phoneDigits = inlineBayiForm.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10 || !phoneDigits.startsWith("5")) {
      toast.error("Telefon 10 haneli ve 5 ile başlamalıdır");
      return;
    }
    if (inlineBayiForm.tcVergiNo.trim().length < 10) {
      toast.error("TC/Vergi no zorunludur");
      return;
    }
    setInlineBayiSaving(true);
    try {
      const res = await fetch("/api/bayiler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inlineBayiForm),
      });
      const data = (await res.json()) as BayiRow | { error?: string };
      if (!res.ok) {
        toast.error((data as { error?: string }).error ?? "Bayi eklenemedi");
        return;
      }
      const created = data as BayiRow;
      setSelectedBayiId(created.id);
      setSelectedBayiName(created.firmaAdi);
      setValue("customerName", created.yetkiliKisi, { shouldDirty: true });
      setValue("phone", normalizePhoneForInput(created.phone), { shouldDirty: true });
      setShowInlineBayiForm(false);
      setInlineBayiForm({
        firmaAdi: "",
        yetkiliKisi: "",
        phone: "",
        vergiDairesi: "",
        tcVergiNo: "",
      });
      setBayiSearch("");
      setBayiDialogOpen(false);
      toast.success(`Bayi eklendi: ${created.firmaAdi}`);
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setInlineBayiSaving(false);
    }
  }

  return (
    <div className="space-y-6">
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
                  <div className="flex items-center gap-2">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBayiDialogOpen(true);
                        setBayiSearch("");
                        setShowInlineBayiForm(false);
                      }}
                    >
                      Bayi Seç
                    </Button>
                  </div>
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
                          setBayiSuggestions([]);
                          setCustomerPanelOpen(false);
                        }
                      }}
                      onBlur={field.onBlur}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setCustomerPanelOpen(false);
                          return;
                        }
                        handleEnterKey(e, phoneRef);
                      }}
                      ref={(el) => {
                        field.ref(el);
                        customerNameRef.current = el as HTMLInputElement | null;
                      }}
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
                {selectedBayiId && selectedBayiName ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
                    <span>Bayi: {selectedBayiName}</span>
                    <button
                      type="button"
                      className="text-slate-500 hover:text-slate-800"
                      onClick={() => {
                        setSelectedBayiId(null);
                        setSelectedBayiName(null);
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
                      ref={phoneRef}
                      id="phone"
                      aria-invalid={!!errors.phone}
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      onKeyDown={(e) => handleEnterKey(e, deviceTypeRef)}
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
            <CardTitle>Teslim Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={isReturn}
                  onChange={(e) => setIsReturn(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                Cihaz Tekrar Geldi
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={arrivedByCargo}
                  onChange={(e) =>
                    setValue("arrivedByCargo", e.target.checked, {
                      shouldDirty: true,
                    })
                  }
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                Cihaz kargo ile geldi
              </label>
            </div>
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
                      ref={deviceTypeRef}
                      id="form-device-type"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      onKeyDown={(e) => handleEnterKey(e, brandRef)}
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
                      ref={brandRef}
                      id="form-brand"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      onKeyDown={(e) => handleEnterKey(e, modelRef)}
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
                      ref={modelRef}
                      id="form-model"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      onKeyDown={(e) => handleEnterKey(e, serialNoRef)}
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
                    onKeyDown={(e) => handleEnterKey(e, complaintRef)}
                    ref={(el) => {
                      field.ref(el);
                      serialNoRef.current = el as HTMLInputElement | null;
                    }}
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
              <Controller
                name="complaint"
                control={control}
                render={({ field }) => (
                  <SuggestionTextarea
                    field="complaint"
                    id="complaint"
                    name={field.name}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={(el) => {
                      field.ref(el);
                      complaintRef.current = el;
                    }}
                    deviceTypeId={deviceTypeId || undefined}
                    rows={3}
                    placeholder="Müşterinin bildirdiği arıza veya şikayet..."
                    nextRef={accessoriesRef}
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessories">Cihazla gelen aksesuarlar</Label>
              <Controller
                name="accessories"
                control={control}
                render={({ field }) => (
                  <SuggestionTextarea
                    field="accessories"
                    id="accessories"
                    name={field.name}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={(el) => {
                      field.ref(el);
                      accessoriesRef.current = el;
                    }}
                    deviceTypeId={deviceTypeId || undefined}
                    rows={2}
                    placeholder="Cihazla birlikte gelen aksesuarlar..."
                    nextRef={physicalDamageRef}
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="physicalDamage">
                Fiziksel hasar / dış görünüm
              </Label>
              <Controller
                name="physicalDamage"
                control={control}
                render={({ field }) => (
                  <SuggestionTextarea
                    field="physicalCondition"
                    id="physicalDamage"
                    name={field.name}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={(el) => {
                      field.ref(el);
                      physicalDamageRef.current = el;
                    }}
                    deviceTypeId={deviceTypeId || undefined}
                    rows={2}
                    placeholder="Fiziksel hasar veya dış görünüm notları..."
                    nextRef={submitRef}
                  />
                )}
              />
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

            <div className="flex justify-end">
              <Button
                ref={submitRef}
                type="submit"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Kaydediliyor…" : "Kaydet"}
              </Button>
            </div>
          </div>

          <div className="w-96 shrink-0">
            {customerPanelOpen ? (
              <aside className="sticky top-4 rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-4">
                  <h3 className="text-sm font-medium text-slate-900">Geçmiş Kayıtlar</h3>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {customerLoading ? (
                    <div className="flex items-center gap-2 px-4 py-4 text-sm text-slate-600">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Aranıyor...
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
                      {bayiSuggestions.length > 0 ? (
                        <div className="p-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Bayi Önerileri
                          </p>
                          <div className="space-y-1.5">
                            {bayiSuggestions.map((bayi) => (
                              <button
                                key={bayi.id}
                                type="button"
                                className="flex w-full items-start justify-between rounded-md px-2 py-2 text-left transition-colors hover:bg-slate-50"
                                onClick={() => applyBayiToForm(bayi)}
                              >
                                <div>
                                  <p className="text-sm font-medium text-slate-900">
                                    {bayi.yetkiliKisi}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {bayi.firmaAdi} · {bayi.phone}
                                  </p>
                                </div>
                                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                                  Bayi
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
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

      <Dialog open={bayiDialogOpen} onOpenChange={setBayiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bayi Seç</DialogTitle>
            <DialogDescription>Bayi arayın veya yeni bayi ekleyin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Firma adı, yetkili veya vergi no ara..."
              value={bayiSearch}
              onChange={(e) => setBayiSearch(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowInlineBayiForm((v) => !v)}
              >
                Yeni Bayi Ekle
              </Button>
            </div>
            {showInlineBayiForm ? (
              <div className="space-y-2 rounded-md border border-slate-200 p-3">
                <Input
                  placeholder="Firma Adı"
                  value={inlineBayiForm.firmaAdi}
                  onChange={(e) => setInlineBayiForm((p) => ({ ...p, firmaAdi: e.target.value }))}
                />
                <Input
                  placeholder="Yetkili Kişi"
                  value={inlineBayiForm.yetkiliKisi}
                  onChange={(e) => setInlineBayiForm((p) => ({ ...p, yetkiliKisi: e.target.value }))}
                />
                <TrPhoneInput
                  value={inlineBayiForm.phone}
                  onValueChange={(v) => setInlineBayiForm((p) => ({ ...p, phone: v }))}
                />
                <Input
                  placeholder="Vergi Dairesi (opsiyonel)"
                  value={inlineBayiForm.vergiDairesi}
                  onChange={(e) => setInlineBayiForm((p) => ({ ...p, vergiDairesi: e.target.value }))}
                />
                <Input
                  placeholder="TC/Vergi No"
                  value={inlineBayiForm.tcVergiNo}
                  onChange={(e) => setInlineBayiForm((p) => ({ ...p, tcVergiNo: e.target.value }))}
                />
                <div className="flex justify-end">
                  <Button type="button" size="sm" onClick={() => void createInlineBayi()} disabled={inlineBayiSaving}>
                    {inlineBayiSaving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </div>
            ) : null}
            <div className="max-h-72 overflow-y-auto rounded-md border border-slate-200">
              {bayiLoading ? (
                <p className="px-3 py-3 text-sm text-slate-600">Yükleniyor...</p>
              ) : bayiRows.length === 0 ? (
                <p className="px-3 py-3 text-sm text-slate-600">Sonuç bulunamadı</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {bayiRows.map((bayi) => (
                    <button
                      key={bayi.id}
                      type="button"
                      className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50"
                      onClick={() => {
                        setValue("customerName", bayi.yetkiliKisi, { shouldDirty: true });
                        setValue("phone", normalizePhoneForInput(bayi.phone), {
                          shouldDirty: true,
                        });
                        setSelectedBayiId(bayi.id);
                        setSelectedBayiName(bayi.firmaAdi);
                        setBayiDialogOpen(false);
                        toast.success(`Bayi seçildi: ${bayi.firmaAdi}`);
                      }}
                    >
                      <div>
                        <p className="font-medium text-slate-900">{bayi.firmaAdi}</p>
                        <p className="text-xs text-slate-500">
                          {bayi.yetkiliKisi} · {bayi.phone}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">{bayi.bayiCode}</span>
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

type WaPostCreateDialog =
  | {
      kind: "service";
      id: string;
      orderNumber: string;
      customerName: string;
      customerPhone: string;
      serialNo: string | null;
      deviceModel: string;
      brand: string;
      deviceName: string;
    }
  | ({ kind: "secondhand" } & SecondHandRegisterInfo);

function CihazKayitRoot() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const modeParam = searchParams.get("mode");
  const [mode, setMode] = useState<"service" | "secondhand">(() =>
    modeParam === "secondhand" ? "secondhand" : "service",
  );
  const [waShopReady, setWaShopReady] = useState(false);
  const [createdWa, setCreatedWa] = useState<WaPostCreateDialog | null>(null);
  const [waSending, setWaSending] = useState(false);

  useEffect(() => {
    setMode(modeParam === "secondhand" ? "secondhand" : "service");
  }, [modeParam]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/shop")
      .then((r) => r.json())
      .then(
        (j: {
          waEnabled?: boolean;
          waPhoneNumberId?: string | null;
          waTokenConfigured?: boolean;
        }) => {
          if (cancelled) return;
          setWaShopReady(
            Boolean(
              j.waEnabled &&
                j.waPhoneNumberId?.trim() &&
                j.waTokenConfigured,
            ),
          );
        },
      )
      .catch(() => {
        if (!cancelled) setWaShopReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function setModeNav(next: "service" | "secondhand") {
    setMode(next);
    if (next === "secondhand") {
      router.replace("/cihaz-kayit?mode=secondhand", { scroll: false });
    } else {
      router.replace("/cihaz-kayit", { scroll: false });
    }
  }

  const waPhoneOk =
    createdWa &&
    (createdWa.kind === "service"
      ? (createdWa.customerPhone ?? "").replace(/\D/g, "").length >= 10
      : (createdWa.sellerPhone ?? "").replace(/\D/g, "").length >= 10);

  const canSendCreatedWa = Boolean(waShopReady && waPhoneOk);

  async function sendCreatedWhatsApp() {
    if (!createdWa) return;
    setWaSending(true);
    try {
      if (createdWa.kind === "service") {
        const serviceId = createdWa.id;
        await sendWhatsApp(
          createdWa.customerPhone,
          WA_TEMPLATES.in_service.name,
          WA_TEMPLATES.in_service.getParams({
            customer: { name: createdWa.customerName },
            serialNo: createdWa.serialNo,
            deviceModel: createdWa.deviceModel
              ? { name: createdWa.deviceModel }
              : null,
            brand: createdWa.brand ? { name: createdWa.brand } : null,
          }),
        );
        toast.success("WhatsApp mesajı gönderildi!");
        setCreatedWa(null);
        router.push(`/servis-detay/${encodeURIComponent(serviceId)}`);
      } else {
        await sendWhatsApp(
          createdWa.sellerPhone,
          WA_SECOND_HAND_PURCHASE.name,
          WA_SECOND_HAND_PURCHASE.getParams(
            createdWa.sellerName,
            createdWa.deviceName,
            formatPriceForWa(createdWa.purchasePrice),
          ),
        );
        toast.success("WhatsApp mesajı gönderildi!");
        setCreatedWa(null);
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "WhatsApp mesajı gönderilemedi",
      );
    } finally {
      setWaSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
        }}
      >
        <button
          type="button"
          onClick={() => setModeNav("service")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "2px solid",
            borderColor: mode === "service" ? "#111" : "#e5e7eb",
            background: mode === "service" ? "#111" : "white",
            color: mode === "service" ? "white" : "#374151",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          🔧 Servis kaydı
        </button>
        <button
          type="button"
          onClick={() => setModeNav("secondhand")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "2px solid",
            borderColor: mode === "secondhand" ? "#7c3aed" : "#e5e7eb",
            background: mode === "secondhand" ? "#7c3aed" : "white",
            color: mode === "secondhand" ? "white" : "#374151",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          📱 İkinci el alım
        </button>
      </div>
      {mode === "service" ? (
        <CihazKayitServiceInner
          onServiceOrderCreated={(info) =>
            setCreatedWa({
              kind: "service",
              ...info,
            })
          }
        />
      ) : (
        <SecondHandDeviceForm
          onRegistered={(info) =>
            setCreatedWa({ kind: "secondhand", ...info })
          }
        />
      )}

      <Dialog
        open={createdWa !== null}
        onOpenChange={(open) => {
          if (!open) setCreatedWa(null);
        }}
      >
        <DialogContent className="max-w-[400px] sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Kayıt Oluşturuldu!</DialogTitle>
            {createdWa?.kind === "service" ? (
              <DialogDescription>
                Müşteriye cihazın teslim alındığına dair WhatsApp mesajı göndermek
                ister misiniz?
              </DialogDescription>
            ) : (
              <DialogDescription>
                Satıcıya ikinci el alım bildirimi göndermek ister misiniz?
              </DialogDescription>
            )}
          </DialogHeader>
          {createdWa ? (
            <div className="space-y-4">
              {createdWa.kind === "service" ? (
                <div
                  className="rounded-lg px-3 py-2 text-[13px] text-slate-600"
                  style={{ background: "#f9fafb" }}
                >
                  {createdWa.customerName} — Servis Teslim Alındı
                </div>
              ) : null}
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-slate-500">Kayıt No:</span>{" "}
                  <span className="text-xl font-bold tabular-nums text-slate-900">
                    #
                    {createdWa.kind === "service"
                      ? createdWa.orderNumber
                      : createdWa.deviceCode}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">
                    {createdWa.kind === "service" ? "Müşteri" : "Satıcı"}:
                  </span>{" "}
                  <span className="font-medium text-slate-900">
                    {createdWa.kind === "service"
                      ? createdWa.customerName
                      : createdWa.sellerName}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Cihaz:</span>{" "}
                  <span className="font-medium text-slate-900">
                    {createdWa.deviceName}
                  </span>
                </p>
                {!waShopReady ? (
                  <p className="text-xs text-amber-800">
                    WhatsApp bildirimi için Şirketim sayfasından entegrasyonu
                    tamamlayın.
                  </p>
                ) : !waPhoneOk ? (
                  <p className="text-xs text-amber-800">
                    Geçerli bir telefon yok; WhatsApp gönderilemez.
                  </p>
                ) : null}
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] cursor-pointer disabled:opacity-50"
                  disabled={waSending}
                  onClick={() => {
                    if (createdWa.kind === "service") {
                      const id = createdWa.id;
                      setCreatedWa(null);
                      router.push(`/servis-detay/${encodeURIComponent(id)}`);
                    } else {
                      setCreatedWa(null);
                    }
                  }}
                >
                  Hayır
                </button>
                <button
                  type="button"
                  disabled={!canSendCreatedWa || waSending}
                  title={
                    !waShopReady
                      ? "WhatsApp entegrasyonu kapalı"
                      : !waPhoneOk
                        ? "Telefon eksik"
                        : undefined
                  }
                  onClick={() => void sendCreatedWhatsApp()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border-0 px-5 py-2 text-[13px] font-medium text-white disabled:cursor-not-allowed"
                  style={{
                    background: !canSendCreatedWa ? "#9ca3af" : "#25D366",
                    opacity: waSending ? 0.85 : 1,
                  }}
                >
                  {waSending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <WhatsAppBrandIcon size={18} />
                  )}
                  Evet, Gönder
                </button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CihazKayitPage() {
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
      <CihazKayitRoot />
    </Suspense>
  );
}
