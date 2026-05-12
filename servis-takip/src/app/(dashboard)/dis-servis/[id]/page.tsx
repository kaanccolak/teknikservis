"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
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
import { formatServiceOrderNo } from "@/lib/service-order-number";
import { getStatusUiConfig } from "@/lib/service-order-status-ui-config";
import { cn } from "@/lib/utils";

type ServiceOrderRow = {
  id: string;
  orderNumber: string | null;
  status: string;
  deviceTypeName: string | null;
  brandName: string | null;
  modelName: string | null;
  customer: { name: string };
  deviceType: { name: string } | null;
  brand: { name: string } | null;
  deviceModel: { name: string } | null;
  statusLogs: { createdAt: string }[];
};

/** Dış servis detay API yanıtı */
type ExternalServiceData = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  totalPaid?: number;
  serviceOrders: ServiceOrderRow[];
};

function formatTrDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function phoneToTelHref(phone: string | null): string | null {
  if (!phone?.trim()) return null;
  const d = phone.replace(/\D/g, "");
  if (!d) return null;
  const intl = d.startsWith("90") ? `+${d}` : `+90${d}`;
  return `tel:${intl}`;
}

function deviceLine(o: ServiceOrderRow) {
  const t = o.deviceType?.name ?? o.deviceTypeName ?? "—";
  const b = o.brand?.name ?? o.brandName ?? "—";
  const m = o.deviceModel?.name ?? o.modelName ?? "—";
  return `${t} / ${b} / ${m}`;
}

