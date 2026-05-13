"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
import { cn } from "@/lib/utils";

type ExternalRow = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  totalSentCount: number;
  currentlyThereCount: number;
  totalPaid?: number;
};

type ExternalForm = {
  name: string;
  contactName: string;
  address: string;
  notes: string;
};

const emptyForm: ExternalForm = {
  name: "",
  contactName: "",
  address: "",
  notes: "",
};

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6)
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 8)
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
}

/** Kayıttan modal gösterimine: +90 veya ham rakamlar → 10 hane ulusal format */
function phoneToDisplayField(stored: string | null | undefined): string {
  if (!stored?.trim()) return "";
  const t = stored.trim();
  const withoutPrefix = t.startsWith("+90") ? t.replace(/^\+90\s*/, "") : t;
  const digits = withoutPrefix.replace(/\D/g, "");
  const national =
    digits.startsWith("90") && digits.length >= 11
      ? digits.slice(2, 12)
      : digits.length > 10
        ? digits.slice(-10)
        : digits;
  return formatPhone(national.slice(0, 10));
}

function DisServisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duzenleId = searchParams.get("duzenle");
  const handledDuzenleRef = useRef<string | null>(null);

  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<ExternalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExternalRow | null>(null);
  const [form, setForm] = useState<ExternalForm>(emptyForm);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteState, setDeleteState] = useState<{
    row: ExternalRow;
    phase: "confirm" | "blocked";
    linkedCount?: number;
  } | null>(null);
  const [showDeletePasswordModal, setShowDeletePasswordModal] =
    useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");
  const [deletingWithPassword, setDeletingWithPassword] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [hasSettingsPassword, setHasSettingsPassword] = useState<
    boolean | null
  >(null);
  const deleteRowPendingRef = useRef<ExternalRow | null>(null);

  const total = useMemo(() => rows.length, [rows.length]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = search.trim()
        ? `?search=${encodeURIComponent(search.trim())}`
        : "";
      const res = await fetch(`/api/external-services${qs}`, { cache: "no-store" });
      const data = (await res.json()) as ExternalRow[] | { error?: string };
      if (!res.ok) {
        setError(
          (data as { error?: string }).error ?? "Dış servisler yüklenemedi",
        );
        setRows([]);
        return;
      }
      setRows(data as ExternalRow[]);
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

  useEffect(() => {
    handledDuzenleRef.current = null;
  }, [duzenleId]);

  useEffect(() => {
    if (!duzenleId?.trim() || loading || rows.length === 0) return;
    if (handledDuzenleRef.current === duzenleId) return;
    const row = rows.find((r) => r.id === duzenleId);
    if (!row) return;
    handledDuzenleRef.current = duzenleId;
    setEditing(row);
    setForm({
      name: row.name,
      contactName: row.contactName ?? "",
      address: row.address ?? "",
      notes: row.notes ?? "",
    });
    setPhone(phoneToDisplayField(row.phone));
    setDialogOpen(true);
    router.replace("/dis-servis", { scroll: false });
  }, [duzenleId, loading, rows, router]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setPhone("");
    setDialogOpen(true);
  }

  function openEdit(row: ExternalRow) {
    setEditing(row);
    setForm({
      name: row.name,
      contactName: row.contactName ?? "",
      address: row.address ?? "",
      notes: row.notes ?? "",
    });
    setPhone(phoneToDisplayField(row.phone));
    setDialogOpen(true);
  }

  async function saveExternal() {
    if (form.name.trim().length < 2) {
      toast.error("Servis adı zorunludur (en az 2 karakter)");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (phone.trim() && digits.length !== 10) {
      toast.error("Geçerli bir telefon numarası girin (10 hane)");
      return;
    }
    const phoneToSave = phone.trim() ? `+90 ${phone.trim()}` : null;
    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/external-services/${editing.id}` : "/api/external-services",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            contactName: form.contactName.trim() || null,
            phone: phoneToSave,
            address: form.address.trim() || null,
            notes: form.notes.trim() || null,
          }),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "İşlem başarısız");
        return;
      }
      toast.success(editing ? "Dış servis güncellendi" : "Dış servis eklendi");
      setDialogOpen(false);
      await loadRows();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSaving(false);
    }
  }

  function askDelete(row: ExternalRow) {
    setDeleteState({ row, phase: "confirm" });
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

  async function runExternalDelete(settingsPassword: string, id?: string) {
    const deleteId = id ?? pendingDeleteId;
    if (!deleteId) return;
    setDeletingWithPassword(true);
    setDeletePasswordError("");
    try {
      const res = await fetch(`/api/external-services/${deleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settingsPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        linkedCount?: number;
      };
      if (!res.ok) {
        if (res.status === 403) {
          setDeletePasswordError(data.error ?? "Parola yanlış");
          return;
        }
        const n = data.linkedCount ?? 0;
        if (n > 0 && deleteRowPendingRef.current) {
          setDeleteState({
            row: deleteRowPendingRef.current,
            phase: "blocked",
            linkedCount: n,
          });
          deleteRowPendingRef.current = null;
          setShowDeletePasswordModal(false);
          setDeletePassword("");
          setPendingDeleteId(null);
          return;
        }
        toast.error(data.error ?? "Silinemedi");
        return;
      }
      setShowDeletePasswordModal(false);
      setDeletePassword("");
      setPendingDeleteId(null);
      deleteRowPendingRef.current = null;
      setDeleteState(null);
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
    await runExternalDelete(
      hasSettingsPassword === false ? "" : deletePassword,
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Dış Servisler</h1>
        <Button type="button" onClick={openCreate}>
          <Plus className="mr-2 size-4" aria-hidden />
          Yeni Dış Servis Ekle
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full max-w-md space-y-1.5">
          <Label htmlFor="ext-search">Arama</Label>
          <Input
            id="ext-search"
            placeholder="Servis adı, yetkili, telefon…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className="text-sm text-slate-600">Toplam {total} kayıt</p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="px-3 py-2.5">Servis Adı</th>
              <th className="px-3 py-2.5">Yetkili Kişi</th>
              <th className="px-3 py-2.5">Telefon</th>
              <th className="px-3 py-2.5">Adres</th>
              <th className="px-3 py-2.5 text-center whitespace-nowrap">
                Serviste Bulunan Cihaz
              </th>
              <th className="px-3 py-2.5 text-center whitespace-nowrap">
                Toplam Gönderilen
              </th>
              <th className="px-3 py-2.5 text-center whitespace-nowrap">
                Toplam Ödeme
              </th>
              <th className="px-3 py-2.5">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-600" colSpan={8}>
                  Yükleniyor…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-600" colSpan={8}>
                  Kayıt bulunamadı
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2.5 font-medium text-slate-900">
                    {row.name}
                  </td>
                  <td className="max-w-[140px] truncate px-3 py-2.5">
                    {row.contactName ?? "—"}
                  </td>
                  <td className="px-3 py-2.5">{row.phone ?? "—"}</td>
                  <td className="max-w-[220px] truncate px-3 py-2.5 text-slate-700">
                    {row.address ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums">
                    {row.currentlyThereCount ?? 0}
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums">
                    {row.totalSentCount ?? 0}
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums">
                    {(row.totalPaid ?? 0).toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/dis-servis/${row.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                        )}
                      >
                        Detay
                      </Link>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(row)}
                      >
                        Düzenle
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => askDelete(row)}
                      >
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

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setPhone("");
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Dış Servisi Düzenle" : "Yeni Dış Servis"}
            </DialogTitle>
            <DialogDescription>
              Dış servis firma bilgilerini girin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ext-name">
                Servis adı <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ext-name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ext-contact">Yetkili kişi</Label>
              <Input
                id="ext-contact"
                value={form.contactName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contactName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ext-phone">Telefon</Label>
              <div
                style={{
                  display: "flex",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    padding: "8px 12px",
                    background: "#f9fafb",
                    borderRight: "1px solid #e5e7eb",
                    color: "#6b7280",
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                  }}
                >
                  +90
                </span>
                <input
                  id="ext-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, "");
                    if (d.length > 10) return;
                    setPhone(formatPhone(e.target.value));
                  }}
                  placeholder="5XX XXX XX XX"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                  }}
                  maxLength={13}
                  autoComplete="tel-national"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ext-address">Adres</Label>
              <Textarea
                id="ext-address"
                rows={3}
                value={form.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ext-notes">Notlar</Label>
              <Textarea
                id="ext-notes"
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              İptal
            </Button>
            <Button type="button" onClick={() => void saveExternal()} disabled={saving}>
              {saving ? "Kaydediliyor…" : editing ? "Güncelle" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteState !== null}
        onOpenChange={(open) => !open && setDeleteState(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteState?.phase === "blocked"
                ? "Silinemez"
                : "Dış servisi silmek istiyor musunuz?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteState?.phase === "blocked"
                ? `Bu dış servise bağlı ${deleteState.linkedCount ?? 0} servis kaydı var. Önce ilgili kayıtların durumunu veya dış servis atamasını güncelleyin.`
                : "Bu işlem geri alınamaz."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {deleteState?.phase === "blocked" ? (
              <AlertDialogCancel type="button" className="sm:mt-0">
                Tamam
              </AlertDialogCancel>
            ) : (
              <>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction
                  type="button"
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    void (async () => {
                      if (!deleteState || deleteState.phase !== "confirm")
                        return;
                      deleteRowPendingRef.current = deleteState.row;
                      const idToDelete = deleteState.row.id;
                      setDeleteState(null);
                      let hp = hasSettingsPassword;
                      if (hp === null) {
                        hp = await ensureHasSettingsPassword();
                      }
                      if (!hp) {
                        await runExternalDelete("", idToDelete);
                        return;
                      }
                      setPendingDeleteId(idToDelete);
                      setShowDeletePasswordModal(true);
                    })();
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
                  deleteRowPendingRef.current = null;
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

export default function DisServisPage() {
  return (
    <>
      <PageGuideModal
        pageKey="dis_servis"
        icon="🔧"
        title="Dış Servisler"
        description="Çözemediğiniz cihazları dış servise gönderdiğinizde buradan takip edin."
        tips={[
          "Dış servise gönderilen cihazın durumunu güncelleyin",
          "Dış servis maliyetini kaydedin",
          "Cihaz geri geldiğinde durumu güncelleyerek süreç tamamlanır",
        ]}
      />
      <Suspense fallback={<div>Yükleniyor...</div>}>
        <DisServisContent />
      </Suspense>
    </>
  );
}
