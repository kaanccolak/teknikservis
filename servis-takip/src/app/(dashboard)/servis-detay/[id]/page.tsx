"use client";

import {
  ArrowLeft,
  Loader2,
  Pencil,
  Printer,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatServiceOrderNo } from "@/lib/service-order-number";
import { WA_TEMPLATES } from "@/lib/whatsapp";
import {
  isDeliveredServiceOrderStatus,
  serviceOrderStatusLabel,
} from "@/lib/service-order-status";
import {
  getStatusUiConfig,
  STATUS_GROUPS,
} from "@/lib/service-order-status-ui-config";
import { getStatusBadge, STATUS_CONFIG } from "@/lib/statusConfig";
import { cn } from "@/lib/utils";

type Customer = { id: string; name: string; phone: string | null };
type NamedEntity = { id: string; name: string };
type StatusLogRow = {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  note: string | null;
  createdAt: string;
};

type SparePartUsageRow = {
  id: string;
  quantity: number;
  costAtTime: number;
  sparePart: {
    id: string;
    name: string;
    partCode: string | null;
    stock: number;
  };
};

type EligibleSparePart = {
  id: string;
  name: string;
  partCode: string | null;
  stock: number;
  cost: number;
};

type ExternalServiceRow = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
};

type WaInboundMsg = {
  id: string;
  message: string;
  timestamp: string;
};