export default function DisServisDetayPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [data, setData] = useState<ExternalServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePhase, setDeletePhase] = useState<"confirm" | "blocked">(
    "confirm",
  );
  const [linkedCount, setLinkedCount] = useState(0);
  const [showDeletePasswordModal, setShowDeletePasswordModal] =
    useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");
  const [deletingWithPassword, setDeletingWithPassword] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id.trim()) {
      setError("Geçersiz kayıt");
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/external-services/${id}`);
      const json = (await res.json()) as ExternalServiceData | { error?: string };
      if (!res.ok) {
        setError((json as { error?: string }).error ?? "Kayıt yüklenemedi");
        setData(null);
        return;
      }
      setData(json as ExternalServiceData);
    } catch {
      setError("Bağlantı hatası");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDeleteWithPassword() {
    if (!deletePassword.trim()) {
      setDeletePasswordError("Parola girin");
      return;
    }
    if (!pendingDeleteId?.trim()) return;
    setDeletingWithPassword(true);
    setDeletePasswordError("");
    try {
      const res = await fetch(`/api/external-services/${pendingDeleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settingsPassword: deletePassword }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        linkedCount?: number;
      };
      if (!res.ok) {
        if (res.status === 403) {
          setDeletePasswordError(body.error ?? "Parola yanlış");
          return;
        }
        const n = body.linkedCount ?? 0;
        if (n > 0) {
          setLinkedCount(n);
          setDeletePhase("blocked");
          setShowDeletePasswordModal(false);
          setDeletePassword("");
          setPendingDeleteId(null);
          setDeleteOpen(true);
          return;
        }
        toast.error(body.error ?? "Silinemedi");
        return;
      }
      setShowDeletePasswordModal(false);
      setDeletePassword("");
      setPendingDeleteId(null);
      setDeleteOpen(false);
      toast.success("Silindi");
      router.push("/dis-servis");
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setDeletingWithPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-600">
        <Loader2 className="size-8 animate-spin" aria-hidden />
        <p className="text-sm">Yükleniyor…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link
          href="/dis-servis"
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

  const orders = data.serviceOrders ?? [];
  const totalSent = orders.length;
  const currentlyThere = orders.filter((o) => o.status === "sent_to_external")
    .length;
  const returned = orders.filter((o) => o.status !== "sent_to_external").length;
  const telHref = phoneToTelHref(data.phone);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dis-servis"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ArrowLeft className="mr-2 size-4" aria-hidden />
          Geri Dön
        </Link>
        <h1 className="min-w-0 flex-1 text-xl font-semibold text-slate-900 sm:text-2xl">
          {data.name}
        </h1>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/dis-servis?duzenle=${encodeURIComponent(data.id)}`)
            }
          >
            Düzenle
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              setDeletePhase("confirm");
              setDeleteOpen(true);
            }}
          >
            Sil
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle>Servis Bilgileri</CardTitle>
              <CardDescription>Dış servis iletişim ve notlar</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Servis Adı</dt>
                  <dd className="font-medium text-slate-900">{data.name}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Yetkili Kişi</dt>
                  <dd className="text-slate-900">
                    {data.contactName?.trim() ? data.contactName : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Telefon</dt>
                  <dd>
                    {telHref ? (
                      <a
                        href={telHref}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {data.phone}
                      </a>
                    ) : (
                      <span className="text-slate-900">—</span>
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Adres</dt>
                  <dd className="whitespace-pre-wrap text-slate-900">
                    {data.address?.trim() ? data.address : "—"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Notlar</dt>
                  <dd className="whitespace-pre-wrap text-slate-900">
                    {data.notes?.trim() ? data.notes : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Oluşturulma tarihi</dt>
                  <dd className="text-slate-900">
                    {formatTrDateTime(data.createdAt)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <CardTitle>Gönderilen Cihazlar</CardTitle>
                <CardDescription>Bu servise atanmış kayıtlar</CardDescription>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {totalSent}
              </Badge>
            </CardHeader>
            <CardContent className="pt-4">
              {orders.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-600">
                  Bu servise henüz cihaz gönderilmedi
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-slate-200">
                  <table className="w-full min-w-[800px] text-left text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="px-3 py-2.5 font-medium">Kayıt No</th>
                        <th className="px-3 py-2.5 font-medium">
                          Müşteri Adı
                        </th>
                        <th className="px-3 py-2.5 font-medium">Cihaz</th>
                        <th className="px-3 py-2.5 font-medium">
                          Gönderilme Tarihi
                        </th>
                        <th className="px-3 py-2.5 font-medium">
                          Mevcut Durum
                        </th>
                        <th className="px-3 py-2.5 font-medium">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => {
                        const sentLog = o.statusLogs[0];
                        const sentAt = sentLog?.createdAt
                          ? formatTrDateTime(sentLog.createdAt)
                          : "—";
                        const st = getStatusUiConfig(o.status);
                        return (
                          <tr key={o.id} className="border-b last:border-0">
                            <td className="px-3 py-2.5 font-mono text-xs">
                              {formatServiceOrderNo(o)}
                            </td>
                            <td className="px-3 py-2.5">{o.customer.name}</td>
                            <td className="max-w-[220px] px-3 py-2.5 text-slate-700">
                              {deviceLine(o)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                              {sentAt}
                            </td>
                            <td className="px-3 py-2.5">
                              <Badge
                                variant="outline"
                                className="border font-medium shadow-none"
                                style={{
                                  background: st.bg,
                                  color: st.color,
                                  border: `1px solid ${st.border}`,
                                }}
                              >
                                {st.label}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5">
                              <Link
                                href={`/servis-detay/${o.id}`}
                                className={cn(
                                  buttonVariants({
                                    variant: "outline",
                                    size: "sm",
                                  }),
                                )}
                              >
                                Detay
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle>Özet</CardTitle>
              <CardDescription>Cihaz istatistikleri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 text-sm">
              <div
                style={{
                  padding: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  background: "#fafafa",
                }}
              >
                <p style={{ fontSize: "13px", color: "#6b7280" }}>Toplam Ödeme</p>
                <p
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {(data.totalPaid ?? 0).toLocaleString("tr-TR")} ₺
                </p>
              </div>
              <div className="flex justify-between gap-2 border-b border-slate-100 pb-3">
                <span className="text-slate-600">Toplam gönderilen</span>
                <span className="font-semibold text-slate-900">
                  {totalSent} cihaz
                </span>
              </div>
              <div className="flex justify-between gap-2 border-b border-slate-100 pb-3">
                <span className="text-slate-600">Şu an orada</span>
                <span className="font-semibold text-slate-900">
                  {currentlyThere} cihaz
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-600">Geri dönen</span>
                <span className="font-semibold text-slate-900">
                  {returned} cihaz
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeletePhase("confirm");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletePhase === "blocked"
                ? "Silinemez"
                : "Dış servisi silmek istiyor musunuz?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletePhase === "blocked"
                ? `Bu dış servise bağlı ${linkedCount} servis kaydı var. Önce ilgili kayıtların durumunu veya dış servis atamasını güncelleyin.`
                : "Bu işlem geri alınamaz."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {deletePhase === "blocked" ? (
              <AlertDialogCancel type="button" className="sm:mt-0">
                Tamam
              </AlertDialogCancel>
            ) : (
              <>
                <AlertDialogCancel type="button">İptal</AlertDialogCancel>
                <AlertDialogAction
                  type="button"
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!id.trim()) return;
                    setPendingDeleteId(id);
                    setDeleteOpen(false);
                    setShowDeletePasswordModal(true);
                  }}
                >
                  Evet, Sil
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
