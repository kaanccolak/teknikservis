"use client";

import { Plus } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrPhoneInput } from "@/components/tr-phone-input";
import { formatPhone } from "@/lib/formatPhone";
import { getStatusBadge } from "@/lib/statusConfig";
import { cn } from "@/lib/utils";

function handleEnterKey(
  e: KeyboardEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  nextRef: RefObject<HTMLElement | null>,
) {
  if (e.key !== "Enter") return;
  if (e.currentTarget instanceof HTMLTextAreaElement && e.shiftKey) return;
  e.preventDefault();
  nextRef.current?.focus();
}

interface Bayi {
  id: string;
  bayiCode: string;
  firmaAdi: string;
  yetkiliKisi: string;
  phone: string;
  vergiDairesi?: string | null;
  tcVergiNo: string;
  cihazSayisi: number;
  toplamCiro: number;
  createdAt: string;
}

type BayiDetailOrder = {
  id: string;
  orderNumber: string | null;
  status: string;
  totalPrice: number | null;
  customer: { name: string } | null;
  deviceType: { name: string } | null;
  brand: { name: string } | null;
  deviceModel: { name: string } | null;
};

type BayiDetailResponse = {
  bayi: Bayi & { serviceOrders: BayiDetailOrder[] };
  totalOrders: number;
  totalRevenue: number;
  repaired: number;
  notRepaired: number;
};

type BayiForm = Omit<
  Bayi,
  "id" | "createdAt" | "bayiCode" | "cihazSayisi" | "toplamCiro"
>;

const emptyForm: BayiForm = {
  firmaAdi: "",
  yetkiliKisi: "",
  phone: "",
  vergiDairesi: "",
  tcVergiNo: "",
};