type ServiceOrderDetail = {
  id: string;
  orderNumber: string | null;
  status: string;
  externalServiceId?: string | null;
  externalNote?: string | null;
  externalService?: ExternalServiceRow | null;
  serialNo: string | null;
  noSerialNo: boolean;
  warrantyStatus: string | null;
  isTampered: boolean;
  complaint: string | null;
  accessories: string | null;
  physicalDamage: string | null;
  arrivedByCargo: boolean;
  repairFailedReason?: string | null;
  cargoInfo: string | null;
  arrivedAt: string;
  deviceTypeName: string | null;
  brandName: string | null;
  modelName: string | null;
  technicianNote: string | null;
  totalPrice: number | null;
  estimatedPrice: number | null;
  customer: Customer;
  cari?: NamedEntity | null;
  bayi?: {
    id: string;
    firmaAdi: string;
    yetkiliKisi: string;
    phone: string;
    grup?: string | null;
  } | null;
  deviceType: NamedEntity | null;
  brand: NamedEntity | null;
  deviceModel: NamedEntity | null;
  statusLogs: StatusLogRow[];
  sparePartUsages?: SparePartUsageRow[];
  deliveryType?: string | null;
  deliveryPersonName?: string | null;
  deliveryNote?: string | null;
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

function formatLogAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTry(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function bayiDiscountRate(grup: string | null | undefined): number {
  if (grup === "grup1") return 0.1;
  if (grup === "grup2") return 0.2;
  return 0;
}

function warrantyLabel(w: string | null) {
  if (w === "guaranteed") return "Garantili";
  if (w === "no_warranty") return "Garantisiz";
  return "—";
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-4">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="min-w-0 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export default function ServisDetayPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = typeof params.id === "string" ? params.id : "";
  const fromUrl = searchParams.get("from");
  const detailQuery = fromUrl ? `?from=${encodeURIComponent(fromUrl)}` : "";
  const editHref = `/servis-detay/${encodeURIComponent(id)}/duzenle${detailQuery}`;

  function resolveBackHref() {
    if (!fromUrl) return "/cihaz-sorgula";
    try {
      return decodeURIComponent(fromUrl);
    } catch {
      return "/cihaz-sorgula";
    }
  }

  function handleBack() {
    router.push(resolveBackHref());
  }

  const [order, setOrder] = useState<ServiceOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [inputPrice, setInputPrice] = useState("");
  const lastOrderPriceKey = useRef<{ id: string; totalPrice: number | null } | null>(
    null,
  );
  const [savingNote, setSavingNote] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [externalSendOpen, setExternalSendOpen] = useState(false);
  const [showRepairFailedModal, setShowRepairFailedModal] = useState(false);
  const [repairFailedReason, setRepairFailedReason] = useState("");
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryType, setDeliveryType] = useState<"self" | "other">("self");
  const [deliveryPersonName, setDeliveryPersonName] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [pendingDeliveryStatus, setPendingDeliveryStatus] = useState("");
  const [externalServicesList, setExternalServicesList] = useState<
    ExternalServiceRow[]
  >([]);
  const [loadingExternalServices, setLoadingExternalServices] = useState(false);
  const [externalSendServiceId, setExternalSendServiceId] = useState("");
  const [externalSendNote, setExternalSendNote] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [spareOptions, setSpareOptions] = useState<EligibleSparePart[]>([]);
  const [sparePartId, setSparePartId] = useState("");
  const [spareQty, setSpareQty] = useState("1");
  const [loadingSpares, setLoadingSpares] = useState(false);
  const [savingSpare, setSavingSpare] = useState(false);
  const [removingUsageId, setRemovingUsageId] = useState<string | null>(null);

  const [editingEstimated, setEditingEstimated] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [savingEstimated, setSavingEstimated] = useState(false);

  const [waShopReady, setWaShopReady] = useState(false);
  const [waSending, setWaSending] = useState(false);
  const [showWaConfirm, setShowWaConfirm] = useState(false);
  const [waConfirmStatus, setWaConfirmStatus] = useState("");
  const [waConfirmSending, setWaConfirmSending] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [waInboundMessages, setWaInboundMessages] = useState<WaInboundMsg[]>(
    [],
  );
  const [waInboundLoading, setWaInboundLoading] = useState(false);

  const nativeSelectClassName =
    "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50";

  const load = useCallback(async () => {
    if (!id) {
      setError("Geçersiz adres");
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/service-orders/${encodeURIComponent(id)}`);
      const data = (await res.json()) as ServiceOrderDetail | { error?: string };
      if (!res.ok) {
        setError(
          typeof data === "object" && data && "error" in data
            ? String((data as { error: string }).error)
            : "Kayıt yüklenemedi",
        );
        setOrder(null);
        return;
      }
      const o = data as ServiceOrderDetail;
      setOrder(o);
      setNoteDraft(o.technicianNote ?? "");
      setInputPrice(
        o.totalPrice != null && !Number.isNaN(o.totalPrice)
          ? String(o.totalPrice)
          : "",
      );
    } catch {
      setError("Bağlantı hatası");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!order) return;
    const cur = { id: order.id, totalPrice: order.totalPrice ?? null };
    const prev = lastOrderPriceKey.current;
    lastOrderPriceKey.current = cur;
    if (!prev || prev.id !== cur.id) {
      return;
    }
    if (prev.totalPrice !== cur.totalPrice) {
      setInputPrice("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca kayıt/tutar anahtarı; tam `order` döngüye yol açar
  }, [order?.id, order?.totalPrice]);

  useEffect(() => {
    if (!order || editingEstimated) return;
    setEstimatedPrice(
      order.estimatedPrice != null && !Number.isNaN(order.estimatedPrice)
        ? String(order.estimatedPrice)
        : "",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `order` tamamını eklemek senkron döngüsüne yol açabilir
  }, [order?.estimatedPrice, order?.id, editingEstimated]);

  const loadSpareOptions = useCallback(async (orderId: string) => {
    setLoadingSpares(true);
    try {
      const res = await fetch(
        `/api/spare-parts?forServiceOrderId=${encodeURIComponent(orderId)}`,
      );
      const data = (await res.json()) as EligibleSparePart[] | { error?: string };
      if (!res.ok) {
        setSpareOptions([]);
        return;
      }
      setSpareOptions(data as EligibleSparePart[]);
    } catch {
      setSpareOptions([]);
    } finally {
      setLoadingSpares(false);
    }
  }, []);

  useEffect(() => {
    if (!order?.id) {
      setSpareOptions([]);
      setSparePartId("");
      return;
    }
    void loadSpareOptions(order.id);
  }, [order?.id, loadSpareOptions]);

  const selectedSpare = spareOptions.find((p) => p.id === sparePartId);
  const spareQtyNum = Number.parseInt(spareQty, 10);
  const spareQtyValid =
    Number.isInteger(spareQtyNum) && spareQtyNum >= 1 && spareQtyNum <= (selectedSpare?.stock ?? 0);
  const insufficientSpare =
    !!selectedSpare && selectedSpare.stock < (Number.isInteger(spareQtyNum) ? spareQtyNum : 0);

  const sparePartsCostTotal = (order?.sparePartUsages ?? []).reduce(
    (acc, u) => acc + u.quantity * u.costAtTime,
    0,
  );

  const discountRate = useMemo(
    () => bayiDiscountRate(order?.bayi?.grup),
    [order?.bayi?.grup],
  );

  /** Yalnızca kullanıcı input yazarken; kayıtlı net tutar tekrar iskonto edilmez */
  const inputPricePreview = useMemo(() => {
    const raw = inputPrice.trim().replace(",", ".");
    if (!raw || discountRate <= 0) return null;
    const brutPrice = Number.parseFloat(raw);
    if (!Number.isFinite(brutPrice) || brutPrice <= 0) return null;
    const iskonto = Math.round(brutPrice * discountRate);
    const netPrice = Math.round(brutPrice * (1 - discountRate));
    return { brutPrice, iskonto, netPrice };
  }, [inputPrice, discountRate]);

  /** Kayıtlı totalPrice (net) üzerinden brüt geri hesaplama — kalıcı gösterim */
  const savedBayiDiscountBreakdown = useMemo(() => {
    const netPrice = order?.totalPrice ?? 0;
    if (netPrice <= 0 || discountRate <= 0) return null;
    const brutPrice = Math.round(netPrice / (1 - discountRate));
    const iskonto = brutPrice - netPrice;
    return { brutPrice, iskonto, netPrice, rate: discountRate };
  }, [order?.totalPrice, discountRate]);

  async function handleAddSparePart() {
    if (!order || !sparePartId || !spareQtyValid) return;
    setSavingSpare(true);
    try {
      const res = await fetch(
        `/api/service-orders/${encodeURIComponent(order.id)}/spare-parts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sparePartId,
            quantity: spareQtyNum,
          }),
        },
      );
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(j.error ?? "Parça eklenemedi");
        return;
      }
      toast.success("Parça eklendi");
      setSparePartId("");
      setSpareQty("1");
      await load();
      await loadSpareOptions(order.id);
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSavingSpare(false);
    }
  }

  async function handleRemoveSpareUsage(usageId: string) {
    if (!order) return;
    setRemovingUsageId(usageId);
    try {
      const res = await fetch(
        `/api/service-orders/${encodeURIComponent(order.id)}/spare-parts?usageId=${encodeURIComponent(usageId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        toast.error(j.error ?? "Kaldırılamadı");
        return;
      }
      toast.success("Parça kullanımı kaldırıldı");
      await load();
      await loadSpareOptions(order.id);
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setRemovingUsageId(null);
    }
  }

  async function patchOrder(body: Record<string, unknown>) {
    const res = await fetch(`/api/service-orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as ServiceOrderDetail | { error?: string };
    if (!res.ok) {
      const msg =
        typeof data === "object" && data && "error" in data
          ? String((data as { error: string }).error)
          : "İşlem başarısız";
      throw new Error(msg);
    }
    return data as ServiceOrderDetail;
  }

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
        if (!cancelled) {
          setWaShopReady(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadWaInbound = useCallback(async (orderId: string) => {
    setWaInboundLoading(true);
    try {
      const res = await fetch(
        `/api/whatsapp/messages?orderId=${encodeURIComponent(orderId)}`,
        { cache: "no-store" },
      );
      const j = (await res.json()) as
        | { messages?: WaInboundMsg[] }
        | { error?: string };
      if (res.ok && j && "messages" in j && Array.isArray(j.messages)) {
        setWaInboundMessages(j.messages);
      } else {
        setWaInboundMessages([]);
      }
    } catch {
      setWaInboundMessages([]);
    } finally {
      setWaInboundLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!order?.id) {
      setWaInboundMessages([]);
      return;
    }
    void loadWaInbound(order.id);
  }, [order?.id, loadWaInbound]);

  const loadExternalServices = useCallback(async () => {
    setLoadingExternalServices(true);
    try {
      const res = await fetch("/api/external-services");
      const data = (await res.json()) as ExternalServiceRow[] | { error?: string };
      if (!res.ok) {
        setExternalServicesList([]);
        return;
      }
      setExternalServicesList(data as ExternalServiceRow[]);
    } catch {
      setExternalServicesList([]);
    } finally {
      setLoadingExternalServices(false);
    }
  }, []);

  async function handleStatusChange(next: string | null) {
    if (!order || next == null || next === order.status) return;
    if (next === "repair_failed") {
      setRepairFailedReason("");
      setShowRepairFailedModal(true);
      return;
    }
    if (next === "sent_to_external") {
      setExternalSendServiceId(order.externalServiceId ?? "");
      setExternalSendNote(order.externalNote ?? "");
      setExternalSendOpen(true);
      void loadExternalServices();
      return;
    }
    if (isDeliveredServiceOrderStatus(next)) {
      setDeliveryType("self");
      setDeliveryPersonName("");
      setDeliveryNote("");
      setPendingDeliveryStatus(next);
      setShowDeliveryModal(true);
      return;
    }
    setSavingStatus(true);
    try {
      const updated = await patchOrder({ status: next });
      setOrder(updated);
      toast.success("Durum güncellendi");
      const tpl = WA_TEMPLATES[next];
      if (
        tpl &&
        updated.customer?.phone?.trim() &&
        waShopReady
      ) {
        setWaConfirmStatus(next);
        setShowWaConfirm(true);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Durum güncellenemedi");
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleDeliveryConfirm() {
    if (!order) return;
    if (!pendingDeliveryStatus) {
      toast.error("Geçersiz teslim durumu");
      return;
    }
    if (deliveryType === "other" && !deliveryPersonName.trim()) {
      toast.error("Teslim alan kişinin adını girin");
      return;
    }
    const status = pendingDeliveryStatus;
    setSavingStatus(true);
    try {
      const updated = await patchOrder({
        status,
        deliveryType,
        deliveryPersonName:
          deliveryType === "other" ? deliveryPersonName.trim() : null,
        deliveryNote: deliveryNote.trim() || null,
      });
      setShowDeliveryModal(false);
      setPendingDeliveryStatus("");
      setOrder(updated);
      toast.success("Cihaz teslim edildi!");
      const tpl = WA_TEMPLATES[status];
      if (
        tpl &&
        updated.customer?.phone &&
        waShopReady
      ) {
        setWaConfirmStatus(status);
        setShowWaConfirm(true);
      }
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Durum güncellenemedi");
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleRepairFailedConfirm() {
    if (!repairFailedReason.trim()) {
      toast.error("Lütfen tamir olmama nedenini girin");
      return;
    }
    if (!order) return;
    setShowRepairFailedModal(false);
    setSavingStatus(true);
    try {
      const updated = await patchOrder({
        status: "repair_failed",
        repairFailedReason: repairFailedReason.trim(),
      });
      setOrder(updated);
      setRepairFailedReason("");
      toast.success("Durum güncellendi");
      const tpl = WA_TEMPLATES.repair_failed;
      if (
        tpl &&
        updated.customer?.phone?.trim() &&
        waShopReady
      ) {
        setWaConfirmStatus("repair_failed");
        setShowWaConfirm(true);
      }
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Durum güncellenemedi");
    } finally {
      setSavingStatus(false);
    }
  }

  async function submitExternalSend() {
    if (!order) return;
    const sid = externalSendServiceId.trim();
    if (!sid) {
      toast.error("Dış servis seçin");
      return;
    }
    setSavingStatus(true);
    try {
      const updated = await patchOrder({
        status: "sent_to_external",
        externalServiceId: sid,
        externalNote: externalSendNote.trim() || null,
      });
      setOrder(updated);
      setExternalSendOpen(false);
      toast.success("Kayıt dış servise gönderildi olarak işaretlendi");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Durum güncellenemedi");
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleSaveNote() {
    if (!order) return;
    setSavingNote(true);
    try {
      const updated = await patchOrder({ technicianNote: noteDraft.trim() || null });
      setOrder(updated);
      setNoteDraft(updated.technicianNote ?? "");
      toast.success("Teknisyen notu kaydedildi");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Not kaydedilemedi");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDeleteOrder() {
    if (!id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/service-orders/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Kayıt silinemedi");
        return;
      }
      toast.success("Kayıt silindi");
      setDeleteOpen(false);
      handleBack();
    } catch {
      toast.error("Kayıt silinemedi");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSavePrice() {
    if (!order) return;
    const raw = inputPrice.trim().replace(",", ".");
    if (raw === "") {
      setSavingPrice(true);
      try {
        const updated = await patchOrder({ totalPrice: null });
        setOrder(updated);
        setInputPrice("");
        toast.success("Ücret bilgisi kaldırıldı");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Ücret kaydedilemedi");
      } finally {
        setSavingPrice(false);
      }
      return;
    }
    const n = Number(raw);
    if (Number.isNaN(n) || n < 0) {
      toast.error("Geçerli bir tutar girin");
      return;
    }
    const netPrice = Math.round(n * (1 - discountRate));
    setSavingPrice(true);
    try {
      const updated = await patchOrder({ totalPrice: netPrice });
      setOrder(updated);
      setInputPrice("");
      toast.success(
        discountRate > 0
          ? `Ücret kaydedildi (brüt ₺${n.toLocaleString("tr-TR")} → net ₺${netPrice.toLocaleString("tr-TR")})`
          : "Ücret kaydedildi",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ücret kaydedilemedi");
    } finally {
      setSavingPrice(false);
    }
  }

  async function handleWAPriceNotification() {
    if (!order) return;
    if (!order.totalPrice || order.totalPrice === 0) {
      toast.error("Önce ücret girin");
      return;
    }
    if (!order.customer?.phone) {
      toast.error("Müşteri telefon numarası bulunamadı");
      return;
    }
    setWaSending(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: order.customer.phone,
          templateName: "fiyat_bildirimi",
          parameters: [
            order.customer.name,
            order.serialNo || "Belirtilmemiş",
            order.deviceModel?.name ||
              order.brand?.name ||
              order.deviceType?.name ||
              "Cihaz",
            order.totalPrice.toLocaleString("tr-TR"),
          ],
        }),
      });

      const data = (await res.json()) as { success?: boolean; error?: string };
      if (data.success) {
        toast.success("WhatsApp mesajı gönderildi!");
      } else {
        toast.error(data.error || "Mesaj gönderilemedi");
      }
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setWaSending(false);
    }
  }

  function handlePaymentLink() {
    if (!order) return;
    if (!order.totalPrice || order.totalPrice <= 0) {
      toast.error("Önce ücret girin");
      return;
    }
    if (!order.customer?.phone?.trim()) {
      toast.error("Müşteri telefon numarası bulunamadı");
      return;
    }
    setShowPaymentModal(true);
  }

  async function handleSendPaymentLink() {
    setShowPaymentModal(false);
    toast.info("Ödeme linki özelliği yakında aktif olacak.");
  }

  async function handleWaSend() {
    setShowWaConfirm(false);
    if (!order?.customer?.phone || !waConfirmStatus) return;

    const metaTemplate = WA_TEMPLATES[waConfirmStatus];
    if (!metaTemplate) return;

    setWaConfirmSending(true);
    try {
      const params = metaTemplate.getParams(order);
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: order.customer.phone,
          templateName: metaTemplate.name,
          parameters: params,
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (data.success) {
        toast.success("WhatsApp mesajı gönderildi!");
      } else {
        toast.error(data.error || "Mesaj gönderilemedi");
      }
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setWaConfirmSending(false);
      setWaConfirmStatus("");
    }
  }

  async function handleSaveEstimated() {
    if (!order) return;
    const raw = estimatedPrice.trim().replace(",", ".");
    let value: number | null;
    if (raw === "") {
      value = null;
    } else {
      const n = Number(raw);
      if (Number.isNaN(n) || n < 0) {
        toast.error("Geçerli bir tutar girin");
        return;
      }
      value = n === 0 ? null : n;
    }
    setSavingEstimated(true);
    try {
      const updated = await patchOrder({ estimatedPrice: value });
      setOrder(updated);
      setEditingEstimated(false);
      toast.success("Tahmini fiyat güncellendi");
      await load();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Tahmini fiyat güncellenemedi",
      );
    } finally {
      setSavingEstimated(false);
    }
  }

  if (loading) {
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

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 size-4" aria-hidden />
          Geri Dön
        </Button>
        <p className="text-sm text-destructive" role="alert">
          {error ?? "Kayıt bulunamadı"}
        </p>
      </div>
    );
  }

  const titleNo = formatServiceOrderNo(order);
  const currentStatusUi = getStatusUiConfig(order.status);
  const statusBadge = getStatusBadge(order.status);
  const deliveryModalStatusBadge = getStatusBadge(pendingDeliveryStatus);

  return (
    <div className="space-y-6">
      <style>{`
        .status-btn:hover:not(.active):not(:disabled) {
          background: var(--hover-bg) !important;
          border-color: var(--hover-color) !important;
          color: var(--hover-color) !important;
        }
      `}</style>

      <Dialog
        open={externalSendOpen}
        onOpenChange={setExternalSendOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dış Servise Gönder</DialogTitle>
            <DialogDescription>
              Kaydı hangi dış servise gönderdiğinizi seçin. Yeni firma eklemek için{" "}
              <Link
                href="/dis-servis"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Dış Servisler
              </Link>{" "}
              sayfasını kullanın.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ext-svc">Dış servis</Label>
              {loadingExternalServices ? (
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Yükleniyor…
                </p>
              ) : (
                <select
                  id="ext-svc"
                  value={externalSendServiceId}
                  onChange={(e) => setExternalSendServiceId(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="">Seçin</option>
                  {externalServicesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
              {!loadingExternalServices && externalServicesList.length === 0 ? (
                <p className="text-xs text-amber-800">
                  Henüz dış servis tanımı yok. Önce liste oluşturun.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ext-note">Dış servise gönderme notu (isteğe bağlı)</Label>
              <Textarea
                id="ext-note"
                rows={3}
                value={externalSendNote}
                onChange={(e) => setExternalSendNote(e.target.value)}
                placeholder="Takip no, iletişim, özel talimat…"
                className="resize-y"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setExternalSendOpen(false)}
              disabled={savingStatus}
            >
              İptal
            </Button>
            <Button
              type="button"
              onClick={() => void submitExternalSend()}
              disabled={
                savingStatus ||
                !externalSendServiceId.trim() ||
                loadingExternalServices
              }
            >
              {savingStatus ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Kaydediliyor…
                </>
              ) : (
                "Gönder"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showRepairFailedModal}
        onOpenChange={setShowRepairFailedModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tamir Olmama Nedeni</DialogTitle>
            <DialogDescription>
              Bu cihazın neden tamir edilemediğini belirtin.
            </DialogDescription>
          </DialogHeader>

          <div style={{ marginTop: "8px" }}>
            <textarea
              value={repairFailedReason}
              onChange={(e) => setRepairFailedReason(e.target.value)}
              placeholder="Örn: Yedek parça bulunamadı, hasar çok fazla, ekonomik tamir mümkün değil..."
              rows={4}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
            <p
              style={{
                fontSize: "12px",
                color: "#9ca3af",
                marginTop: "6px",
              }}
            >
              Bu bilgi kayıt detayında görüntülenecek.
            </p>
          </div>

          <DialogFooter style={{ marginTop: "16px" }}>
            <button
              type="button"
              onClick={() => setShowRepairFailedModal(false)}
              style={{
                padding: "8px 16px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                background: "white",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              İptal
            </button>
            <button
              type="button"
              onClick={() => void handleRepairFailedConfirm()}
              style={{
                padding: "8px 20px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              Kaydet
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDeliveryModal}
        onOpenChange={(open) => {
          setShowDeliveryModal(open);
          if (!open) setPendingDeliveryStatus("");
        }}
      >
        <DialogContent style={{ maxWidth: "440px" }}>
          <DialogHeader>
            <DialogTitle>Teslim Bilgisi</DialogTitle>
            <DialogDescription>
              <span
                style={{
                  background: deliveryModalStatusBadge.bg,
                  color: deliveryModalStatusBadge.color,
                  border: `1px solid ${deliveryModalStatusBadge.border}`,
                  padding: "2px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                {deliveryModalStatusBadge.label}
              </span>{" "}
              durumu için teslim bilgisi girin.
            </DialogDescription>
          </DialogHeader>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginTop: "8px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setDeliveryType("self")}
                style={{
                  padding: "14px",
                  border: `2px solid ${deliveryType === "self" ? "#534AB7" : "#e5e7eb"}`,
                  borderRadius: "10px",
                  background: deliveryType === "self" ? "#F5F3FF" : "white",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "6px" }}>👤</div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: deliveryType === "self" ? "#534AB7" : "#374151",
                  }}
                >
                  Kendisine Teslim
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    marginTop: "2px",
                  }}
                >
                  Kayıt sahibi teslim aldı
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType("other")}
                style={{
                  padding: "14px",
                  border: `2px solid ${deliveryType === "other" ? "#534AB7" : "#e5e7eb"}`,
                  borderRadius: "10px",
                  background: deliveryType === "other" ? "#F5F3FF" : "white",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "6px" }}>👥</div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: deliveryType === "other" ? "#534AB7" : "#374151",
                  }}
                >
                  Başkasına Teslim
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    marginTop: "2px",
                  }}
                >
                  Farklı kişi teslim aldı
                </div>
              </button>
            </div>

            {deliveryType === "other" ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "13px",
                      color: "#666",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Teslim Alan Kişi{" "}
                    <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryPersonName}
                    onChange={(e) => setDeliveryPersonName(e.target.value)}
                    placeholder="Ad Soyad"
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "13px",
                      color: "#666",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Not
                  </label>
                  <textarea
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    placeholder="Örn: Müşterinin eşi teslim aldı, vekâleten teslim..."
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter style={{ marginTop: "16px", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setShowDeliveryModal(false)}
              disabled={savingStatus}
              style={{
                padding: "8px 16px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                background: "white",
                cursor: savingStatus ? "not-allowed" : "pointer",
                fontSize: "13px",
              }}
            >
              İptal
            </button>
            <button
              type="button"
              onClick={() => void handleDeliveryConfirm()}
              disabled={
                savingStatus ||
                (deliveryType === "other" && !deliveryPersonName.trim())
              }
              style={{
                padding: "8px 20px",
                background:
                  deliveryType === "other" && !deliveryPersonName.trim()
                    ? "#d1d5db"
                    : "#111",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor:
                  savingStatus ||
                  (deliveryType === "other" && !deliveryPersonName.trim())
                    ? "not-allowed"
                    : "pointer",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              {savingStatus ? "Kaydediliyor…" : "Teslim Et"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showWaConfirm}
        onOpenChange={(open) => {
          setShowWaConfirm(open);
          if (!open) setWaConfirmStatus("");
        }}
      >
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>WhatsApp Bildirimi</DialogTitle>
            <DialogDescription>
              Müşteriye durum hakkında WhatsApp mesajı göndermek ister misiniz?
            </DialogDescription>
          </DialogHeader>
          {order && waConfirmStatus ? (
            <div
              className="mt-2 rounded-lg px-3 py-2 text-[13px] text-slate-600"
              style={{ background: "#f9fafb" }}
            >
              {order.customer?.name} —{" "}
              {getStatusBadge(waConfirmStatus).label}
            </div>
          ) : null}
          <DialogFooter className="mt-4 gap-2 sm:gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] cursor-pointer disabled:opacity-50"
              disabled={waConfirmSending}
              onClick={() => setShowWaConfirm(false)}
            >
              Hayır
            </button>
            <button
              type="button"
              className="rounded-lg border-0 bg-[#25D366] px-5 py-2 text-[13px] font-medium text-white cursor-pointer disabled:opacity-50"
              disabled={waConfirmSending || !waShopReady}
              onClick={() => void handleWaSend()}
            >
              {waConfirmSending ? (
                <>
                  <Loader2 className="mr-2 inline size-4 animate-spin" />
                  Gönderiliyor…
                </>
              ) : (
                "Evet, Gönder"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Ödeme Linki Gönder</DialogTitle>
            <DialogDescription>
              Müşteriye WhatsApp üzerinden ödeme linki gönderilecek.
            </DialogDescription>
          </DialogHeader>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginTop: "8px",
            }}
          >
            <div
              style={{
                padding: "12px",
                background: "#f9fafb",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginBottom: "4px",
                }}
              >
                Ödenecek Tutar
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#0f0f0f",
                }}
              >
                ₺{order.totalPrice?.toLocaleString("tr-TR")}
              </div>
              {discountRate > 0 ? (
                <div
                  style={{
                    fontSize: "11px",
                    color: "#16a34a",
                    marginTop: "2px",
                  }}
                >
                  %{discountRate * 100} bayi iskontosu uygulandı
                </div>
              ) : null}
            </div>

            <div
              style={{
                padding: "12px",
                background: "#f9fafb",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginBottom: "4px",
                }}
              >
                Gönderilecek Numara
              </div>
              <div style={{ fontSize: "14px", fontWeight: "500" }}>
                {order.customer?.name}
              </div>
              <div style={{ fontSize: "13px", color: "#666" }}>
                {order.customer?.phone}
              </div>
            </div>

            <div
              style={{
                padding: "10px 12px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#2563eb",
              }}
            >
              ℹ️ Ödeme altyapısı yakında aktif olacak. Şu an için ödeme linki
              placeholder olarak gönderilecektir.
            </div>
          </div>

          <DialogFooter style={{ marginTop: "16px", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              style={{
                padding: "8px 16px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                background: "white",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              İptal
            </button>
            <button
              type="button"
              onClick={() => handleSendPaymentLink()}
              style={{
                padding: "8px 20px",
                background: "#25D366",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              WhatsApp ile Gönder
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Button type="button" variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            Geri Dön
          </Button>
          <Link
            href={editHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Pencil className="mr-2 size-4" aria-hidden />
            Kaydı Düzenle
          </Link>
          <Link
            href={`/fis/${encodeURIComponent(order.id)}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Printer className="mr-2 size-4" aria-hidden />
            Müşteri Nüshası
          </Link>
          <Link
            href={`/dukkan-nushasi/${encodeURIComponent(order.id)}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Printer className="mr-2 size-4" aria-hidden />
            Cihaz Etiketi
          </Link>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 size-4" aria-hidden />
            Kaydı Sil
          </Button>
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Kaydı silmek istediğinize emin misiniz?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem geri alınamaz. #{titleNo} numaralı kayıt ve ilgili tüm
                  durum geçmişi kalıcı olarak silinecek.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel variant="secondary">İptal</AlertDialogCancel>
                <AlertDialogAction
                  type="button"
                  variant="destructive"
                  disabled={deleting}
                  onClick={(e) => {
                    e.preventDefault();
                    void handleDeleteOrder();
                  }}
                >
                  {deleting ? "Siliniyor…" : "Evet, Sil"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "11px",
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Kayıt No
          </div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: 700,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              color: "#111",
            }}
          >
            #{titleNo}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "20px",
              background: "white",
            }}
          >
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle>Müşteri Bilgileri</CardTitle>
              <CardDescription>Kayıtlı iletişim bilgileri</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <DetailRow label="Ad Soyad">{order.customer.name}</DetailRow>
                <DetailRow label="Telefon">
                  {order.customer.phone ?? "—"}
                </DetailRow>
                {order.cari ? (
                  <DetailRow label="Cari">
                    <Badge variant="outline">{order.cari.name}</Badge>
                  </DetailRow>
                ) : null}
              </dl>
            </CardContent>
          </Card>

          {order.bayi ? (
            <Card
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "20px",
                background: "white",
              }}
            >
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle>Bayi Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <DetailRow label="Firma Adı">{order.bayi.firmaAdi}</DetailRow>
                  <DetailRow label="Yetkili Kişi">{order.bayi.yetkiliKisi}</DetailRow>
                  <DetailRow label="Telefon">{order.bayi.phone}</DetailRow>
                </dl>
              </CardContent>
            </Card>
          ) : null}

          <Card
            style={{
              border: `1px solid ${statusBadge.border}`,
              borderRadius: "10px",
              padding: "20px",
              background: statusBadge.bg,
            }}
          >
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle>Cihaz Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <DetailRow label="Cihaz Türü">
                  {order.deviceType?.name ?? order.deviceTypeName ?? "—"}
                </DetailRow>
                <DetailRow label="Marka">
                  {order.brand?.name ?? order.brandName ?? "—"}
                </DetailRow>
                <DetailRow label="Model">
                  {order.deviceModel?.name ?? order.modelName ?? "—"}
                </DetailRow>
                <DetailRow label="Seri No">
                  {order.noSerialNo ? "Belirtilmedi" : (order.serialNo ?? "—")}
                </DetailRow>
                <DetailRow label="Garanti Durumu">
                  <Badge
                    variant="outline"
                    className={cn(
                      order.warrantyStatus === "guaranteed" &&
                        "border-emerald-200 bg-emerald-50 text-emerald-800",
                      order.warrantyStatus === "no_warranty" &&
                        "border-slate-200 bg-slate-100 text-slate-700",
                    )}
                  >
                    {warrantyLabel(order.warrantyStatus)}
                  </Badge>
                </DetailRow>
                <DetailRow label="Genel Durum">
                  <Badge
                    variant="outline"
                    className={cn(
                      order.isTampered
                        ? "border-amber-200 bg-amber-100 text-amber-900"
                        : "border-slate-200 bg-slate-100 text-slate-700",
                    )}
                  >
                    {order.isTampered ? "Kurcalanmış" : "Kurcalanmamış"}
                  </Badge>
                </DetailRow>
                <DetailRow label="Geliş Tarihi ve Saati">
                  {formatArrivedAt(order.arrivedAt)}
                </DetailRow>
              </dl>
            </CardContent>
          </Card>

          {order.status === "sent_to_external" ? (
            <div
              style={{
                border: "1px solid #ddd6fe",
                borderRadius: "8px",
                padding: "16px",
                background: "#f5f3ff",
                marginTop: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#7c3aed",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                DIŞ SERVİS BİLGİSİ
              </div>
              {order.externalService ? (
                <>
                  <div className="text-sm text-slate-800">
                    Servis: {order.externalService.name}
                  </div>
                  <div className="text-sm text-slate-800">
                    Yetkili: {order.externalService.contactName ?? "—"}
                  </div>
                  <div className="text-sm text-slate-800">
                    Telefon: {order.externalService.phone ?? "—"}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-600">
                  Dış servis seçilmemiş veya kayıt silinmiş.
                </p>
              )}
              {order.externalNote?.trim() ? (
                <div className="mt-2 text-sm text-slate-800">
                  Not: {order.externalNote}
                </div>
              ) : null}
            </div>
          ) : null}

          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle>Arıza ve Notlar</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <DetailRow label="Şikayet / Arıza">
                  {order.complaint?.trim() ? order.complaint : "—"}
                </DetailRow>
                <DetailRow label="Cihazla Gelen Aksesuarlar">
                  {order.accessories?.trim() ? order.accessories : "—"}
                </DetailRow>
                <DetailRow label="Fiziksel Hasar / Dış Görünüm">
                  {order.physicalDamage?.trim() ? order.physicalDamage : "—"}
                </DetailRow>
                <DetailRow label="Kargo ile geldi mi">
                  {order.arrivedByCargo ? "Evet" : "Hayır"}
                </DetailRow>
                {order.arrivedByCargo || order.cargoInfo?.trim() ? (
                  <DetailRow label="Kargo bilgisi">
                    {order.cargoInfo?.trim() ? order.cargoInfo : "—"}
                  </DetailRow>
                ) : null}
              </dl>
              {order.status === "repair_failed" &&
              order.repairFailedReason?.trim() ? (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    background: "#fef2f2",
                    borderRadius: "8px",
                    border: "1px solid #fecaca",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#dc2626",
                      fontWeight: "500",
                      marginBottom: "4px",
                    }}
                  >
                    Tamir Olmama Nedeni
                  </div>
                  <div style={{ fontSize: "13px", color: "#374151" }}>
                    {order.repairFailedReason}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle>Kullanılan Parçalar</CardTitle>
              <CardDescription>
                Bu kayıtta kullanılan yedek parçalar ve maliyet özeti
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(order.sparePartUsages ?? []).length === 0 ? (
                <p className="text-sm text-slate-600">Henüz parça eklenmedi</p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-slate-100">
                  <table className="w-full min-w-[360px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80">
                        <th className="px-3 py-2 font-medium text-slate-700">Parça</th>
                        <th className="px-3 py-2 font-medium text-slate-700">Adet</th>
                        <th className="px-3 py-2 font-medium text-slate-700">Birim</th>
                        <th className="px-3 py-2 font-medium text-slate-700">Toplam</th>
                        <th className="w-10 px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {(order.sparePartUsages ?? []).map((u) => (
                        <tr key={u.id} className="border-b border-slate-50 last:border-0">
                          <td className="px-3 py-2 text-slate-900">
                            {u.sparePart.name}
                            {u.sparePart.partCode ? (
                              <span className="ml-1 text-xs text-slate-500">
                                ({u.sparePart.partCode})
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 tabular-nums text-slate-800">{u.quantity}</td>
                          <td className="px-3 py-2 tabular-nums text-slate-700">
                            {formatTry(u.costAtTime)}
                          </td>
                          <td className="px-3 py-2 tabular-nums font-medium text-slate-900">
                            {formatTry(u.quantity * u.costAtTime)}
                          </td>
                          <td className="px-2 py-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-slate-500 hover:text-destructive"
                              disabled={removingUsageId === u.id}
                              aria-label="Kaldır"
                              onClick={() => void handleRemoveSpareUsage(u.id)}
                            >
                              {removingUsageId === u.id ? (
                                <Loader2 className="size-4 animate-spin" aria-hidden />
                              ) : (
                                <X className="size-4" aria-hidden />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-sm font-medium text-slate-800">
                Parça maliyeti:{" "}
                <span className="tabular-nums text-slate-900">
                  {formatTry(sparePartsCostTotal)}
                </span>
              </p>

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <p className="text-sm font-medium text-slate-800">Parça ekle</p>
                {loadingSpares ? (
                  <p className="flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Parça listesi yükleniyor…
                  </p>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="spare-select">Parça</Label>
                      <select
                        id="spare-select"
                        value={sparePartId}
                        onChange={(e) => {
                          setSparePartId(e.target.value);
                          setSpareQty("1");
                        }}
                        className={nativeSelectClassName}
                      >
                        <option value="">Seçin</option>
                        {spareOptions.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.stock < 1}>
                            {p.name}
                            {p.partCode ? ` — ${p.partCode}` : ""} (stok: {p.stock})
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedSpare ? (
                      <p className="text-xs text-slate-600">
                        Stokta:{" "}
                        <span className="font-semibold text-slate-800">
                          {selectedSpare.stock} adet
                        </span>
                      </p>
                    ) : null}
                    <div className="space-y-1.5">
                      <Label htmlFor="spare-qty">Adet</Label>
                      <Input
                        id="spare-qty"
                        type="number"
                        min={1}
                        max={selectedSpare?.stock ?? undefined}
                        value={spareQty}
                        onChange={(e) => setSpareQty(e.target.value)}
                        disabled={!sparePartId}
                      />
                    </div>
                    {insufficientSpare && sparePartId ? (
                      <p className="text-sm text-destructive">Yetersiz stok</p>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        !sparePartId || !spareQtyValid || savingSpare || insufficientSpare
                      }
                      onClick={() => void handleAddSparePart()}
                    >
                      {savingSpare ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Ekleniyor…
                        </>
                      ) : (
                        "Ekle"
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle>Teknisyen Notu</CardTitle>
              <CardDescription>
                Dahili notlar müşteri ekranında paylaşılmaz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Teknisyen notunu buraya yazın…"
                rows={5}
                className="min-h-[120px] resize-y"
              />
              <Button
                type="button"
                onClick={() => void handleSaveNote()}
                disabled={savingNote}
              >
                {savingNote ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Kaydediliyor…
                  </>
                ) : (
                  "Notu Kaydet"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle>Durum Güncelle</CardTitle>
              <CardDescription>
                Mevcut:{" "}
                <span
                  className="font-semibold"
                  style={{ color: currentStatusUi.color }}
                >
                  {currentStatusUi.label}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div>
                {STATUS_GROUPS.map((group, gi) => (
                  <div key={group.title}>
                    {gi > 0 ? (
                      <div
                        style={{
                          margin: "4px 0",
                          borderTop: "1px solid #e5e7eb",
                        }}
                        role="separator"
                      />
                    ) : null}
                    <div style={{ marginBottom: "12px" }}>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#9ca3af",
                          fontWeight: 600,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          marginBottom: "6px",
                          paddingLeft: "2px",
                        }}
                      >
                        {group.title}
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "6px",
                        }}
                      >
                        {group.statuses.map((statusKey) => {
                          const config = STATUS_CONFIG[statusKey];
                          if (!config) return null;
                          const isActive = order.status === statusKey;
                          return (
                            <button
                              key={statusKey}
                              type="button"
                              onClick={() => void handleStatusChange(statusKey)}
                              disabled={isActive || savingStatus}
                              className={`status-btn ${isActive ? "active" : ""}`}
                              style={
                                {
                                  padding: "8px 10px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: isActive ? 600 : 400,
                                  cursor:
                                    isActive || savingStatus
                                      ? "default"
                                      : "pointer",
                                  textAlign: "left",
                                  transition: "all 0.15s",
                                  border: `1.5px solid ${isActive ? config.color : config.border}`,
                                  background: isActive ? config.bg : "white",
                                  color: isActive ? config.color : "#374151",
                                  "--hover-color": config.color,
                                  "--hover-bg": config.bg,
                                } as CSSProperties
                              }
                            >
                              <span
                                style={{
                                  display: "inline-block",
                                  width: "6px",
                                  height: "6px",
                                  borderRadius: "50%",
                                  background: config.color,
                                  marginRight: "6px",
                                  verticalAlign: "middle",
                                }}
                              />
                              {config.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div
            style={{
              border: "1px solid #e9ecef",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: "600",
                marginBottom: "12px",
              }}
            >
              Tahmini Fiyat
            </div>

            {!editingEstimated ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "18px", fontWeight: "600" }}>
                  {order.estimatedPrice != null &&
                  !Number.isNaN(order.estimatedPrice)
                    ? `₺${order.estimatedPrice.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}`
                    : "—"}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingEstimated(true)}
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    background: "none",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                >
                  Düzenle
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#666" }}>₺</span>
                <input
                  type="number"
                  value={estimatedPrice}
                  onChange={(e) => setEstimatedPrice(e.target.value)}
                  style={{
                    flex: 1,
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "6px 8px",
                    fontSize: "14px",
                  }}
                  placeholder="0.00"
                  min={0}
                  step="0.01"
                  disabled={savingEstimated}
                />
                <button
                  type="button"
                  onClick={() => void handleSaveEstimated()}
                  disabled={savingEstimated}
                  style={{
                    background: "#111",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "6px 12px",
                    cursor: savingEstimated ? "wait" : "pointer",
                    fontSize: "12px",
                  }}
                >
                  {savingEstimated ? "…" : "Kaydet"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingEstimated(false);
                    setEstimatedPrice(
                      order.estimatedPrice != null &&
                        !Number.isNaN(order.estimatedPrice)
                        ? String(order.estimatedPrice)
                        : "",
                    );
                  }}
                  disabled={savingEstimated}
                  style={{
                    background: "none",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "6px 8px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  İptal
                </button>
              </div>
            )}
          </div>

          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle>Ücret</CardTitle>
              <CardDescription>
                Kayıtlı tutar:{" "}
                <span className="font-medium text-slate-800">
                  {formatTry(order.totalPrice)}
                </span>
              </CardDescription>
              {savedBayiDiscountBreakdown ? (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "10px 12px",
                    background: "#f0fdf4",
                    borderRadius: "8px",
                    border: "1px solid #86efac",
                    fontSize: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    <span>Brüt Fiyat:</span>
                    <span>
                      ₺
                      {savedBayiDiscountBreakdown.brutPrice.toLocaleString(
                        "tr-TR",
                      )}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#dc2626",
                      marginBottom: "4px",
                    }}
                  >
                    <span>
                      İskonto (%{savedBayiDiscountBreakdown.rate * 100}):
                    </span>
                    <span>
                      -₺
                      {savedBayiDiscountBreakdown.iskonto.toLocaleString(
                        "tr-TR",
                      )}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: "600",
                      color: "#15803d",
                      paddingTop: "4px",
                      borderTop: "1px solid #86efac",
                    }}
                  >
                    <span>Net Fiyat:</span>
                    <span>
                      ₺
                      {savedBayiDiscountBreakdown.netPrice.toLocaleString(
                        "tr-TR",
                      )}
                    </span>
                  </div>
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="total-price">Toplam Ücret</Label>
                <div className="relative">
                  <span
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500"
                    aria-hidden
                  >
                    ₺
                  </span>
                  <Input
                    id="total-price"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={inputPrice}
                    onChange={(e) => setInputPrice(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Boş bırakıp kaydederseniz ücret silinir.
                </p>
                {inputPrice &&
                discountRate > 0 &&
                inputPricePreview ? (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "10px 12px",
                      background: "#f0fdf4",
                      borderRadius: "8px",
                      border: "1px solid #86efac",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                      }}
                    >
                      <span>Brüt:</span>
                      <span>
                        ₺
                        {inputPricePreview.brutPrice.toLocaleString("tr-TR")}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#dc2626",
                        marginBottom: "4px",
                      }}
                    >
                      <span>İskonto (%{discountRate * 100}):</span>
                      <span>
                        -₺
                        {inputPricePreview.iskonto.toLocaleString("tr-TR")}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontWeight: "600",
                        color: "#15803d",
                        paddingTop: "4px",
                        borderTop: "1px solid #86efac",
                      }}
                    >
                      <span>Net (kaydedilecek):</span>
                      <span>
                        ₺
                        {inputPricePreview.netPrice.toLocaleString("tr-TR")}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void handleSavePrice()}
                  disabled={savingPrice}
                >
                  {savingPrice ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Kaydediliyor…
                    </>
                  ) : (
                    "Ücreti Kaydet"
                  )}
                </Button>
                <button
                  type="button"
                  disabled={waSending}
                  onClick={() => void handleWAPriceNotification()}
                  style={{
                    background: waSending ? "#86efac" : "#25D366",
                    color: "white",
                    padding: "8px 14px",
                    border: "none",
                    borderRadius: "6px",
                    cursor: waSending ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                  }}
                >
                  {waSending ? "Gönderiliyor..." : "WhatsApp ile Bildir"}
                </button>
                <button
                  type="button"
                  onClick={() => handlePaymentLink()}
                  style={{
                    padding: "8px 14px",
                    background: "#2563EB",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  💳 Ödeme Linki Gönder
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle>Durum Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              {order.statusLogs.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Henüz durum değişikliği yok
                </p>
              ) : (
                <ul className="space-y-3">
                  {order.statusLogs.map((log) => (
                    <li
                      key={log.id}
                      className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
                    >
                      <p className="text-xs text-slate-500">
                        {formatLogAt(log.createdAt)}
                      </p>
                      <p className="mt-1 text-slate-800">
                        <span className="font-medium">
                          {log.oldStatus
                            ? serviceOrderStatusLabel(log.oldStatus)
                            : "—"}
                        </span>
                        <span className="mx-1.5 text-slate-400">→</span>
                        <span className="font-medium">
                          {serviceOrderStatusLabel(log.newStatus)}
                        </span>
                      </p>
                      {log.note ? (
                        <p className="mt-1 text-xs text-slate-600">{log.note}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {isDeliveredServiceOrderStatus(order.status) && order.deliveryType ? (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    background: "#f0fdf4",
                    borderRadius: "8px",
                    border: "1px solid #86efac",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#16a34a",
                      marginBottom: "6px",
                    }}
                  >
                    Teslim Bilgisi
                  </div>
                  <div style={{ fontSize: "13px", color: "#374151" }}>
                    {order.deliveryType === "self"
                      ? "👤 Müşterinin kendisine teslim edildi"
                      : `👥 ${order.deliveryPersonName ?? ""} tarafından teslim alındı`}
                  </div>
                  {order.deliveryNote ? (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginTop: "4px",
                      }}
                    >
                      Not: {order.deliveryNote}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              background: "white",
            }}
          >
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base">WhatsApp Mesajları</CardTitle>
              <CardDescription>
                Bu kayıtla eşleşen gelen mesajlar
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {waInboundLoading ? (
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Yükleniyor…
                </p>
              ) : waInboundMessages.length === 0 ? (
                <p className="text-sm text-slate-600">Henüz mesaj yok</p>
              ) : (
                <div className="max-h-[420px] overflow-y-auto pr-1">
                  {waInboundMessages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        padding: "8px 12px",
                        background: "#f0fdf4",
                        borderRadius: "8px",
                        marginBottom: "6px",
                      }}
                    >
                      <div
                        style={{ fontSize: "12px", color: "#666" }}
                      >
                        {new Date(msg.timestamp).toLocaleString("tr-TR")}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          marginTop: "2px",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
