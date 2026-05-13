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
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Cari[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCari, setSelectedCari] = useState<Cari | null>(null);
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

  function openDetail(row: Cari) {
    setSelectedCari(row);
    setShowDetailModal(true);
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

  return (
    <div className="space-y-6">
      <PageGuideModal
        pageKey="cari"
        icon="💰"
        title="Cari Yönetimi"
        description="Müşteri ve tedarikçilerle olan borç/alacak takibini buradan yapın."
        tips={[
          "Her müşteri veya tedarikçi için cari hesap açın",
          "Ödeme ve tahsilat işlemlerini kaydedin",
          "Bakiye durumunu anlık görün",
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Cari Yönetimi</h1>
        <Button type="button" onClick={openCreate}>
          <Plus className="mr-2 size-4" /> Yeni Cari Ekle
        </Button>
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
        <table className="w-full min-w-[820px] text-left text-sm">
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
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                        onClick={() => openDetail(row)}
                      >
                        Detay
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row)}>
                        Düzenle
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => void askDelete(row)}>
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
        <DialogContent className="sm:max-w-lg">
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

              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailModal(false);
                    openEdit(selectedCari);
                  }}
                  style={{
                    flex: 1,
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
                <button
                  type="button"
                  onClick={() => window.open(`/kargo-fisi/${selectedCari.id}`, "_blank")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    background: "white",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Kargo Fişi
                </button>
              </div>
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
