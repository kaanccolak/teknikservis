"use client";

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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type IdName = { id: string; name: string };

const nativeSelectClassName =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60";

type ApiErrJson = { error?: string; details?: unknown; code?: string };

function toastFromApi(data: ApiErrJson, fallback: string) {
  const detailStr =
    typeof data.details === "string"
      ? data.details
      : data.details != null
        ? JSON.stringify(data.details)
        : "";
  const parts = [data.error, detailStr].filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );
  const message = parts.join(" — ") || fallback;
  toast.error(message, { duration: 6000 });
}

function DeleteConfirmDialog({
  onConfirm,
  triggerClassName,
}: {
  onConfirm: () => void | Promise<void>;
  triggerClassName?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        type="button"
        className={cn(
          "text-red-500 hover:text-red-700 inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-base leading-none transition-colors hover:border-red-200 hover:bg-red-50",
          triggerClassName,
        )}
        aria-label="Sil"
      >
        <span aria-hidden>🗑</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
          <AlertDialogDescription>
            Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri
            alınamaz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={() => void onConfirm()}
          >
            Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type TabId = "types" | "brands" | "models" | "print";

export default function TanimlarPage() {
  const [activeTab, setActiveTab] = useState<TabId>("types");

  const tabBtn = (id: TabId, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        activeTab === id
          ? "border-slate-900 text-slate-900"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Tanımlar</h1>
        <p className="mt-1 text-sm text-slate-600">
          Cihaz türü, marka ve model listelerini yönetin.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
        {tabBtn("types", "Cihaz türleri")}
        {tabBtn("brands", "Markalar")}
        {tabBtn("models", "Modeller")}
        {tabBtn("print", "Yazdırma Ayarları")}
      </div>

      {activeTab === "types" ? <DeviceTypesTab /> : null}
      {activeTab === "brands" ? <BrandsTab /> : null}
      {activeTab === "models" ? <ModelsTab /> : null}
      {activeTab === "print" ? <PrintSettingsTab /> : null}
    </div>
  );
}

function DeviceTypesTab() {
  const [items, setItems] = useState<IdName[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/device-types");
      const data = await res.json();
      if (!res.ok) {
        toastFromApi(data, "Liste yüklenemedi");
        return;
      }
      setItems(data);
    } catch {
      toast.error("Liste yüklenemedi");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add() {
    const t = name.trim();
    if (!t) {
      toast.error("İsim girin");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/device-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: t }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastFromApi(data, "Eklenemedi");
        return;
      }
      toast.success("Cihaz türü eklendi");
      setName("");
      setItems((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, "tr")));
    } catch {
      toast.error("Eklenemedi");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(
        `/api/device-types/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      let data: ApiErrJson = {};
      try {
        data = (await res.json()) as ApiErrJson;
      } catch {
        /* empty */
      }
      if (!res.ok) {
        toastFromApi(data, "Silinemedi");
        return;
      }
      toast.success("Kayıt silindi");
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {
      toast.error("Silinemedi");
    }
  }

  return (
    <Card className="border-slate-200/80 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Cihaz türleri</CardTitle>
        <CardDescription>Tüm cihaz türleri listelenir.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="new-device-type">Yeni cihaz türü ekle</Label>
            <Input
              id="new-device-type"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn. Cep telefonu"
            />
          </div>
          <Button type="button" onClick={() => void add()} disabled={loading}>
            Ekle
          </Button>
        </div>
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200/80">
          {items.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-slate-500">
              Henüz kayıt yok.
            </li>
          ) : (
            items.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-2 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-900">
                  {row.name}
                </span>
                <DeleteConfirmDialog onConfirm={() => remove(row.id)} />
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function BrandsTab() {
  const [deviceTypes, setDeviceTypes] = useState<IdName[]>([]);
  const [deviceTypeId, setDeviceTypeId] = useState("");
  const [items, setItems] = useState<IdName[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/device-types");
      const data = await res.json();
      if (res.ok) setDeviceTypes(data);
    } catch {
      toast.error("Cihaz türleri yüklenemedi");
    }
  }, []);

  const loadBrands = useCallback(async (dtId: string) => {
    try {
      const res = await fetch(
        `/api/brands?deviceTypeId=${encodeURIComponent(dtId)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        toastFromApi(data, "Markalar yüklenemedi");
        return;
      }
      setItems(data);
    } catch {
      toast.error("Markalar yüklenemedi");
    }
  }, []);

  useEffect(() => {
    void loadTypes();
  }, [loadTypes]);

  useEffect(() => {
    if (!deviceTypeId) {
      setItems([]);
      return;
    }
    void loadBrands(deviceTypeId);
  }, [deviceTypeId, loadBrands]);

  async function add() {
    const t = name.trim();
    if (!deviceTypeId) {
      toast.error("Önce cihaz türü seçin");
      return;
    }
    if (!t) {
      toast.error("Marka adı girin");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: t, deviceTypeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastFromApi(data, "Eklenemedi");
        return;
      }
      toast.success("Marka eklendi");
      setName("");
      setItems((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, "tr")));
    } catch {
      toast.error("Eklenemedi");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/brands/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      let data: ApiErrJson = {};
      try {
        data = (await res.json()) as ApiErrJson;
      } catch {
        /* empty */
      }
      if (!res.ok) {
        toastFromApi(data, "Silinemedi");
        return;
      }
      toast.success("Kayıt silindi");
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {
      toast.error("Silinemedi");
    }
  }

  return (
    <Card className="border-slate-200/80 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Markalar</CardTitle>
        <CardDescription>
          Önce cihaz türü seçin, ardından marka ekleyin veya silin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="brands-device-type">Cihaz türü</Label>
          <select
            id="brands-device-type"
            value={deviceTypeId}
            onChange={(e) => setDeviceTypeId(e.target.value)}
            className={`${nativeSelectClassName} max-w-md`}
          >
            <option value="">Cihaz türü seçin</option>
            {deviceTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="new-brand">Yeni marka ekle</Label>
            <Input
              id="new-brand"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Marka adı"
              disabled={!deviceTypeId}
            />
          </div>
          <Button
            type="button"
            onClick={() => void add()}
            disabled={loading || !deviceTypeId}
          >
            Ekle
          </Button>
        </div>
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200/80">
          {!deviceTypeId ? (
            <li className="px-4 py-6 text-center text-sm text-slate-500">
              Cihaz türü seçin.
            </li>
          ) : items.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-slate-500">
              Bu tür için marka yok.
            </li>
          ) : (
            items.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-2 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-900">
                  {row.name}
                </span>
                <DeleteConfirmDialog onConfirm={() => remove(row.id)} />
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function ModelsTab() {
  const [deviceTypes, setDeviceTypes] = useState<IdName[]>([]);
  const [brands, setBrands] = useState<IdName[]>([]);
  const [deviceTypeId, setDeviceTypeId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [items, setItems] = useState<IdName[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/device-types");
      const data = await res.json();
      if (res.ok) setDeviceTypes(data);
    } catch {
      toast.error("Cihaz türleri yüklenemedi");
    }
  }, []);

  const loadBrands = useCallback(async (dtId: string) => {
    try {
      const res = await fetch(
        `/api/brands?deviceTypeId=${encodeURIComponent(dtId)}`,
      );
      const data = await res.json();
      if (res.ok) setBrands(data);
      else setBrands([]);
    } catch {
      setBrands([]);
    }
  }, []);

  const loadModels = useCallback(async (bId: string) => {
    try {
      const res = await fetch(`/api/models?brandId=${encodeURIComponent(bId)}`);
      const data = await res.json();
      if (!res.ok) {
        toastFromApi(data, "Modeller yüklenemedi");
        return;
      }
      setItems(data);
    } catch {
      toast.error("Modeller yüklenemedi");
    }
  }, []);

  useEffect(() => {
    void loadTypes();
  }, [loadTypes]);

  useEffect(() => {
    setBrandId("");
    setBrands([]);
    setItems([]);
    if (!deviceTypeId) return;
    void loadBrands(deviceTypeId);
  }, [deviceTypeId, loadBrands]);

  useEffect(() => {
    setItems([]);
    if (!brandId) return;
    void loadModels(brandId);
  }, [brandId, loadModels]);

  async function add() {
    const t = name.trim();
    if (!brandId) {
      toast.error("Önce marka seçin");
      return;
    }
    if (!t) {
      toast.error("Model adı girin");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: t, brandId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastFromApi(data, "Eklenemedi");
        return;
      }
      toast.success("Model eklendi");
      setName("");
      setItems((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, "tr")));
    } catch {
      toast.error("Eklenemedi");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/models?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      let data: ApiErrJson = {};
      try {
        data = (await res.json()) as ApiErrJson;
      } catch {
        /* empty */
      }
      if (!res.ok) {
        toastFromApi(data, "Silinemedi");
        return;
      }
      toast.success("Kayıt silindi");
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {
      toast.error("Silinemedi");
    }
  }

  return (
    <Card className="border-slate-200/80 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Modeller</CardTitle>
        <CardDescription>
          Cihaz türü ve marka seçtikten sonra model ekleyin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="models-device-type">Cihaz türü</Label>
            <select
              id="models-device-type"
              value={deviceTypeId}
              onChange={(e) => setDeviceTypeId(e.target.value)}
              className={nativeSelectClassName}
            >
              <option value="">Cihaz türü seçin</option>
              {deviceTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="models-brand">Marka</Label>
            <select
              id="models-brand"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              disabled={!deviceTypeId || brands.length === 0}
              className={nativeSelectClassName}
            >
              <option value="">
                {!deviceTypeId
                  ? "Önce cihaz türü seçin"
                  : brands.length === 0
                    ? "Bu türde marka yok"
                    : "Marka seçin"}
              </option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="new-model">Yeni model ekle</Label>
            <Input
              id="new-model"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Model adı"
              disabled={!brandId}
            />
          </div>
          <Button
            type="button"
            onClick={() => void add()}
            disabled={loading || !brandId}
          >
            Ekle
          </Button>
        </div>
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200/80">
          {!brandId ? (
            <li className="px-4 py-6 text-center text-sm text-slate-500">
              Marka seçin.
            </li>
          ) : items.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-slate-500">
              Bu marka için model yok.
            </li>
          ) : (
            items.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-2 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-900">
                  {row.name}
                </span>
                <DeleteConfirmDialog onConfirm={() => remove(row.id)} />
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

type PrintSettings = {
  servis_fisi_boyut: string;
  servis_fisi_yon: string;
  servis_fisi_kenar: string;
  kargo_fisi_boyut: string;
  kargo_fisi_yon: string;
  kargo_fisi_kenar: string;
};

function PrintSettingsTab() {
  const [settings, setSettings] = useState<PrintSettings>({
    servis_fisi_boyut: "A4",
    servis_fisi_yon: "portrait",
    servis_fisi_kenar: "normal",
    kargo_fisi_boyut: "A6",
    kargo_fisi_yon: "portrait",
    kargo_fisi_kenar: "dar",
  });
  const [loading, setLoading] = useState(true);
  const [savingServis, setSavingServis] = useState(false);
  const [savingKargo, setSavingKargo] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/settings");
        const data = (await res.json()) as Partial<PrintSettings> & { error?: string };
        if (!res.ok) {
          toast.error(data.error ?? "Ayarlar yüklenemedi");
          return;
        }
        setSettings((prev) => ({ ...prev, ...data }));
      } catch {
        toast.error("Ayarlar yüklenemedi");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save(part: "servis" | "kargo") {
    const payload =
      part === "servis"
        ? {
            servis_fisi_boyut: settings.servis_fisi_boyut,
            servis_fisi_yon: settings.servis_fisi_yon,
            servis_fisi_kenar: settings.servis_fisi_kenar,
          }
        : {
            kargo_fisi_boyut: settings.kargo_fisi_boyut,
            kargo_fisi_yon: settings.kargo_fisi_yon,
            kargo_fisi_kenar: settings.kargo_fisi_kenar,
          };
    part === "servis" ? setSavingServis(true) : setSavingKargo(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Ayarlar kaydedilemedi");
        return;
      }
      toast.success("Ayarlar kaydedildi");
    } catch {
      toast.error("Ayarlar kaydedilemedi");
    } finally {
      part === "servis" ? setSavingServis(false) : setSavingKargo(false);
    }
  }

  const sizeOptions = ["A4", "A5", "A6", "80mm termal", "58mm termal"];
  const marginOptions = [
    { value: "yok", label: "Yok" },
    { value: "dar", label: "Dar" },
    { value: "normal", label: "Normal" },
    { value: "genis", label: "Geniş" },
  ];

  if (loading) {
    return <p className="text-sm text-slate-600">Ayarlar yükleniyor...</p>;
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Servis Giriş Fişi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Kağıt Boyutu</Label>
            <select
              className={nativeSelectClassName}
              value={settings.servis_fisi_boyut}
              onChange={(e) => setSettings((p) => ({ ...p, servis_fisi_boyut: e.target.value }))}
            >
              {sizeOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Yönlendirme</Label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="servis-yon"
                  checked={settings.servis_fisi_yon === "portrait"}
                  onChange={() => setSettings((p) => ({ ...p, servis_fisi_yon: "portrait" }))}
                />
                Dikey
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="servis-yon"
                  checked={settings.servis_fisi_yon === "landscape"}
                  onChange={() => setSettings((p) => ({ ...p, servis_fisi_yon: "landscape" }))}
                />
                Yatay
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Kenar Boşluğu</Label>
            <select
              className={nativeSelectClassName}
              value={settings.servis_fisi_kenar}
              onChange={(e) => setSettings((p) => ({ ...p, servis_fisi_kenar: e.target.value }))}
            >
              {marginOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <Button type="button" onClick={() => void save("servis")} disabled={savingServis}>
            {savingServis ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Kargo Gönderi Fişi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Kağıt Boyutu</Label>
            <select
              className={nativeSelectClassName}
              value={settings.kargo_fisi_boyut}
              onChange={(e) => setSettings((p) => ({ ...p, kargo_fisi_boyut: e.target.value }))}
            >
              {sizeOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Yönlendirme</Label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="kargo-yon"
                  checked={settings.kargo_fisi_yon === "portrait"}
                  onChange={() => setSettings((p) => ({ ...p, kargo_fisi_yon: "portrait" }))}
                />
                Dikey
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="kargo-yon"
                  checked={settings.kargo_fisi_yon === "landscape"}
                  onChange={() => setSettings((p) => ({ ...p, kargo_fisi_yon: "landscape" }))}
                />
                Yatay
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Kenar Boşluğu</Label>
            <select
              className={nativeSelectClassName}
              value={settings.kargo_fisi_kenar}
              onChange={(e) => setSettings((p) => ({ ...p, kargo_fisi_kenar: e.target.value }))}
            >
              {marginOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <Button type="button" onClick={() => void save("kargo")} disabled={savingKargo}>
            {savingKargo ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
