"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
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

type CariRow = {
  id: string;
  cariCode: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxOrTcNo: string | null;
  taxOffice: string | null;
  cargoInfo: string | null;
  cargoCode: string | null;
};

type CariForm = Omit<CariRow, "id">;

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
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<CariRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CariRow | null>(null);
  const [form, setForm] = useState<CariForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteRow, setDeleteRow] = useState<CariRow | null>(null);
  const [deleteLinkedCount, setDeleteLinkedCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const total = useMemo(() => rows.length, [rows.length]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const res = await fetch(`/api/cari${qs}`);
      const data = (await res.json()) as CariRow[] | { error?: string };
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Cariler yüklenemedi");
        setRows([]);
        return;
      }
      setRows(data as CariRow[]);
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

  function openEdit(row: CariRow) {
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

  async function askDelete(row: CariRow) {
    setDeleteRow(row);
    setDeleteLinkedCount(0);
  }

  async function confirmDelete(force: boolean) {
    if (!deleteRow) return;
    setDeleting(true);
    try {
      const suffix = force ? "?force=true" : "";
      const res = await fetch(`/api/cari/${deleteRow.id}${suffix}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string; linkedCount?: number };
      if (!res.ok) {
        if ((data.linkedCount ?? 0) > 0 && !force) {
          setDeleteLinkedCount(data.linkedCount ?? 0);
          return;
        }
        toast.error(data.error ?? "Silme başarısız");
        return;
      }
      toast.success("Cari silindi");
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
        <table className="w-full min-w-[1350px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="px-3 py-2.5">Cari Kodu</th>
              <th className="px-3 py-2.5">İsim/Ünvan</th>
              <th className="px-3 py-2.5">Cep Telefonu</th>
              <th className="px-3 py-2.5">E-Posta</th>
              <th className="px-3 py-2.5">Vergi/TC No</th>
              <th className="px-3 py-2.5">Vergi Dairesi</th>
              <th className="px-3 py-2.5">Kargo Bilgisi</th>
              <th className="px-3 py-2.5">Kargo Anlaşma Kodu</th>
              <th className="px-3 py-2.5">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-600" colSpan={9}>
                  Yükleniyor...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-600" colSpan={9}>
                  Cari bulunamadı
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2.5 font-mono text-xs">{row.cariCode ?? "—"}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-900">{row.name}</td>
                  <td className="px-3 py-2.5">{row.phone ?? "—"}</td>
                  <td className="px-3 py-2.5">{row.email ?? "—"}</td>
                  <td className="px-3 py-2.5">{row.taxOrTcNo ?? "—"}</td>
                  <td className="px-3 py-2.5">{row.taxOffice ?? "—"}</td>
                  <td className="px-3 py-2.5">{row.cargoInfo ?? "—"}</td>
                  <td className="px-3 py-2.5">{row.cargoCode ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/kargo-fisi/${row.id}`)}
                      >
                        Kargo Fişi
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
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Cep Telefonu</Label>
              <TrPhoneInput value={form.phone ?? ""} onValueChange={(v) => setForm((p) => ({ ...p, phone: v }))} />
            </div>
            <div className="space-y-1.5">
              <Label>E-Posta</Label>
              <Input value={form.email ?? ""} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Adres</Label>
              <Textarea value={form.address ?? ""} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>TC Kimlik No / Vergi No</Label>
                <Input value={form.taxOrTcNo ?? ""} onChange={(e) => setForm((p) => ({ ...p, taxOrTcNo: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Vergi Dairesi</Label>
                <Input value={form.taxOffice ?? ""} onChange={(e) => setForm((p) => ({ ...p, taxOffice: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Anlaşmalı Kargo Bilgisi</Label>
                <Input value={form.cargoInfo ?? ""} onChange={(e) => setForm((p) => ({ ...p, cargoInfo: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Kargo Anlaşma Kodu</Label>
                <Input value={form.cargoCode ?? ""} onChange={(e) => setForm((p) => ({ ...p, cargoCode: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              İptal
            </Button>
            <Button type="button" onClick={() => void saveCari()} disabled={saving}>
              {saving ? "Kaydediliyor..." : editing ? "Güncelle" : "Kaydet"}
            </Button>
          </DialogFooter>
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
