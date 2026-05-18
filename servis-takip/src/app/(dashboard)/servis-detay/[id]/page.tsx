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
import { usePersonelYetki } from "@/hooks/usePersonelYetki";

type Customer = { id: string; name: string; phone: string | null };
type NamedEntity = { id: string; name: string };
type StatusLogRow = {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  oldPrice?: number | null;
  newPrice?: number | null;
  note: string | null;
  createdAt: string;
  personnel?: { name: string } | null;
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

/** Chrome/Edge Web Speech API (prefix'li veya standart ctor) */
type WebSpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  onresult:
    | ((event: {
        results: { 0: { 0: { transcript: string } } };
      }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};
type WebSpeechRecognitionCtor = new () => WebSpeechRecognitionInstance;

type ServiceOrderDetail = {
  id: string;
  orderNumber: string | null;
  status: string;
  externalServiceId?: string | null;
  externalNote?: string | null;
  externalCost?: number | null;
  externalReturnNote?: string | null;
  externalService?: ExternalServiceRow | null;
  serialNo: string | null;
  noSerialNo: boolean;
  warrantyStatus: string | null;
  isTampered: boolean;
  complaint: string | null;
  accessories: string | null;
  physicalDamage: string | null;
  repairDetails: string | null;
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
    vergiDairesi?: string | null;
    tcVergiNo?: string;
    grup?: string | null;
  } | null;
  deviceType: NamedEntity | null;
  brand: NamedEntity | null;
  deviceModel: NamedEntity | null;
  personnel?: { name: string } | null;
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

  const { yetkiVar } = usePersonelYetki();
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
  const [showExternalReturnModal, setShowExternalReturnModal] = useState(false);
  const [externalReturnCost, setExternalReturnCost] = useState("");
  const [externalReturnNote, setExternalReturnNote] = useState("");
  const [savingExternalReturn, setSavingExternalReturn] = useState(false);
  const [pendingReturnStatus, setPendingReturnStatus] = useState<string | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [showDeletePasswordModal, setShowDeletePasswordModal] =
    useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");
  const [deletingWithPassword, setDeletingWithPassword] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteKind, setPendingDeleteKind] = useState<
    "order" | "spare" | null
  >(null);
  const [hasSettingsPassword, setHasSettingsPassword] = useState<
    boolean | null
  >(null);

  const [spareOptions, setSpareOptions] = useState<EligibleSparePart[]>([]);
  const [sparePartId, setSparePartId] = useState("");
  const [spareQty, setSpareQty] = useState("1");
  const [loadingSpares, setLoadingSpares] = useState(false);
  const [savingSpare, setSavingSpare] = useState(false);

  const [editingEstimated, setEditingEstimated] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [savingEstimated, setSavingEstimated] = useState(false);

  const [waShopReady, setWaShopReady] = useState(false);
  const [personeller, setPersoneller] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [secilenPersonelId, setSecilenPersonelId] = useState("");
  const [aktifPersonelIsAdmin, setAktifPersonelIsAdmin] = useState(true);
  const [waSending, setWaSending] = useState(false);
  const [showWaConfirm, setShowWaConfirm] = useState(false);
  const [waConfirmStatus, setWaConfirmStatus] = useState("");
  const [waConfirmSending, setWaConfirmSending] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRepairDetailsModal, setShowRepairDetailsModal] = useState(false);
  const [repairDetailsInput, setRepairDetailsInput] = useState("");
  const [editingRepairDetails, setEditingRepairDetails] = useState(false);
  const [savingRepairDetails, setSavingRepairDetails] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [sesliNotLoading, setSesliNotLoading] = useState(false);
  const [dinleniyor, setDinleniyor] = useState<"repair" | "note" | null>(null);

  const [customWaMessage, setCustomWaMessage] = useState("");
  const [sendingCustomWa, setSendingCustomWa] = useState(false);

  const [, setWaInboundMessages] = useState<WaInboundMsg[]>([]);
  const [, setWaInboundLoading] = useState(false);

  async function aiNotDuzenle(hamMetin: string, hedef: "repair" | "note") {
    setSesliNotLoading(true);
    try {
      const res = await fetch("/api/ai-servis-notu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hamMetin, hedef }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        toast.error(data.error ?? "Düzenleme başarısız");
        return;
      }
      if (hedef === "repair") {
        setRepairDetailsInput(data.text);
        setEditingRepairDetails(true);
      } else {
        setNoteDraft(data.text);
      }
      toast.success("AI metni düzenledi, kontrol edip kaydedin");
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSesliNotLoading(false);
    }
  }

  function sesliNoteBasla(hedef: "repair" | "note") {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Tarayıcınız ses tanımayı desteklemiyor. Chrome veya Edge kullanın.");
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: WebSpeechRecognitionCtor;
      webkitSpeechRecognition?: WebSpeechRecognitionCtor;
    };
    const SpeechRecognition = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Tarayıcınız ses tanımayı desteklemiyor. Chrome veya Edge kullanın.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "tr-TR";
    recognition.continuous = false;
    recognition.interimResults = false;

    setDinleniyor(hedef);

    recognition.onresult = (event: { results: { 0: { 0: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript as string;
      setDinleniyor(null);
      void aiNotDuzenle(transcript, hedef);
    };

    recognition.onerror = () => {
      setDinleniyor(null);
      toast.error("Ses tanıma başarısız, tekrar deneyin");
    };

    recognition.onend = () => {
      setDinleniyor(null);
    };

    recognition.start();
  }

  const nativeSelectClassName =
    "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50";

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

  async function runConfirmedDelete(
    settingsPassword: string,
    idOverride?: string,
  ) {
    let kind = pendingDeleteKind;
    const delId = idOverride ?? pendingDeleteId;
    if (!kind && idOverride != null && id) {
      kind = idOverride === id ? "order" : "spare";
    }
    if (!kind || (kind === "spare" && (!order || !delId)) || (kind === "order" && !id)) {
      return;
    }
    setDeletingWithPassword(true);
    setDeletePasswordError("");
    try {
      const url =
        kind === "order"
          ? `/api/service-orders/${encodeURIComponent(id)}`
          : `/api/service-orders/${encodeURIComponent(order!.id)}/spare-parts?usageId=${encodeURIComponent(delId!)}`;
      const res = await fetch(url, {
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
      setPendingDeleteKind(null);
      if (kind === "order") {
        toast.success("Kayıt silindi");
        handleBack();
      } else {
        toast.success("Parça kullanımı kaldırıldı");
        await load();
        await loadSpareOptions(order!.id);
      }
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setDeletingWithPassword(false);
    }
  }

  async function requestRemoveSpareUsage(usageId: string) {
    let hp = hasSettingsPassword;
    if (hp === null) {
      hp = await ensureHasSettingsPassword();
    }
    if (!hp) {
      await runConfirmedDelete("", usageId);
      return;
    }
    setPendingDeleteKind("spare");
    setPendingDeleteId(usageId);
    setShowDeletePasswordModal(true);
  }

  async function confirmDeleteWithPassword() {
    if (hasSettingsPassword !== false && !deletePassword.trim()) {
      setDeletePasswordError("Parola girin");
      return;
    }
    await runConfirmedDelete(
      hasSettingsPassword === false ? "" : deletePassword,
    );
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
    const isAdmin = sessionStorage.getItem("activePersonnelIsAdmin");
    setAktifPersonelIsAdmin(isAdmin === null || isAdmin === "true");

    // Admin değilse aktif personeli otomatik seç
    if (isAdmin === "false") {
      const aktifPersonelId = sessionStorage.getItem("activePersonnelId");
      if (aktifPersonelId) {
        setSecilenPersonelId(aktifPersonelId);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/personnel")
      .then((r) => r.json())
      .then((data: { id: string; name: string }[]) => {
        if (cancelled) return;
        if (Array.isArray(data)) setPersoneller(data);
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/baileys/status")
      .then((r) => r.json())
      .then((j: { connected?: boolean }) => {
        if (cancelled) return;
        setWaShopReady(j.connected === true);
      })
      .catch(() => {
        if (!cancelled) setWaShopReady(false);
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

  async function handleSaveRepairDetailsAndStatus() {
    if (!pendingStatus) return;
    setSavingRepairDetails(true);
    try {
      await patchOrder({ repairDetails: repairDetailsInput });
      await handleStatusChange(pendingStatus, true);
      setShowRepairDetailsModal(false);
      setPendingStatus(null);
      setRepairDetailsInput("");
    } catch {
      toast.error("Hata oluştu");
    } finally {
      setSavingRepairDetails(false);
    }
  }

  async function handleStatusChange(
    next: string | null,
    skipCompletedRepairModal = false,
  ) {
    if (
      order?.status === "sent_to_external" &&
      next != null &&
      next !== "sent_to_external" &&
      next !== order.status
    ) {
      setPendingReturnStatus(next);
      setExternalReturnCost("");
      setExternalReturnNote("");
      setShowExternalReturnModal(true);
      return;
    }
    if (!order || next == null || next === order.status) return;
    if (next === "completed" && !skipCompletedRepairModal) {
      setPendingStatus(next);
      setRepairDetailsInput(order.repairDetails ?? "");
      setShowRepairDetailsModal(true);
      return;
    }
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
      const updated = await patchOrder({
        status: next,
        ...(secilenPersonelId.trim()
          ? { personnelId: secilenPersonelId.trim() }
          : {}),
      });
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

  async function handleSaveExternalReturn() {
    if (!pendingReturnStatus) return;
    setSavingExternalReturn(true);
    try {
      await patchOrder({
        status: pendingReturnStatus,
        externalCost: externalReturnCost
          ? Number(externalReturnCost.replace(",", "."))
          : null,
        externalReturnNote: externalReturnNote.trim() || null,
        ...(secilenPersonelId.trim()
          ? { personnelId: secilenPersonelId.trim() }
          : {}),
      });
      setShowExternalReturnModal(false);
      setPendingReturnStatus(null);
      setExternalReturnCost("");
      setExternalReturnNote("");
      await load();
    } catch {
      toast.error("Hata oluştu");
    } finally {
      setSavingExternalReturn(false);
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
        ...(secilenPersonelId.trim()
          ? { personnelId: secilenPersonelId.trim() }
          : {}),
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
        ...(secilenPersonelId.trim()
          ? { personnelId: secilenPersonelId.trim() }
          : {}),
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
        ...(secilenPersonelId.trim()
          ? { personnelId: secilenPersonelId.trim() }
          : {}),
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
            order.totalPrice.toLocaleString("tr-TR") + " ₺",
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

  async function handleSendCustomWa() {
    if (!customWaMessage.trim()) return;
    setSendingCustomWa(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: order?.customer?.phone ?? "",
          templateName: "__custom__",
          parameters: [],
          customMessage: customWaMessage.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Mesaj gönderilemedi");
        return;
      }
      toast.success("Mesaj gönderildi!");
      setCustomWaMessage("");
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSendingCustomWa(false);
    }
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

      {showExternalReturnModal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "32px",
              width: "100%",
              maxWidth: "460px",
            }}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Dış Servis Dönüş Bilgisi
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "20px",
              }}
            >
              Dış servisin bu tamirat için uyguladığı ücret ve varsa notunuzu
              girin.
            </p>

            <div style={{ display: "grid", gap: "14px" }}>
              <div>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#374151",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Dış Servis Maliyeti (₺)
                </label>
                <input
                  type="number"
                  value={externalReturnCost}
                  onChange={(e) => setExternalReturnCost(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#374151",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Not (isteğe bağlı)
                </label>
                <textarea
                  value={externalReturnNote}
                  onChange={(e) => setExternalReturnNote(e.target.value)}
                  placeholder="Dış servisle ilgili notunuzu yazın..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "13px",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
              <button
                type="button"
                onClick={() => void handleSaveExternalReturn()}
                disabled={savingExternalReturn}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: savingExternalReturn ? "wait" : "pointer",
                }}
              >
                {savingExternalReturn
                  ? "Kaydediliyor..."
                  : "Kaydet ve Durumu Güncelle"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExternalReturnModal(false);
                  setPendingReturnStatus(null);
                }}
                style={{
                  padding: "10px 20px",
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

      {showRepairDetailsModal ? (
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
              maxWidth: "500px",
              margin: "0 16px",
            }}
          >
            <h2
              style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}
            >
              Onarım Detayı
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "16px",
              }}
            >
              Yapılan onarım işlemini açıklayın. Bu bilgi teslim fişinde
              görünecek.
            </p>
            <textarea
              value={repairDetailsInput}
              onChange={(e) => setRepairDetailsInput(e.target.value)}
              placeholder="Örn: Ana kart üzerindeki güç entegresi değiştirildi. Ekran bağlantısı yenilendi..."
              rows={5}
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "13px",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              autoFocus
            />
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                marginTop: "8px",
                marginBottom: "4px",
              }}
            >
              <button
                type="button"
                onClick={() => sesliNoteBasla("repair")}
                disabled={dinleniyor !== null || sesliNotLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background:
                    dinleniyor === "repair"
                      ? "#dc2626"
                      : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {dinleniyor === "repair"
                  ? "🔴 Dinleniyor..."
                  : sesliNotLoading
                    ? "⏳ Düzenleniyor..."
                    : "🎤 Sesli Yaz"}
              </button>
              <p style={{ fontSize: "11px", color: "#9ca3af" }}>
                Konuş, AI metni düzenlesin
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button
                type="button"
                onClick={() => void handleSaveRepairDetailsAndStatus()}
                disabled={savingRepairDetails}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: savingRepairDetails ? "wait" : "pointer",
                }}
              >
                {savingRepairDetails
                  ? "Kaydediliyor..."
                  : "Kaydet ve Durumu Güncelle"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRepairDetailsModal(false);
                  setPendingStatus(null);
                  setRepairDetailsInput("");
                }}
                style={{
                  padding: "10px 20px",
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
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="whitespace-nowrap"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            Geri Dön
          </Button>
          {yetkiVar("canEditServis") && (
            <Link
              href={editHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "whitespace-nowrap",
              )}
            >
              <Pencil className="mr-2 size-4" aria-hidden />
              Kaydı Düzenle
            </Link>
          )}
          {yetkiVar("canPrintMusteri") && (
            <Link
              href={`/fis/${encodeURIComponent(order.id)}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "whitespace-nowrap",
              )}
            >
              <Printer className="mr-2 size-4" aria-hidden />
              Müşteri Nüshası
            </Link>
          )}
          {yetkiVar("canPrintTeslim") && (
            <Link
              href={`/teslim-fisi/${encodeURIComponent(order.id)}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "whitespace-nowrap",
              )}
            >
              <Printer className="mr-2 size-4" aria-hidden />
              Teslim Fişi
            </Link>
          )}
          {yetkiVar("canPrintEtiket") && (
            <Link
              href={`/dukkan-nushasi/${encodeURIComponent(order.id)}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "whitespace-nowrap",
              )}
            >
              <Printer className="mr-2 size-4" aria-hidden />
              Cihaz Etiketi
            </Link>
          )}
          {yetkiVar("canDeleteServis") && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="whitespace-nowrap"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 size-4" aria-hidden />
              Kaydı Sil
            </Button>
          )}
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
                  onClick={(e) => {
                    e.preventDefault();
                    void (async () => {
                      setDeleteOpen(false);
                      const idToDelete = id;
                      let hp = hasSettingsPassword;
                      if (hp === null) {
                        hp = await ensureHasSettingsPassword();
                      }
                      if (!hp) {
                        await runConfirmedDelete("", idToDelete);
                        return;
                      }
                      setPendingDeleteKind("order");
                      setPendingDeleteId(idToDelete);
                      setShowDeletePasswordModal(true);
                    })();
                  }}
                >
                  Evet, Sil
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
                  <DetailRow label="Vergi dairesi">
                    {order.bayi.vergiDairesi?.trim() ? order.bayi.vergiDairesi : "—"}
                  </DetailRow>
                  <DetailRow label="TC / Vergi no">
                    {order.bayi.tcVergiNo ?? "—"}
                  </DetailRow>
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
                {order.personnel?.name ? (
                  <DetailRow label="Kaydı yapan">{order.personnel.name}</DetailRow>
                ) : null}
              </dl>
            </CardContent>
          </Card>

          {(order.status === "sent_to_external" ||
            order.externalServiceId ||
            order.externalCost != null) ? (
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
              {order.externalCost != null ? (
                <p style={{ marginTop: "4px" }}>
                  <span style={{ fontWeight: 500 }}>Dış Servis Maliyeti: </span>
                  {order.externalCost.toLocaleString("tr-TR")} ₺
                </p>
              ) : null}
              {order.externalReturnNote ? (
                <p style={{ marginTop: "4px" }}>
                  <span style={{ fontWeight: 500 }}>Dönüş Notu: </span>
                  {order.externalReturnNote}
                </p>
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
              {/* Yapılan Onarım */}
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 16px",
                  background: "#f0fdf4",
                  border: "1px solid #86efac",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#16a34a",
                    }}
                  >
                    🔧 Yapılan Onarım
                  </p>
                  <div
                    style={{ display: "flex", gap: "8px", alignItems: "center" }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setRepairDetailsInput(order.repairDetails ?? "");
                        setEditingRepairDetails(true);
                      }}
                      style={{
                        fontSize: "11px",
                        color: "#16a34a",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => sesliNoteBasla("repair")}
                      disabled={dinleniyor !== null || sesliNotLoading}
                      title="Sesli onarım notu"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        border: "none",
                        background:
                          dinleniyor === "repair"
                            ? "#dc2626"
                            : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                        color: "white",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {dinleniyor === "repair"
                        ? "🔴 Dinleniyor..."
                        : sesliNotLoading
                          ? "⏳"
                          : "🎤 Sesli Yaz"}
                    </button>
                  </div>
                </div>
                {editingRepairDetails ? (
                  <div>
                    <textarea
                      value={repairDetailsInput}
                      onChange={(e) => setRepairDetailsInput(e.target.value)}
                      rows={3}
                      style={{
                        width: "100%",
                        border: "1px solid #86efac",
                        borderRadius: "6px",
                        padding: "8px 10px",
                        fontSize: "13px",
                        resize: "vertical",
                        outline: "none",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                      }}
                      autoFocus
                    />
                    <div
                      style={{ display: "flex", gap: "8px", marginTop: "8px" }}
                    >
                      <button
                        type="button"
                        onClick={async () => {
                          await patchOrder({
                            repairDetails: repairDetailsInput,
                          });
                          setEditingRepairDetails(false);
                          toast.success("Onarım detayı güncellendi");
                          await load();
                        }}
                        style={{
                          padding: "6px 14px",
                          background: "#16a34a",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        Kaydet
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingRepairDetails(false)}
                        style={{
                          padding: "6px 14px",
                          background: "white",
                          color: "#374151",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#111827",
                      lineHeight: "1.6",
                    }}
                  >
                    {order.repairDetails || "Henüz onarım detayı girilmemiş"}
                  </p>
                )}
              </div>
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
                              disabled={
                                deletingWithPassword &&
                                pendingDeleteKind === "spare" &&
                                pendingDeleteId === u.id
                              }
                              aria-label="Kaldır"
                              onClick={() => requestRemoveSpareUsage(u.id)}
                            >
                              {deletingWithPassword &&
                              pendingDeleteKind === "spare" &&
                              pendingDeleteId === u.id ? (
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
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  onClick={() => sesliNoteBasla("note")}
                  disabled={dinleniyor !== null || sesliNotLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    border: "none",
                    background:
                      dinleniyor === "note"
                        ? "#dc2626"
                        : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {dinleniyor === "note"
                    ? "🔴 Dinleniyor..."
                    : sesliNotLoading
                      ? "⏳ Düzenleniyor..."
                      : "🎤 Sesli Not Al"}
                </button>
                <p style={{ fontSize: "11px", color: "#9ca3af" }}>
                  AI metni düzenler
                </p>
              </div>
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
          {yetkiVar("canUpdateServisStatus") && (
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
                {personeller.length > 0 && aktifPersonelIsAdmin ? (
                  <div style={{ marginBottom: "12px" }}>
                    <label
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Bu işlemi yapan personel (opsiyonel)
                    </label>
                    <select
                      value={secilenPersonelId}
                      onChange={(e) => setSecilenPersonelId(e.target.value)}
                      style={{
                        width: "100%",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        padding: "7px 10px",
                        fontSize: "13px",
                        outline: "none",
                        background: "white",
                      }}
                    >
                      <option value="">Personel seçin</option>
                      {personeller.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
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
          )}

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

          {/* Serbest WhatsApp Mesajı */}
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "16px",
              marginBottom: "16px",
              background: "white",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#374151",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg
                width="16"
                height="16"
                fill="#25D366"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L0 24l6.29-1.505A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.366l-.36-.214-3.733.893.924-3.638-.235-.374A9.818 9.818 0 1 1 12 21.818z" />
              </svg>
              WhatsApp Mesajı Gönder
            </h3>
            <textarea
              value={customWaMessage}
              onChange={(e) => setCustomWaMessage(e.target.value)}
              placeholder="Müşteriye göndermek istediğiniz mesajı yazın..."
              rows={3}
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "13px",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
            <button
              type="button"
              onClick={() => void handleSendCustomWa()}
              disabled={sendingCustomWa || !customWaMessage.trim()}
              style={{
                marginTop: "10px",
                padding: "8px 18px",
                background: sendingCustomWa ? "#86efac" : "#25D366",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: sendingCustomWa ? "wait" : "pointer",
              }}
            >
              {sendingCustomWa ? "Gönderiliyor..." : "Mesajı Gönder"}
            </button>
          </div>

          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle>Durum Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
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
                        {log.oldPrice != null || log.newPrice != null ? (
                          <div>
                            <span style={{ fontWeight: 600, color: "#374151" }}>
                              Fiyat Güncellendi
                            </span>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#6b7280",
                                marginTop: "2px",
                              }}
                            >
                              {log.oldPrice != null
                                ? `${log.oldPrice.toLocaleString("tr-TR")} ₺`
                                : "—"}
                              {" → "}
                              {log.newPrice != null
                                ? `${log.newPrice.toLocaleString("tr-TR")} ₺`
                                : "—"}
                            </div>
                          </div>
                        ) : (
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
                            {log.personnel?.name ? (
                              <span style={{ fontSize: "11px", color: "#6b7280" }}>
                                {" "}
                                — {log.personnel.name}
                              </span>
                            ) : null}
                          </p>
                        )}
                        {log.note ? (
                          <p className="mt-1 text-xs text-slate-600">
                            {log.note}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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

      </div>

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
                  setPendingDeleteKind(null);
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
