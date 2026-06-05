"use client";

import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { TrPhoneInput } from "@/components/tr-phone-input";
import { formatPhone } from "@/lib/formatPhone";
import { cn } from "@/lib/utils";
import { usePersonelYetki } from "@/hooks/usePersonelYetki";

function handleEnterKey(
  e: KeyboardEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >,
  nextRef: RefObject<HTMLElement | null>,
) {
  if (e.key !== "Enter") return;
  if (e.currentTarget instanceof HTMLTextAreaElement && e.shiftKey) return;
  e.preventDefault();
  nextRef.current?.focus();
}

interface Cari {
  id: string;
  cariCode?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxOrTcNo?: string;
  taxOffice?: string;
  cargoInfo?: string;
  cargoCode?: string;
  createdAt: string;
}

type CariForm = Omit<Cari, "id" | "createdAt" | "cariCode">;

type CariHareket = {
  id: string;
  tip: "alacak" | "verecek";
  tutar: number;
  aciklama: string | null;
  odendi: boolean;
  odemeTarihi: string | null;
  createdAt: string;
};

const emptyForm: CariForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  taxOrTcNo: "",
  taxOffice: "",
  cargoInfo: "",
  cargoCode: "",
};

export default function CariPage() {
  const router = useRouter();
  const { yetkiVar } = usePersonelYetki();
  const [sayfaYetkisiVar, setSayfaYetkisiVar] = useState(true);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Cari[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCari, setSelectedCari] = useState<Cari | null>(null);
  const [hareketler, setHareketler] = useState<CariHareket[]>([]);
  const [hareketLoading, setHareketLoading] = useState(false);
  const [yeniHareket, setYeniHareket] = useState<{ tip: "alacak" | "verecek"; tutar: string; aciklama: string }>({ tip: "alacak", tutar: "", aciklama: "" });
  const [hareketTab, setHareketTab] = useState<"liste" | "yeni">("liste");
  const [savingHareket, setSavingHareket] = useState(false);
  const [editing, setEditing] = useState<Cari | null>(null);
  const [form, setForm] = useState<CariForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Cari | null>(null);
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

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const taxOfficeRef = useRef<HTMLInputElement>(null);
  const taxOrTcRef = useRef<HTMLInputElement>(null);
  const cargoInfoRef = useRef<HTMLInputElement>(null);
  const cargoCodeRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);

  const total = useMemo(() => rows.length, [rows.length]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const res = await fetch(`/api/cari${qs}`, { cache: "no-store" });
      const data = (await res.json()) as Cari[] | { error?: string };
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Cariler yüklenemedi");
        setRows([]);
        return;
      }
      setRows(data as Cari[]);
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

  function openEdit(row: Cari) {
    setEditing(row);
    setForm({
      name: row.name,
      phone: row.phone ?? "",
      email: row.email ?? "",
      address: row.address ?? "",
      taxOrTcNo: row.taxOrTcNo ?? "",
      taxOffice: row.taxOffice ?? "",
      cargoInfo: row.cargoInfo ?? "",
      cargoCode: row.cargoCode ?? "",
    });
    setDialogOpen(true);
  }

  async function loadHareketler(cariId: string) {
    setHareketLoading(true);
    try {
      const res = await fetch(`/api/cari/${cariId}/hareketler`);
      const data = await res.json();
      if (Array.isArray(data)) setHareketler(data as CariHareket[]);
    } catch {
      setHareketler([]);
    } finally {
      setHareketLoading(false);
    }
  }

  async function handleSaveHareket() {
    if (!selectedCari) return;
    const tutar = parseFloat(yeniHareket.tutar.replace(",", "."));
    if (!Number.isFinite(tutar) || tutar <= 0) { toast.error("Geçerli tutar girin"); return; }
    setSavingHareket(true);
    try {
      const res = await fetch(`/api/cari/${selectedCari.id}/hareketler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tip: yeniHareket.tip, tutar, aciklama: yeniHareket.aciklama }),
      });
      if (!res.ok) { toast.error("Hareket eklenemedi"); return; }
      toast.success("Hareket eklendi");
      setYeniHareket({ tip: "alacak", tutar: "", aciklama: "" });
      setHareketTab("liste");
      void loadHareketler(selectedCari.id);
    } catch { toast.error("Bağlantı hatası"); }
    finally { setSavingHareket(false); }
  }

  async function handleOdendi(hareketId: string) {
    if (!selectedCari) return;
    try {
      const res = await fetch(`/api/cari/${selectedCari.id}/hareketler`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hareketId }),
      });
      if (!res.ok) { toast.error("Güncellenemedi"); return; }
      toast.success("Ödendi olarak işaretlendi");
      void loadHareketler(selectedCari.id);
    } catch { toast.error("Bağlantı hatası"); }
  }

  async function handleDeleteHareket(hareketId: string) {
    if (!selectedCari) return;
    if (!confirm("Bu hareketi silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/cari/${selectedCari.id}/hareketler`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hareketId }),
      });
      if (!res.ok) { toast.error("Silinemedi"); return; }
      toast.success("Hareket silindi");
      void loadHareketler(selectedCari.id);
    } catch { toast.error("Bağlantı hatası"); }
  }

  function openDetail(row: Cari) {
    setSelectedCari(row);
    setHareketTab("liste");
    setYeniHareket({ tip: "alacak", tutar: "", aciklama: "" });
    setShowDetailModal(true);
    void loadHareketler(row.id);
  }

  async function saveCari() {
    if (form.name.trim().length < 2) {
      toast.error("İsim/Ünvan zorunludur");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/cari/${editing.id}` : "/api/cari", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "İşlem başarısız");
        return;
      }
      toast.success(editing ? "Cari güncellendi" : "Cari oluşturuldu");
      setDialogOpen(false);
      await loadRows();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSaving(false);
    }
  }

  async function askDelete(row: Cari) {
    setDeleteRow(row);
    setDeleteLinkedCount(0);
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

  async function runCariDelete(
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
      const res = await fetch(`/api/cari/${deleteId}${suffix}`, {
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
    if (hasSettingsPassword !== false && !deletePassword.trim()) {
      setDeletePasswordError("Parola girin");
      return;
    }
    await runCariDelete(hasSettingsPassword === false ? "" : deletePassword);
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
      setSayfaYetkisiVar(!!perms.canViewCari);
    } catch {
      setSayfaYetkisiVar(false);
    }
  }, []);

  if (!sayfaYetkisiVar) return <YetkiYok />;

  return (
    <div className="space-y-6">
      <PageGuideModal
        pageKey="cari"
        icon="💰"
        title="Cari Yönetimi"
        description="Müşteri ve tedarikçilerle olan borç/alacak takibini yapın. Tüm finansal hareketler kayıt altında."
        tips={[
          "Her müşteri veya tedarikçi için cari hesap açın",
          "Fatura ve diğer işlemler için bilgilere hızlıca erişin",
          "Kargo Fişi özelliği ile kargolarınızı hızlıca hazırlayın",
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Cari Yönetimi</h1>
        {yetkiVar("canAddCari") && (
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-2 size-4" /> Yeni Cari Ekle
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full max-w-md space-y-1.5">
          <Label htmlFor="cari-search">Arama</Label>
          <Input
            id="cari-search"
            placeholder="İsim, telefon veya vergi no ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className="text-sm text-slate-600">Toplam {total} cari</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="px-3 py-2.5">Cari Kodu</th>
              <th className="px-3 py-2.5">İsim/Ünvan</th>
              <th className="px-3 py-2.5">Cep Telefonu</th>
              <th className="px-3 py-2.5">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-600" colSpan={4}>
                  Yükleniyor...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-600" colSpan={4}>
                  Cari bulunamadı
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {row.cariCode || "—"}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-slate-900">{row.name}</td>
                  <td className="px-3 py-2.5">{row.phone ? formatPhone(row.phone) : "—"}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                        onClick={() => openDetail(row)}
                      >
                        Detay
                      </Button>
                      {yetkiVar("canEditCari") && (
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row)}>
                          Düzenle
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-amber-200 text-amber-800 hover:bg-amber-50 hover:text-amber-900"
                        onClick={() => router.push(`/kargo-fisi/${row.id}`)}
                      >
                        Kargo Fişi
                      </Button>
                      {yetkiVar("canDeleteCari") && (
                        <Button type="button" variant="destructive" size="sm" onClick={() => void askDelete(row)}>
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
            <DialogTitle>{editing ? "Cari Düzenle" : "Yeni Cari Ekle"}</DialogTitle>
            <DialogDescription>Cari bilgilerini girin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>İsim/Ünvan</Label>
              <Input
                ref={nameRef}
                autoFocus
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                onKeyDown={(e) => handleEnterKey(e, phoneRef)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cep Telefonu</Label>
              <TrPhoneInput
                ref={phoneRef}
                value={form.phone ?? ""}
                onValueChange={(v) => setForm((p) => ({ ...p, phone: v }))}
                onKeyDown={(e) => handleEnterKey(e, emailRef)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>E-Posta</Label>
              <Input
                ref={emailRef}
                value={form.email ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                onKeyDown={(e) => handleEnterKey(e, addressRef)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Adres</Label>
              <Textarea
                ref={addressRef}
                value={form.address ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                onKeyDown={(e) => handleEnterKey(e, taxOfficeRef)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Vergi Dairesi</Label>
                <Input
                  ref={taxOfficeRef}
                  value={form.taxOffice ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, taxOffice: e.target.value }))}
                  onKeyDown={(e) => handleEnterKey(e, taxOrTcRef)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>TC Kimlik No / Vergi No</Label>
                <Input
                  ref={taxOrTcRef}
                  value={form.taxOrTcNo ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, taxOrTcNo: e.target.value }))}
                  onKeyDown={(e) => handleEnterKey(e, cargoInfoRef)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Anlaşmalı Kargo Bilgisi</Label>
                <Input
                  ref={cargoInfoRef}
                  value={form.cargoInfo ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, cargoInfo: e.target.value }))}
                  onKeyDown={(e) => handleEnterKey(e, cargoCodeRef)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kargo Anlaşma Kodu</Label>
                <Input
                  ref={cargoCodeRef}
                  value={form.cargoCode ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, cargoCode: e.target.value }))}
                  onKeyDown={(e) => handleEnterKey(e, saveRef)}
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
              onClick={() => void saveCari()}
            >
              {saving ? "Kaydediliyor..." : editing ? "Güncelle" : "Kaydet"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cari Detayı</DialogTitle>
            <DialogDescription>Cari bilgileri</DialogDescription>
          </DialogHeader>
          {selectedCari ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "12px" }}>
                <div style={{ fontSize: "18px", fontWeight: "600" }}>{selectedCari.name}</div>
                <div style={{ fontSize: "13px", color: "#666" }}>{selectedCari.cariCode}</div>
              </div>

              {[
                { label: "Cari Kodu", value: selectedCari.cariCode },
                { label: "İsim/Ünvan", value: selectedCari.name },
                { label: "Cep Telefonu", value: selectedCari.phone ? formatPhone(selectedCari.phone) : null },
                { label: "E-posta", value: selectedCari.email },
                { label: "Adres", value: selectedCari.address },
                { label: "Vergi Dairesi", value: selectedCari.taxOffice },
                { label: "TC/Vergi No", value: selectedCari.taxOrTcNo },
                { label: "Kargo Firması", value: selectedCari.cargoInfo },
                { label: "Kargo Kodu", value: selectedCari.cargoCode },
              ]
                .filter((item) => item.value)
                .map((item, i) => (
                  <div
                    key={`${item.label}-${i}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #f3f4f6",
                      fontSize: "14px",
                      gap: "12px",
                    }}
                  >
                    <span style={{ color: "#666", minWidth: "140px" }}>{item.label}</span>
                    <span style={{ fontWeight: "500", textAlign: "right" }}>{item.value}</span>
                  </div>
                ))}

              {/* Hareketler Bölümü */}
              <div style={{ marginTop: "20px", borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
                {hareketler.length > 0 && (() => {
                  const toplamAlacak = hareketler.filter(h => h.tip === "alacak").reduce((s, h) => s + h.tutar, 0);
                  const toplamVerecek = hareketler.filter(h => h.tip === "verecek").reduce((s, h) => s + h.tutar, 0);
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                      <div style={{ background: "#f0fdf4", borderRadius: "8px", padding: "10px 12px", border: "1px solid #bbf7d0" }}>
                        <p style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600, marginBottom: "2px" }}>TOPLAM ALACAK</p>
                        <p style={{ fontSize: "16px", fontWeight: 700, color: "#15803d" }}>₺{toplamAlacak.toLocaleString("tr-TR")}</p>
                      </div>
                      <div style={{ background: "#fef2f2", borderRadius: "8px", padding: "10px 12px", border: "1px solid #fecaca" }}>
                        <p style={{ fontSize: "11px", color: "#dc2626", fontWeight: 600, marginBottom: "2px" }}>TOPLAM VERECEK</p>
                        <p style={{ fontSize: "16px", fontWeight: 700, color: "#b91c1c" }}>₺{toplamVerecek.toLocaleString("tr-TR")}</p>
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <button type="button" onClick={() => setHareketTab("liste")}
                    style={{ padding: "6px 14px", borderRadius: "6px", border: "none", cursor: "pointer",
                      background: hareketTab === "liste" ? "#111827" : "#f3f4f6",
                      color: hareketTab === "liste" ? "white" : "#374151", fontSize: "13px", fontWeight: 600 }}>
                    Hareketler
                  </button>
                  <button type="button" onClick={() => setHareketTab("yeni")}
                    style={{ padding: "6px 14px", borderRadius: "6px", border: "none", cursor: "pointer",
                      background: hareketTab === "yeni" ? "#4f46e5" : "#f3f4f6",
                      color: hareketTab === "yeni" ? "white" : "#374151", fontSize: "13px", fontWeight: 600 }}>
                    + Yeni Hareket
                  </button>
                </div>

                {hareketTab === "liste" ? (
                  hareketLoading ? <p style={{ fontSize: "13px", color: "#6b7280" }}>Yükleniyor...</p> :
                  hareketler.length === 0 ? <p style={{ fontSize: "13px", color: "#9ca3af", textAlign: "center", padding: "16px 0" }}>Henüz hareket yok</p> :
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "280px", overflowY: "auto" }}>
                    {hareketler.map((h) => (
                      <div key={h.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 12px", borderRadius: "8px",
                        background: h.odendi ? "#f9fafb" : h.tip === "alacak" ? "#f0fdf4" : "#fef2f2",
                        border: `1px solid ${h.odendi ? "#e5e7eb" : h.tip === "alacak" ? "#bbf7d0" : "#fecaca"}`,
                        opacity: h.odendi ? 0.7 : 1,
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{
                              fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px",
                              background: h.tip === "alacak" ? "#dcfce7" : "#fee2e2",
                              color: h.tip === "alacak" ? "#16a34a" : "#dc2626",
                            }}>
                              {h.tip === "alacak" ? "ALACAK" : "VERECEK"}
                            </span>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>
                              ₺{h.tutar.toLocaleString("tr-TR")}
                            </span>
                            {h.odendi && <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>✓ Ödendi</span>}
                          </div>
                          {h.aciklama && <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{h.aciklama}</p>}
                          <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                            {new Date(h.createdAt).toLocaleDateString("tr-TR")}
                            {h.odemeTarihi && ` · Ödeme: ${new Date(h.odemeTarihi).toLocaleDateString("tr-TR")}`}
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                          {!h.odendi && (
                            <button type="button" onClick={() => void handleOdendi(h.id)}
                              style={{ padding: "4px 10px", borderRadius: "6px", border: "none", cursor: "pointer",
                                background: "#16a34a", color: "white", fontSize: "12px", fontWeight: 600 }}>
                              Ödendi
                            </button>
                          )}
                          <button type="button" onClick={() => void handleDeleteHareket(h.id)}
                            style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #fecaca",
                              cursor: "pointer", background: "white", color: "#dc2626", fontSize: "12px" }}>
                            Sil
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Tip</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {(["alacak", "verecek"] as const).map((t) => (
                          <button key={t} type="button" onClick={() => setYeniHareket(p => ({ ...p, tip: t }))}
                            style={{ padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
                              background: yeniHareket.tip === t ? (t === "alacak" ? "#16a34a" : "#dc2626") : "#f3f4f6",
                              color: yeniHareket.tip === t ? "white" : "#374151", fontSize: "13px", fontWeight: 600 }}>
                            {t === "alacak" ? "Alacak" : "Verecek"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Tutar (₺)</label>
                      <input type="text" inputMode="decimal" value={yeniHareket.tutar}
                        onChange={(e) => setYeniHareket(p => ({ ...p, tutar: e.target.value }))}
                        placeholder="0.00"
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Açıklama (opsiyonel)</label>
                      <input type="text" value={yeniHareket.aciklama}
                        onChange={(e) => setYeniHareket(p => ({ ...p, aciklama: e.target.value }))}
                        placeholder="Ödeme nedeni, fatura no vb."
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
                    </div>
                    <button type="button" onClick={() => void handleSaveHareket()} disabled={savingHareket}
                      style={{ padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer",
                        background: "#4f46e5", color: "white", fontSize: "14px", fontWeight: 600 }}>
                      {savingHareket ? "Kaydediliyor..." : "Hareketi Kaydet"}
                    </button>
                  </div>
                )}
              </div>

              {yetkiVar("canEditCari") && (
                <div style={{ marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailModal(false);
                      openEdit(selectedCari);
                    }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    background: "white",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Düzenle
                </button>
              </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteRow !== null} onOpenChange={(open) => !open && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu cariyi silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteLinkedCount > 0
                ? `Bu cariye bağlı ${deleteLinkedCount} servis kaydı var. Yine de silmek istiyor musunuz?`
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
                    await runCariDelete("", idToDelete, forceDelete);
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