function formatTry(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function BayilerPage() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Bayi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detail, setDetail] = useState<BayiDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editing, setEditing] = useState<Bayi | null>(null);
  const [form, setForm] = useState<BayiForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Bayi | null>(null);
  const [deleteLinkedCount, setDeleteLinkedCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const firmaAdiRef = useRef<HTMLInputElement>(null);
  const yetkiliRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const vergiDairesiRef = useRef<HTMLInputElement>(null);
  const tcVergiRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);

  const total = useMemo(() => rows.length, [rows.length]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const res = await fetch(`/api/bayiler${qs}`);
      const data = (await res.json()) as Bayi[] | { error?: string };
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Bayiler yüklenemedi");
        setRows([]);
        return;
      }
      setRows(data as Bayi[]);
    } catch {
      setError("Bağlantı hatası");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = window.setTimeout(() => void loadRows(), 250);
    return () => window.clearTimeout(t);
  }, [loadRows]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(row: Bayi) {
    setEditing(row);
    setForm({
      firmaAdi: row.firmaAdi,
      yetkiliKisi: row.yetkiliKisi,
      phone: row.phone ?? "",
      vergiDairesi: row.vergiDairesi ?? "",
      tcVergiNo: row.tcVergiNo ?? "",
    });
    setDialogOpen(true);
  }

  async function saveBayi() {
    if (form.firmaAdi.trim().length < 2) {
      toast.error("Firma adı zorunludur");
      return;
    }
    if (form.yetkiliKisi.trim().length < 2) {
      toast.error("Yetkili kişi zorunludur");
      return;
    }
    const phoneDigits = (form.phone ?? "").replace(/\D/g, "");
    if (phoneDigits.length !== 10 || !phoneDigits.startsWith("5")) {
      toast.error("Telefon 10 haneli ve 5 ile başlamalıdır");
      return;
    }
    if ((form.tcVergiNo ?? "").trim().length < 10) {
      toast.error("TC/Vergi no zorunludur");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/bayiler/${editing.id}` : "/api/bayiler", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "İşlem başarısız");
        return;
      }
      toast.success(editing ? "Bayi güncellendi" : "Bayi oluşturuldu");
      setDialogOpen(false);
      await loadRows();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSaving(false);
    }
  }

  async function handleDetail(bayiId: string) {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const res = await fetch(`/api/bayiler/${bayiId}`);
      const data = (await res.json()) as BayiDetailResponse | { error?: string };
      if (!res.ok) {
        toast.error((data as { error?: string }).error ?? "Detay alınamadı");
        setShowDetailModal(false);
        return;
      }
      setDetail(data as BayiDetailResponse);
    } catch {
      toast.error("Bağlantı hatası");
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  }

  function askDelete(row: Bayi) {
    setDeleteRow(row);
    setDeleteLinkedCount(0);
  }

  async function confirmDelete(force: boolean) {
    if (!deleteRow) return;
    setDeleting(true);
    try {
      const suffix = force ? "?force=true" : "";
      const res = await fetch(`/api/bayiler/${deleteRow.id}${suffix}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string; linkedCount?: number };
      if (!res.ok) {
        if ((data.linkedCount ?? 0) > 0 && !force) {
          setDeleteLinkedCount(data.linkedCount ?? 0);
          return;
        }
        toast.error(data.error ?? "Silme başarısız");
        return;
      }
      toast.success("Bayi silindi");
      setDeleteRow(null);
      setDeleteLinkedCount(0);
      await loadRows();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Bayiler</h1>
        <Button type="button" onClick={openCreate}>
          <Plus className="mr-2 size-4" /> Yeni Bayi
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full max-w-md space-y-1.5">
          <Label htmlFor="bayi-search">Arama</Label>
          <Input
            id="bayi-search"
            placeholder="Firma adı, yetkili, telefon veya vergi no ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className="text-sm text-slate-600">Toplam {total} bayi</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="px-3 py-2.5">Bayi Kodu</th>
              <th className="px-3 py-2.5">Firma Adı</th>
              <th className="px-3 py-2.5">Yetkili Kişi</th>
              <th className="px-3 py-2.5">Telefon</th>
              <th className="px-3 py-2.5">Cihaz Sayısı</th>
              <th className="px-3 py-2.5">Toplam Ciro</th>
              <th className="px-3 py-2.5">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-600" colSpan={7}>
                  Yükleniyor...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-600" colSpan={7}>
                  Bayi bulunamadı
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2.5 font-mono text-xs">{row.bayiCode || "—"}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-900">{row.firmaAdi}</td>
                  <td className="px-3 py-2.5">{row.yetkiliKisi}</td>
                  <td className="px-3 py-2.5">{row.phone ? formatPhone(row.phone) : "—"}</td>
                  <td className="px-3 py-2.5">{row.cihazSayisi} cihaz</td>
                  <td className="px-3 py-2.5">{formatTry(row.toplamCiro ?? 0)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleDetail(row.id)}
                        style={{
                          padding: "5px 12px",
                          border: "1px solid #8B5CF6",
                          borderRadius: "6px",
                          background: "white",
                          color: "#8B5CF6",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontWeight: "500",
                        }}
                      >
                        Detay
                      </button>
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row)}>
                        Düzenle
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => askDelete(row)}>
                        Sil
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Bayi Düzenle" : "Yeni Bayi"}</DialogTitle>
            <DialogDescription>Bayi bilgilerini girin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Firma Adı</Label>
              <Input
                ref={firmaAdiRef}
                autoFocus
                value={form.firmaAdi}
                onChange={(e) => setForm((p) => ({ ...p, firmaAdi: e.target.value }))}
                onKeyDown={(e) => handleEnterKey(e, yetkiliRef)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Firma Yetkili Kişi</Label>
              <Input
                ref={yetkiliRef}
                value={form.yetkiliKisi}
                onChange={(e) => setForm((p) => ({ ...p, yetkiliKisi: e.target.value }))}
                onKeyDown={(e) => handleEnterKey(e, phoneRef)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <TrPhoneInput
                ref={phoneRef}
                value={form.phone ?? ""}
                onValueChange={(v) => setForm((p) => ({ ...p, phone: v }))}
                onKeyDown={(e) => handleEnterKey(e, vergiDairesiRef)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vergi Dairesi</Label>
              <Input
                ref={vergiDairesiRef}
                value={form.vergiDairesi ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, vergiDairesi: e.target.value }))}
                onKeyDown={(e) => handleEnterKey(e, tcVergiRef)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>TC Kimlik / Vergi Numarası</Label>
              <Input
                ref={tcVergiRef}
                value={form.tcVergiNo ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, tcVergiNo: e.target.value }))}
                onKeyDown={(e) => handleEnterKey(e, saveRef)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              İptal
            </Button>
            <button
              type="button"
              ref={saveRef}
              className={cn(buttonVariants())}
              disabled={saving}
              onClick={() => void saveBayi()}
            >
              {saving ? "Kaydediliyor..." : editing ? "Güncelle" : "Kaydet"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDetailModal}
        onOpenChange={(open) => {
          setShowDetailModal(open);
          if (!open) setDetail(null);
        }}
      >
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Bayi Detayı</DialogTitle>
            <DialogDescription>Bayi performans ve kayıt bilgileri</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-10 text-center text-sm text-slate-600">Yükleniyor...</div>
          ) : detail ? (
            <div>
              <div
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  paddingBottom: "16px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ fontSize: "18px", fontWeight: "600" }}>{detail.bayi.firmaAdi}</div>
                <div style={{ fontSize: "13px", color: "#666" }}>
                  {detail.bayi.bayiCode} · {detail.bayi.yetkiliKisi} · {formatPhone(detail.bayi.phone)}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,1fr)",
                  gap: "12px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    background: "#F5F3FF",
                    border: "1px solid #DDD6FE",
                    borderRadius: "10px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#7C3AED", marginBottom: "4px" }}>
                    Toplam Cihaz
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: "#5B21B6" }}>
                    {detail.totalOrders}
                  </div>
                </div>

                <div
                  style={{
                    background: "#F0FDF4",
                    border: "1px solid #86EFAC",
                    borderRadius: "10px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#16A34A", marginBottom: "4px" }}>
                    Toplam Ciro
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: "#15803D" }}>
                    ₺{detail.totalRevenue.toLocaleString("tr-TR")}
                  </div>
                </div>

                <div
                  style={{
                    background: "#EFF6FF",
                    border: "1px solid #93C5FD",
                    borderRadius: "10px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#2563EB", marginBottom: "4px" }}>
                    Onarım Yapıldı
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: "#1D4ED8" }}>
                    {detail.repaired}
                  </div>
                </div>

                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    borderRadius: "10px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#DC2626", marginBottom: "4px" }}>
                    Onarım Yapılamadı
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: "#B91C1C" }}>
                    {detail.notRepaired}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>
                Cihaz Kayıtları
              </div>

              <div
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: "500", color: "#666" }}>
                        Kayıt No
                      </th>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: "500", color: "#666" }}>
                        Müşteri
                      </th>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: "500", color: "#666" }}>
                        Cihaz
                      </th>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: "500", color: "#666" }}>
                        Durum
                      </th>
                      <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: "500", color: "#666" }}>
                        Ücret
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.bayi.serviceOrders.map((order) => {
                      const badge = getStatusBadge(order.status);
                      return (
                        <tr key={order.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "10px 12px", fontWeight: "500" }}>
                            #{order.orderNumber ?? "—"}
                          </td>
                          <td style={{ padding: "10px 12px", color: "#374151" }}>
                            {order.customer?.name}
                          </td>
                          <td style={{ padding: "10px 12px", color: "#374151" }}>
                            {[order.brand?.name, order.deviceModel?.name].filter(Boolean).join(" ")}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span
                              style={{
                                background: badge.bg,
                                color: badge.color,
                                border: `1px solid ${badge.border}`,
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: "500",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: "500" }}>
                            {(order.totalPrice ?? 0) > 0 ? `₺${order.totalPrice?.toLocaleString("tr-TR")}` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {detail.bayi.serviceOrders.length === 0 ? (
                  <div
                    style={{
                      padding: "24px",
                      textAlign: "center",
                      color: "#9ca3af",
                      fontSize: "13px",
                    }}
                  >
                    Henüz kayıt bulunmuyor
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteRow !== null} onOpenChange={(open) => !open && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu bayiyi silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteLinkedCount > 0
                ? `Bu bayiye bağlı ${deleteLinkedCount} servis kaydı var. Yine de silmek istiyor musunuz?`
                : "Bu işlem geri alınamaz."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete(deleteLinkedCount > 0);
              }}
              disabled={deleting}
            >
              {deleting ? "Siliniyor..." : "Evet, Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
