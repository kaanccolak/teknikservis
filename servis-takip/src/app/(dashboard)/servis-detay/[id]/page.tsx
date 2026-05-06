"use client";

import { ArrowLeft, Loader2, MessageSquare, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatServiceOrderNo } from "@/lib/service-order-number";
import {
  SERVICE_ORDER_STATUS_OPTIONS,
  serviceOrderStatusLabel,
  serviceOrderStatusToneClass,
} from "@/lib/service-order-status";
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

type ServiceOrderDetail = {
  id: string;
  orderNumber: string | null;
  status: string;
  serialNo: string | null;
  noSerialNo: boolean;
  warrantyStatus: string | null;
  isTampered: boolean;
  complaint: string | null;
  accessories: string | null;
  physicalDamage: string | null;
  arrivedByCargo: boolean;
  cargoInfo: string | null;
  arrivedAt: string;
  deviceTypeName: string | null;
  brandName: string | null;
  modelName: string | null;
  technicianNote: string | null;
  totalPrice: number | null;
  customer: Customer;
  deviceType: NamedEntity | null;
  brand: NamedEntity | null;
  deviceModel: NamedEntity | null;
  statusLogs: StatusLogRow[];
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

function warrantyLabel(w: string | null) {
  if (w === "guaranteed") return "Garantili";
  if (w === "no_warranty") return "Garantisiz";
  return "—";
}

function statusSelectItemsFor(currentStatus: string) {
  const base = Object.fromEntries(
    SERVICE_ORDER_STATUS_OPTIONS.map((o) => [o.value, o.label]),
  ) as Record<string, string>;
  if (currentStatus && !base[currentStatus]) {
    return {
      ...base,
      [currentStatus]: serviceOrderStatusLabel(currentStatus),
    };
  }
  return base;
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
  const id = typeof params.id === "string" ? params.id : "";

  const [order, setOrder] = useState<ServiceOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [priceDraft, setPriceDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      setPriceDraft(
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

  async function handleStatusChange(next: string | null) {
    if (!order || next == null || next === order.status) return;
    setSavingStatus(true);
    try {
      const updated = await patchOrder({ status: next });
      setOrder(updated);
      toast.success("Durum güncellendi");
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
      router.push("/cihaz-sorgula");
    } catch {
      toast.error("Kayıt silinemedi");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSavePrice() {
    if (!order) return;
    const raw = priceDraft.trim().replace(",", ".");
    if (raw === "") {
      setSavingPrice(true);
      try {
        const updated = await patchOrder({ totalPrice: null });
        setOrder(updated);
        setPriceDraft("");
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
    setSavingPrice(true);
    try {
      const updated = await patchOrder({ totalPrice: n });
      setOrder(updated);
      setPriceDraft(
        updated.totalPrice != null ? String(updated.totalPrice) : "",
      );
      toast.success("Ücret kaydedildi");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ücret kaydedilemedi");
    } finally {
      setSavingPrice(false);
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
        <Link
          href="/cihaz-sorgula"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ArrowLeft className="mr-2 size-4" aria-hidden />
          Geri Dön
        </Link>
        <p className="text-sm text-destructive" role="alert">
          {error ?? "Kayıt bulunamadı"}
        </p>
      </div>
    );
  }

  const titleNo = formatServiceOrderNo(order);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 lg:min-w-[12rem]">
          <Link
            href="/cihaz-sorgula"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            Geri Dön
          </Link>
          <Link
            href={`/servis-detay/${encodeURIComponent(order.id)}/duzenle`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Pencil className="mr-2 size-4" aria-hidden />
            Kaydı Düzenle
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
        <h1 className="min-w-0 flex-1 text-center text-xl font-semibold tracking-tight text-slate-900 lg:text-2xl">
          Kayıt No #{titleNo}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-2 lg:w-auto lg:min-w-[280px] lg:justify-end">
          <Badge
            variant="outline"
            className={cn(
              "border font-medium shadow-none",
              serviceOrderStatusToneClass(order.status),
            )}
          >
            {serviceOrderStatusLabel(order.status)}
          </Badge>
          <Select
            value={order.status}
            onValueChange={(v) => void handleStatusChange(v)}
            disabled={savingStatus}
            items={statusSelectItemsFor(order.status)}
          >
            <SelectTrigger size="sm" className="min-w-[11rem]">
              <SelectValue placeholder="Durumu Güncelle" />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_ORDER_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
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
              </dl>
            </CardContent>
          </Card>

          <Card>
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
                <span className="font-medium text-slate-800">
                  {serviceOrderStatusLabel(order.status)}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {SERVICE_ORDER_STATUS_OPTIONS.map((o) => {
                const active = order.status === o.value;
                return (
                  <Button
                    key={o.value}
                    type="button"
                    variant={active ? "secondary" : "outline"}
                    className="h-auto w-full justify-start py-2.5 text-left font-normal"
                    disabled={savingStatus || active}
                    onClick={() => void handleStatusChange(o.value)}
                  >
                    {o.label}
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle>Ücret</CardTitle>
              <CardDescription>
                Kayıtlı tutar:{" "}
                <span className="font-medium text-slate-800">
                  {formatTry(order.totalPrice)}
                </span>
              </CardDescription>
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
                    value={priceDraft}
                    onChange={(e) => setPriceDraft(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Boş bırakıp kaydederseniz ücret silinir.
                </p>
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
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() =>
                    toast.info("SMS özelliği yakında aktif olacak")
                  }
                >
                  <MessageSquare className="size-4 shrink-0" aria-hidden />
                  SMS Gönder
                </Button>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
