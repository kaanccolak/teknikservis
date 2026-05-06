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

type ExternalDetail = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
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

  const [data, setData] = useState<ExternalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePhase, setDeletePhase] = useState<"confirm" | "blocked">(
    "confirm",
  );
  const [linkedCount, setLinkedCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

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
      const json = (await res.json()) as ExternalDetail | { error?: string };
      if (!res.ok) {
        setError((json as { error?: string }).error ?? "Kayıt yüklenemedi");
        setData(null);
        return;
      }
      setData(json as ExternalDetail);
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

  async function confirmDelete() {
    if (deletePhase !== "confirm" || !id.trim()) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/external-services/${id}`, {
        method: "DELETE",
      });
      const body = (await res.json()) as {
        error?: string;
        linkedCount?: number;
      };
      if (!res.ok) {
        const n = body.linkedCount ?? 0;
        if (n > 0) {
          setLinkedCount(n);
          setDeletePhase("blocked");
          return;
        }
        toast.error(body.error ?? "Silme başarısız");
        return;
      }
      toast.success("Dış servis silindi");
      setDeleteOpen(false);
      router.push("/dis-servis");
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setDeleting(false);
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
                  disabled={deleting}
                  onClick={(e) => {
                    e.preventDefault();
                    void confirmDelete();
                  }}
                >
                  {deleting ? "Siliniyor…" : "Evet, Sil"}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
