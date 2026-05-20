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

import PageGuideModal from "@/components/onboarding/PageGuideModal";
import YetkiYok from "@/components/YetkiYok";
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
import { usePersonelYetki } from "@/hooks/usePersonelYetki";

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
  iskonto?: number | null;
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
  iskonto: null,
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
  const { yetkiVar } = usePersonelYetki();
  const [sayfaYetkisiVar, setSayfaYetkisiVar] = useState(true);
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
  const [showDeletePasswordModal, setShowDeletePasswordModal] =
    useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");
  const [deletingWithPassword, setDeletingWithPassword] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteForce, setPendingDeleteForce] = useState(false);
  const [hasSettingsPassword, setHasSettingsPassword] = useState<
    boolean | null
  >(null);

  const firmaAdiRef = useRef<HTMLInputElement>(null);
  const yetkiliRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const vergiDairesiRef = useRef<HTMLInputElement>(null);
  const tcVergiRef = useRef<HTMLInputElement>(null);
  const iskontoRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);

  const total = useMemo(() => rows.length, [rows.length]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const searchPart = search.trim()
        ? `&search=${encodeURIComponent(search.trim())}`
        : "";
      const res = await fetch(`/api/bayiler?t=${Date.now()}${searchPart}`, {
        cache: "no-store",
      });
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
      iskonto: row.iskonto ?? null,
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

  async function askDelete(row: Bayi) {
    setDeleteRow(row);
    setDeleteLinkedCount(0);
    // Bağlı aktif servis kaydı sayısını önceden çek
    try {
      const res = await fetch(`/api/bayiler/${row.id}`);
      if (res.ok) {
        const data = (await res.json()) as { totalOrders?: number };
        setDeleteLinkedCount(data.totalOrders ?? 0);
      }
    } catch {
      // hata olursa 0 kalır
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

  async function runBayiDelete(
    settingsPassword: string,
    id?: string,
    force?: boolean,
  ) {
    const deleteId = id ?? pendingDeleteId;
    const isForce = force ?? pendingDeleteForce;
    if (!deleteId) return;
    setDeletingWithPassword(true);
    setDeletePasswordError("");
    try {
      const suffix = isForce ? "?force=true" : "";
      const res = await fetch(`/api/bayiler/${deleteId}${suffix}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settingsPassword }),
      });
      const data = (await res.json()) as {
        error?: string;
        linkedCount?: number;
      };
      if (!res.ok) {
        if (res.status === 403) {
          setDeletePasswordError(data.error ?? "Parola yanlış");
          return;
        }
        if ((data.linkedCount ?? 0) > 0 && !isForce) {
          setDeleteLinkedCount(data.linkedCount ?? 0);
          setPendingDeleteForce(true);
          setDeletePasswordError(
            data.error ?? "Bağlı kayıtlar var; tekrar Sil ile onaylayın",
          );
          return;
        }
        toast.error(data.error ?? "Silinemedi");
        return;
      }
      setShowDeletePasswordModal(false);
      setDeletePassword("");
      setPendingDeleteId(null);
      setPendingDeleteForce(false);
      setDeleteRow(null);
      setDeleteLinkedCount(0);
      toast.success("Silindi");
      await new Promise((r) => setTimeout(r, 500));
      await loadRows();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setDeletingWithPassword(false);
    }
  }

  async function confirmDeleteWithPassword() {
    if (hasSettingsPassword === true && !deletePassword.trim()) {
      setDeletePasswordError("Parola girin");
      return;
    }
    await runBayiDelete(deletePassword.trim());
  }

  useEffect(() => {
    const isAdmin = sessionStorage.getItem("activePersonnelIsAdmin");
    if (isAdmin === null || isAdmin === "true") return;
    const permsRaw = sessionStorage.getItem("activePersonnelPermissions");
    if (!permsRaw) {
      setSayfaYetkisiVar(false);
      return;
    }
    try {
      const perms = JSON.parse(permsRaw) as Record<string, boolean>;
      setSayfaYetkisiVar(!!perms.canViewBayiler);
    } catch {
      setSayfaYetkisiVar(false);
    }
  }, []);

  if (!sayfaYetkisiVar) return <YetkiYok />;

  return (
    <div className="space-y-6">
      <PageGuideModal
        pageKey="bayiler"
        icon="🤝"
        title="Bayiler"
        description="Sisteminizi kullanan bayi veya şubelerinizi yönetin. Her bayi için ayrı servis takibi yapılır."
        tips={[
          "Her bayi için ayrı hesap tanımlayın",
          "Bayi bazında servis kayıtlarını ve ciroyu takip edin",
          "Cihaz kaydında bayi seçerek kayıtları ilgili bayiye atayın",
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Bayiler</h1>
        {yetkiVar("canAddBayi") && (
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-2 size-4" /> Yeni Bayi
          </Button>
        )}
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
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="px-3 py-2.5">Bayi Kodu</th>
              <th className="px-3 py-2.5">Firma Adı</th>
              <th className="px-3 py-2.5">Yetkili Kişi</th>
              <th className="px-3 py-2.5">Telefon</th>
              <th className="px-3 py-2.5">İskonto</th>
              <th className="px-3 py-2.5">Cihaz Sayısı</th>
              <th className="px-3 py-2.5">Toplam Ciro</th>
              <th className="px-3 py-2.5">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-600" colSpan={8}>
                  Yükleniyor...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-600" colSpan={8}>
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
                  <td className="px-3 py-2.5">
                    {row.iskonto != null && row.iskonto > 0
                      ? `%${row.iskonto}`
                      : "—"}
                  </td>
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
                      {yetkiVar("canEditBayi") && (
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row)}>
                          Düzenle
                        </Button>
                      )}
                      {yetkiVar("canDeleteBayi") && (
                        <Button type="button" variant="destructive" size="sm" onClick={() => askDelete(row)}>
                          Sil
                        </Button>
                      )}
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
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                  setForm((p) => ({ ...p, tcVergiNo: val }));
                }}
                onKeyDown={(e) => handleEnterKey(e, iskontoRef)}
                inputMode="numeric"
                maxLength={11}
              />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  fontSize: "13px",
                  color: "#666",
                  marginBottom: "4px",
                  display: "block",
                }}
              >
                İskonto
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "14px", color: "#666" }}>%</span>
                <input
                  ref={iskontoRef}
                  type="text"
                  inputMode="decimal"
                  value={form.iskonto ?? ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    const n = parseFloat(val);
                    setForm({
                      ...form,
                      iskonto:
                        val === "" ? null : isNaN(n) ? null : Math.min(100, n),
                    });
                  }}
                  onKeyDown={(e) => handleEnterKey(e, saveRef)}
                  placeholder="0"
                  style={{
                    width: "80px",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>
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
                <div
                  style={{
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px solid #f3f4f6",
                    display: "grid",
                    gap: "8px",
                    fontSize: "13px",
                  }}
                >
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ color: "#6b7280", minWidth: "140px" }}>Vergi dairesi</span>
                    <span style={{ color: "#111827", fontWeight: 500 }}>
                      {detail.bayi.vergiDairesi?.trim() ? detail.bayi.vergiDairesi : "—"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ color: "#6b7280", minWidth: "140px" }}>TC / Vergi no</span>
                    <span style={{ color: "#111827", fontWeight: 500 }}>{detail.bayi.tcVergiNo}</span>
                  </div>
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
                void (async () => {
                  if (!deleteRow) return;
                  const idToDelete = deleteRow.id;
                  const forceDelete = deleteLinkedCount > 0;
                  setDeleteRow(null);

                  let hp = hasSettingsPassword;
                  if (hp === null) {
                    hp = await ensureHasSettingsPassword();
                  }

                  if (!hp) {
                    await runBayiDelete("", idToDelete, forceDelete);
                    return;
                  }

                  setPendingDeleteId(idToDelete);
                  setPendingDeleteForce(forceDelete);
                  setShowDeletePasswordModal(true);
                })();
              }}
            >
              Evet, Sil
            </AlertDialogAction>
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
                  setPendingDeleteForce(false);
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
