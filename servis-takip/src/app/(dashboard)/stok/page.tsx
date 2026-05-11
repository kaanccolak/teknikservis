"use client";

import { Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type IdName = { id: string; name: string };

type SparePartRow = {
  id: string;
  name: string;
  partCode: string | null;
  cost: number;
  stock: number;
  deviceTypeId: string | null;
  brandId: string | null;
  deviceModelId: string | null;
  deviceType: IdName | null;
  brand: IdName | null;
  deviceModel: IdName | null;
};

const nativeSelectClassName =
  "h-9 w-full min-w-[9rem] rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

function formatTry(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function stockClass(stock: number): string {
  if (stock <= 0) return "text-red-700 font-semibold tabular-nums";
  if (stock <= 3) return "text-orange-700 font-semibold tabular-nums";
  return "text-emerald-700 font-semibold tabular-nums";
}

function deviceChainLabel(p: SparePartRow): string {
  const parts = [
    p.deviceType?.name,
    p.brand?.name,
    p.deviceModel?.name,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Genel";
}

export default function StokPage() {
  const [deviceTypes, setDeviceTypes] = useState<IdName[]>([]);
  const [brands, setBrands] = useState<IdName[]>([]);
  const [models, setModels] = useState<IdName[]>([]);
  const [parts, setParts] = useState<SparePartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deviceTypeId, setDeviceTypeId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [deviceModelId, setDeviceModelId] = useState("");
  const [stockStatus, setStockStatus] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editPart, setEditPart] = useState<SparePartRow | null>(null);
  const [stockPart, setStockPart] = useState<SparePartRow | null>(null);
  const [deletePart, setDeletePart] = useState<SparePartRow | null>(null);

  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCost, setFormCost] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formDt, setFormDt] = useState("");
  const [formBr, setFormBr] = useState("");
  const [formMd, setFormMd] = useState("");
  const [formBrands, setFormBrands] = useState<IdName[]>([]);
  const [formModels, setFormModels] = useState<IdName[]>([]);
  const [savingForm, setSavingForm] = useState(false);

  const [stockQty, setStockQty] = useState("1");
  const [savingStock, setSavingStock] = useState(false);

  const [showDeletePasswordModal, setShowDeletePasswordModal] =
    useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");
  const [deletingWithPassword, setDeletingWithPassword] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadMeta = useCallback(async () => {
    setMetaError(null);
    try {
      const res = await fetch("/api/device-types");
      const data = await res.json();
      if (!res.ok) {
        setMetaError(
          typeof data === "object" && data && "error" in data
            ? String((data as { error: string }).error)
            : "Cihaz türleri alınamadı",
        );
        setDeviceTypes([]);
        return;
      }
      setDeviceTypes(data as IdName[]);
    } catch {
      setMetaError("Cihaz türleri alınamadı");
      setDeviceTypes([]);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (!deviceTypeId) {
      setBrands([]);
      setModels([]);
      setBrandId("");
      setDeviceModelId("");
      return;
    }
    setBrandId("");
    setDeviceModelId("");
    setBrands([]);
    setModels([]);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/brands?deviceTypeId=${encodeURIComponent(deviceTypeId)}`,
        );
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) toast.error(data.error ?? "Markalar yüklenemedi");
          return;
        }
        if (!cancelled) setBrands(data);
      } catch {
        if (!cancelled) toast.error("Markalar yüklenemedi");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deviceTypeId]);

  useEffect(() => {
    if (!brandId) {
      setModels([]);
      setDeviceModelId("");
      return;
    }
    setDeviceModelId("");
    setModels([]);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/models?brandId=${encodeURIComponent(brandId)}`);
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) toast.error(data.error ?? "Modeller yüklenemedi");
          return;
        }
        if (!cancelled) setModels(data);
      } catch {
        if (!cancelled) toast.error("Modeller yüklenemedi");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  useEffect(() => {
    if (!formDt) {
      setFormBrands([]);
      setFormModels([]);
      setFormBr("");
      setFormMd("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/brands?deviceTypeId=${encodeURIComponent(formDt)}`,
        );
        const data = await res.json();
        if (!cancelled && res.ok) setFormBrands(data as IdName[]);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formDt]);

  useEffect(() => {
    if (!formBr) {
      setFormModels([]);
      setFormMd("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/models?brandId=${encodeURIComponent(formBr)}`);
        const data = await res.json();
        if (!cancelled && res.ok) setFormModels(data as IdName[]);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formBr]);

  const loadParts = useCallback(async () => {
    setListError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (deviceTypeId) params.set("deviceTypeId", deviceTypeId);
      if (brandId) params.set("brandId", brandId);
      if (deviceModelId) params.set("deviceModelId", deviceModelId);
      if (stockStatus !== "all") params.set("stockStatus", stockStatus);
      const res = await fetch(`/api/spare-parts?${params.toString()}`);
      const data = (await res.json()) as SparePartRow[] | { error?: string };
      if (!res.ok) {
        setListError(
          typeof data === "object" && data && "error" in data
            ? String((data as { error: string }).error)
            : "Liste yüklenemedi",
        );
        setParts([]);
        return;
      }
      setParts(data as SparePartRow[]);
    } catch {
      setListError("Bağlantı hatası");
      setParts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, deviceTypeId, brandId, deviceModelId, stockStatus]);

  useEffect(() => {
    void loadParts();
  }, [loadParts]);

  function openCreate() {
    setFormName("");
    setFormCode("");
    setFormCost("0");
    setFormStock("0");
    setFormDt("");
    setFormBr("");
    setFormMd("");
    setFormBrands([]);
    setFormModels([]);
    setEditPart(null);
    setCreateOpen(true);
  }

  function openEdit(p: SparePartRow) {
    setEditPart(p);
    setFormName(p.name);
    setFormCode(p.partCode ?? "");
    setFormCost(String(p.cost));
    setFormStock(String(p.stock));
    setFormDt(p.deviceTypeId ?? "");
    setFormBr(p.brandId ?? "");
    setFormMd(p.deviceModelId ?? "");
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
    setEditPart(null);
  }

  async function submitForm() {
    const name = formName.trim();
    if (!name) {
      toast.error("Parça adı gerekli");
      return;
    }
    const cost = Number(formCost.replace(",", "."));
    const stock = Number(formStock);
    if (!Number.isFinite(cost) || cost < 0) {
      toast.error("Geçerli maliyet girin");
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      toast.error("Geçerli stok girin");
      return;
    }
    setSavingForm(true);
    try {
      const body = editPart
        ? {
            name,
            partCode: formCode.trim() || null,
            cost,
            stock,
            deviceTypeId: formDt || null,
            brandId: formBr || null,
            deviceModelId: formMd || null,
          }
        : {
            name,
            partCode: formCode.trim() || undefined,
            cost,
            stock,
            deviceTypeId: formDt || undefined,
            brandId: formBr || undefined,
            deviceModelId: formMd || undefined,
          };
      const url = editPart
        ? `/api/spare-parts/${encodeURIComponent(editPart.id)}`
        : "/api/spare-parts";
      const res = await fetch(url, {
        method: editPart ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(j.error ?? "Kayıt başarısız");
        return;
      }
      toast.success(editPart ? "Parça güncellendi" : "Parça eklendi");
      closeCreate();
      void loadParts();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSavingForm(false);
    }
  }

  async function submitStockAdd() {
    if (!stockPart) return;
    const q = Number(stockQty);
    if (!Number.isInteger(q) || q < 1) {
      toast.error("En az 1 adet girin");
      return;
    }
    setSavingStock(true);
    try {
      const res = await fetch(
        `/api/spare-parts/${encodeURIComponent(stockPart.id)}/stock`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: q, type: "add" }),
        },
      );
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(j.error ?? "Stok güncellenemedi");
        return;
      }
      toast.success("Stok güncellendi");
      setStockPart(null);
      setStockQty("1");
      void loadParts();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSavingStock(false);
    }
  }

  async function confirmDeleteWithPassword() {
    if (!deletePassword.trim()) {
      setDeletePasswordError("Parola girin");
      return;
    }
    if (!pendingDeleteId) return;
    setDeletingWithPassword(true);
    setDeletePasswordError("");
    try {
      const res = await fetch(
        `/api/spare-parts/${encodeURIComponent(pendingDeleteId)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settingsPassword: deletePassword }),
        },
      );
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
      toast.success("Silindi");
      void loadParts();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setDeletingWithPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Yedek Parça Stok Yönetimi
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Parça tanımları, stok ve cihaz uyumluluğunu buradan yönetin.
          </p>
        </div>
        <Button type="button" onClick={openCreate} className="shrink-0 gap-2">
          <Package className="size-4" aria-hidden />
          Yeni Parça Ekle
        </Button>
      </div>

      {metaError ? (
        <p className="text-sm text-amber-800" role="status">
          {metaError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">
        <div className="min-w-0 flex-1 space-y-1.5 xl:min-w-[200px]">
          <Label htmlFor="stok-search" className="sr-only">
            Arama
          </Label>
          <Input
            id="stok-search"
            type="search"
            placeholder="Parça adı veya ürün kodu ara..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:flex xl:flex-1 xl:flex-wrap xl:items-end xl:gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Cihaz türü</Label>
            <select
              value={deviceTypeId}
              onChange={(e) => {
                setDeviceTypeId(e.target.value);
                setBrandId("");
                setDeviceModelId("");
              }}
              className={nativeSelectClassName}
            >
              <option value="">Hepsi</option>
              {deviceTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Marka</Label>
            <select
              value={brandId}
              onChange={(e) => {
                setBrandId(e.target.value);
                setDeviceModelId("");
              }}
              disabled={!deviceTypeId || brands.length === 0}
              className={nativeSelectClassName}
            >
              <option value="">
                {!deviceTypeId ? "Önce tür seçin" : "Hepsi"}
              </option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Model</Label>
            <select
              value={deviceModelId}
              onChange={(e) => setDeviceModelId(e.target.value)}
              disabled={!brandId || models.length === 0}
              className={nativeSelectClassName}
            >
              <option value="">
                {!brandId ? "Önce marka seçin" : "Hepsi"}
              </option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Stok durumu</Label>
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              className={nativeSelectClassName}
            >
              <option value="all">Hepsi</option>
              <option value="in_stock">Stokta Var (4+)</option>
              <option value="critical">Stok Kritik (1–3)</option>
              <option value="empty">Stok Yok (0)</option>
            </select>
          </div>
        </div>
      </div>

      {listError ? (
        <p className="text-sm text-destructive" role="alert">
          {listError}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-600">
            <Loader2 className="size-6 animate-spin" aria-hidden />
            Yükleniyor…
          </div>
        ) : parts.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-600">Parça bulunamadı</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="px-3 py-3 font-medium text-slate-700">Parça Adı</th>
                  <th className="px-3 py-3 font-medium text-slate-700">Ürün Kodu</th>
                  <th className="px-3 py-3 font-medium text-slate-700">
                    Cihaz Türü / Marka / Model
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Maliyet
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    Stok
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p, i) => (
                  <tr
                    key={p.id}
                    className={cn(
                      "border-b border-slate-100",
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/50",
                    )}
                  >
                    <td className="px-3 py-2.5 font-medium text-slate-900">{p.name}</td>
                    <td className="px-3 py-2.5 text-slate-700">{p.partCode ?? "—"}</td>
                    <td className="max-w-[240px] truncate px-3 py-2.5 text-slate-700">
                      {deviceChainLabel(p)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-800">
                      {formatTry(p.cost)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className={stockClass(p.stock)}>{p.stock}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 px-2"
                          onClick={() => {
                            setStockPart(p);
                            setStockQty("1");
                          }}
                        >
                          <Plus className="size-3.5" aria-hidden />
                          Stok
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 px-2"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="size-3.5" aria-hidden />
                          Düzenle
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 px-2 text-destructive hover:text-destructive"
                          onClick={() => setDeletePart(p)}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                          Sil
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) closeCreate();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPart ? "Parça Düzenle" : "Yeni Parça Ekle"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="fp-name">Parça adı *</Label>
              <Input
                id="fp-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="fp-code">Ürün kodu</Label>
              <Input
                id="fp-code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fp-cost">Maliyet (₺)</Label>
              <Input
                id="fp-cost"
                type="number"
                min={0}
                step="0.01"
                value={formCost}
                onChange={(e) => setFormCost(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fp-stock">
                {editPart ? "Stok" : "Başlangıç stok"}
              </Label>
              <Input
                id="fp-stock"
                type="number"
                min={0}
                step={1}
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Cihaz türü (opsiyonel)</Label>
              <select
                value={formDt}
                onChange={(e) => {
                  setFormDt(e.target.value);
                  setFormBr("");
                  setFormMd("");
                }}
                className={nativeSelectClassName}
              >
                <option value="">Genel (tüm cihazlar)</option>
                {deviceTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Marka (opsiyonel)</Label>
              <select
                value={formBr}
                onChange={(e) => {
                  setFormBr(e.target.value);
                  setFormMd("");
                }}
                disabled={!formDt || formBrands.length === 0}
                className={nativeSelectClassName}
              >
                <option value="">—</option>
                {formBrands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Model (opsiyonel)</Label>
              <select
                value={formMd}
                onChange={(e) => setFormMd(e.target.value)}
                disabled={!formBr || formModels.length === 0}
                className={nativeSelectClassName}
              >
                <option value="">—</option>
                {formModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose type="button">İptal</DialogClose>
            <Button type="button" onClick={() => void submitForm()} disabled={savingForm}>
              {savingForm ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!stockPart}
        onOpenChange={(o) => {
          if (!o) {
            setStockPart(null);
            setStockQty("1");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stok Ekle</DialogTitle>
          </DialogHeader>
          {stockPart ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-700">
                <span className="font-medium">{stockPart.name}</span>
              </p>
              <p className="text-sm text-slate-600">
                Mevcut stok:{" "}
                <span className={cn("font-semibold", stockClass(stockPart.stock))}>
                  {stockPart.stock}
                </span>
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="add-qty">Eklenecek miktar</Label>
                <Input
                  id="add-qty"
                  type="number"
                  min={1}
                  step={1}
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <DialogClose type="button">İptal</DialogClose>
            <Button
              type="button"
              onClick={() => void submitStockAdd()}
              disabled={savingStock || !stockPart}
            >
              {savingStock ? "Ekleniyor…" : "Stok Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePart} onOpenChange={(o) => !o && setDeletePart(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Parçayı silmek istiyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletePart
                ? `"${deletePart.name}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="secondary">İptal</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                if (!deletePart) return;
                setPendingDeleteId(deletePart.id);
                setDeletePart(null);
                setShowDeletePasswordModal(true);
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
