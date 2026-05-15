"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useSearchParams } from "next/navigation";
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
import { KURULUM_TURLERI } from "@/lib/hizli-kurulum-data";

type ShopFull = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxOrTcNo: string | null;
  taxOffice: string | null;
  website: string | null;
  waPhoneNumberId: string | null;
  waEnabled: boolean;
  waTokenConfigured?: boolean;
  googleContactsConnected?: boolean;
  receiptNotes?: string | null;
  ikinciElGarantiSartlari?: string | null;
  ikinciElAlimBelgeNotu?: string | null;
  ikinciElSatisFiyatGoster?: boolean;
  isDemo?: boolean;
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

function phoneForDisplayRow(stored: string | null | undefined): string | undefined {
  if (!stored?.trim()) return undefined;
  const d = phoneToDisplayField(stored);
  return d ? `+90 ${d}` : undefined;
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-[600px] animate-pulse space-y-4">
      <div className="h-10 w-full rounded bg-slate-100" />
      <div className="h-7 w-48 rounded bg-slate-200" />
      <div className="h-4 w-72 rounded bg-slate-100" />
      <div className="space-y-3 pt-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-10 rounded bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

const DEFAULT_TEMPLATES: Record<
  string,
  { label: string; defaultMessage: string; variables: string[] }
> = {
  servis_teslim_alindi: {
    label: "Teslim Alındı",
    defaultMessage:
      "Sayın {isim}, {seriNo} seri numaralı {cihaz} cihazınız teslim alınmıştır. Cihazınızla ilgili gelişmeleri size bildireceğiz.",
    variables: ["{isim}", "{seriNo}", "{cihaz}"],
  },
  fiyat_bildirimi: {
    label: "Fiyat Bildirimi",
    defaultMessage:
      "Sayın {isim}. {seriNo} seri numaralı {cihaz} cihazınızın {fiyat} masrafı vardır. Onaylamak için lütfen bu mesajı yanıtlayın.",
    variables: ["{isim}", "{seriNo}", "{cihaz}", "{fiyat}"],
  },
  onay_bekleniyor: {
    label: "Onay Bekliyor",
    defaultMessage:
      'Sayın {isim}, {seriNo} seri numaralı {cihaz} cihazınız için onayınızı bekliyoruz. Onaylıyorsanız lütfen bu mesajı sadece "onaylıyorum" yazarak yanıtlayın.',
    variables: ["{isim}", "{seriNo}", "{cihaz}"],
  },
  onay_verildi: {
    label: "Onay Verildi",
    defaultMessage:
      "Sayın {isim}, {seriNo} seri numaralı {cihaz} cihazınız için onay verdiniz. Cihazınızın onarımıyla ilgili sizi bilgilendireceğiz.",
    variables: ["{isim}", "{seriNo}", "{cihaz}"],
  },
  parca_bekleniyor: {
    label: "Parça Bekliyor",
    defaultMessage:
      "Sayın {isim}, {seriNo} seri numaralı {cihaz} cihazınız için gerekli parçayı bekliyoruz. Parça temin edildiğinde sizi bilgilendireceğiz.",
    variables: ["{isim}", "{seriNo}", "{cihaz}"],
  },
  tamiri_olmuyor: {
    label: "Tamiri Olmuyor",
    defaultMessage:
      "Sayın {isim}, {seriNo} seri numaralı {cihaz} cihazınızın onarımı maalesef yapılamıyor. Teknik servisimizin belirlediği neden: ({neden}) Daha fazla bilgi için teknik servisimizle iletişime geçebilirsiniz.",
    variables: ["{isim}", "{seriNo}", "{cihaz}", "{neden}"],
  },
  sorun_gorulmedi: {
    label: "Sorun Görülmedi",
    defaultMessage:
      "Sayın {isim}, {seriNo} seri numaralı {cihaz} cihazınızın arıza tespitinde herhangi bir sorun görülmedi. Cihazınızı teslim alabilirsiniz.",
    variables: ["{isim}", "{seriNo}", "{cihaz}"],
  },
  musteri_iade_istiyor: {
    label: "Müşteri İade İstiyor",
    defaultMessage:
      "Sayın {isim}, {seriNo} seri numaralı {cihaz} cihazınızı iade almak istediğinizi belirttiniz. Cihazınızı teslim alabilirsiniz.",
    variables: ["{isim}", "{seriNo}", "{cihaz}"],
  },
  onarim_tamamlandi: {
    label: "Onarım Tamamlandı",
    defaultMessage:
      "Sayın {isim}, {seriNo} seri numaralı {cihaz} cihazınızın onarımı tamamlanmıştır. Tamir ücreti {fiyat}. Cihazınızı teslim alabilirsiniz.",
    variables: ["{isim}", "{seriNo}", "{cihaz}", "{fiyat}"],
  },
  teslim_edildi: {
    label: "Teslim Edildi",
    defaultMessage:
      "Sayın {isim}, {seriNo} seri numaralı {cihaz} cihazınız teslim edilmiştir. Bizi tercih ettiğiniz için teşekkür ederiz.",
    variables: ["{isim}", "{seriNo}", "{cihaz}"],
  },
  teslim_tamir_olmuyor: {
    label: "Teslim (Tamir Olmuyor)",
    defaultMessage:
      "Sayın {isim}, {seriNo} seri numaralı {cihaz} cihazınız tamiri yapılamamış olup teslim edilmiştir. Bizi tercih ettiğiniz için teşekkür ederiz.",
    variables: ["{isim}", "{seriNo}", "{cihaz}"],
  },
  teslim_sorun_gorulmedi: {
    label: "Teslim (Sorun Görülmedi)",
    defaultMessage:
      "Sayın {isim}, {seriNo} seri numaralı {cihaz} cihazınızın arıza tespitinde herhangi bir sorun görülmemiş olup teslim edilmiştir. Bizi tercih ettiğiniz için teşekkür ederiz.",
    variables: ["{isim}", "{seriNo}", "{cihaz}"],
  },
  teslim_musteri_iade: {
    label: "Teslim (Müşteri İade)",
    defaultMessage:
      "Sayın {isim}, {seriNo} seri numaralı {cihaz} cihazınızı iade almak istediğinizi belirttiniz ve herhangi bir işlem yapılmadan teslim edilmiştir. Bizi tercih ettiğiniz için teşekkür ederiz.",
    variables: ["{isim}", "{seriNo}", "{cihaz}"],
  },
};

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
  isDemo,
}: {
  onConfirm: () => void | Promise<void>;
  triggerClassName?: string;
  isDemo?: boolean;
}) {
  if (isDemo) {
    return (
      <button
        type="button"
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-base leading-none opacity-50 cursor-not-allowed",
          triggerClassName,
        )}
        aria-label="Sil"
        onClick={() =>
          toast.error("Demo hesapta bu işlem yapılamaz.")
        }
      >
        <span aria-hidden>🗑</span>
      </button>
    );
  }
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

type TanimlarSubTabId = "types" | "brands" | "models";



function SirketimTanimlarPanel({ isDemo }: { isDemo: boolean }) {
  const [seciliTur, setSeciliTur] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hizliKurulumAcik, setHizliKurulumAcik] = useState(false);
  const [sonYuklemeId, setSonYuklemeId] = useState<string | null>(null);
  const [geriAlYukleniyor, setGeriAlYukleniyor] = useState(false);
  const [tanimlarSubTab, setTanimlarSubTab] = useState<TanimlarSubTabId>("types");
  const [showDeletePasswordModal, setShowDeletePasswordModal] =
    useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");
  const [deletingWithPassword, setDeletingWithPassword] = useState(false);
  const [pendingDeleteFetchUrl, setPendingDeleteFetchUrl] = useState<
    string | null
  >(null);
  const [hasSettingsPassword, setHasSettingsPassword] = useState<
    boolean | null
  >(null);
  const pendingDeleteSuccessRef = useRef<(() => void) | null>(null);
  const [cascadeConfirm1, setCascadeConfirm1] = useState<{
    url: string;
    isim: string;
    tip: "tur" | "marka";
    onSuccess: () => void;
  } | null>(null);
  const [cascadeConfirm2, setCascadeConfirm2] = useState<{
    url: string;
    isim: string;
    tip: "tur" | "marka";
    onSuccess: () => void;
  } | null>(null);

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

  async function runDeleteCore(
    url: string,
    settingsPassword: string,
  ): Promise<
    | { ok: true }
    | { ok: false; status: number; data: ApiErrJson }
  > {
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settingsPassword }),
      });
      let data: ApiErrJson = {};
      try {
        data = (await res.json()) as ApiErrJson;
      } catch {
        /* empty */
      }
      if (!res.ok) {
        return { ok: false, status: res.status, data };
      }
      return { ok: true };
    } catch {
      toast.error("Bağlantı hatası");
      return { ok: false, status: 0, data: {} };
    }
  }

  async function handleCascadeDelete() {
    if (!cascadeConfirm2) return;
    const { url, onSuccess } = cascadeConfirm2;
    setCascadeConfirm2(null);
    setDeletingWithPassword(true);
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settingsPassword: deletePassword, force: true }),
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
      onSuccess();
      toast.success("Silindi");
      setDeletePassword("");
      setPendingDeleteFetchUrl(null);
      pendingDeleteSuccessRef.current = null;
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setDeletingWithPassword(false);
    }
  }

  async function openDeletePasswordModal(url: string, onSuccess: () => void) {
    let hp = hasSettingsPassword;
    if (hp === null) {
      hp = await ensureHasSettingsPassword();
    }
    if (!hp) {
      setDeletingWithPassword(true);
      try {
        const r = await runDeleteCore(url, "");
        if (r.ok) {
          onSuccess();
          toast.success("Silindi");
          return;
        }
        if (r.status === 403) {
          toast.error(
            typeof r.data.error === "string" ? r.data.error : "Parola yanlış",
          );
          return;
        }
        if (
          r.status === 400 &&
          typeof r.data.error === "string" &&
          r.data.error.includes("bağlı")
        ) {
          setCascadeConfirm1({
            url,
            isim: "",
            tip: url.includes("device-types") ? "tur" : "marka",
            onSuccess,
          });
          setShowDeletePasswordModal(false);
          return;
        }
        toastFromApi(r.data, "Silinemedi");
      } finally {
        setDeletingWithPassword(false);
      }
      return;
    }
    setPendingDeleteFetchUrl(url);
    pendingDeleteSuccessRef.current = onSuccess;
    setShowDeletePasswordModal(true);
  }

  async function confirmDeleteWithPassword() {
    if (hasSettingsPassword !== false && !deletePassword.trim()) {
      setDeletePasswordError("Parola girin");
      return;
    }
    if (!pendingDeleteFetchUrl) return;
    setDeletingWithPassword(true);
    setDeletePasswordError("");
    try {
      const r = await runDeleteCore(
        pendingDeleteFetchUrl,
        hasSettingsPassword === false ? "" : deletePassword,
      );
      if (r.ok) {
        setShowDeletePasswordModal(false);
        setDeletePassword("");
        setPendingDeleteFetchUrl(null);
        const cb = pendingDeleteSuccessRef.current;
        pendingDeleteSuccessRef.current = null;
        cb?.();
        toast.success("Silindi");
        return;
      }
      if (r.status === 403) {
        setDeletePasswordError(
          typeof r.data.error === "string" ? r.data.error : "Parola yanlış",
        );
        return;
      }
      if (
        r.status === 400 &&
        typeof r.data.error === "string" &&
        r.data.error.includes("bağlı")
      ) {
        const cb = pendingDeleteSuccessRef.current;
        if (pendingDeleteFetchUrl && cb) {
          setCascadeConfirm1({
            url: pendingDeleteFetchUrl,
            isim: "",
            tip: pendingDeleteFetchUrl.includes("device-types")
              ? "tur"
              : "marka",
            onSuccess: cb,
          });
          setShowDeletePasswordModal(false);
        }
        return;
      }
      toastFromApi(r.data, "Silinemedi");
    } finally {
      setDeletingWithPassword(false);
    }
  }

  const tabBtn = (id: TanimlarSubTabId, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setTanimlarSubTab(id)}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        tanimlarSubTab === id
          ? "border-slate-900 text-slate-900"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
    </button>
  );

  async function handleHizliKurulum() {
    if (!seciliTur) return;
    setYukleniyor(true);
    try {
      const res = await fetch("/api/hizli-kurulum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turId: seciliTur }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        yuklemeId?: string;
        eklenenTanim?: number;
        eklenenMarka?: number;
        eklenenModel?: number;
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Yükleme başarısız");
        return;
      }
      toast.success(
        `✅ Yüklendi! ${data.eklenenTanim ?? 0} tanım, ${data.eklenenMarka ?? 0} marka, ${data.eklenenModel ?? 0} model eklendi.`,
      );
      setSonYuklemeId(data.yuklemeId ?? null);
      setSeciliTur(null);
      setHizliKurulumAcik(false);
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setYukleniyor(false);
    }
  }

  async function handleGeriAl() {
    if (!sonYuklemeId) return;
    setGeriAlYukleniyor(true);
    try {
      const res = await fetch("/api/hizli-kurulum/geri-al", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yuklemeId: sonYuklemeId }),
      });
      const data = (await res.json()) as {
        silinenTanim?: number;
        silinenMarka?: number;
        silinenModel?: number;
        atlananKayit?: number;
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Geri alma başarısız");
        return;
      }
      const atlanan = data.atlananKayit ?? 0;
      toast.success(
        `↩️ Geri alındı! ${data.silinenTanim ?? 0} tanım, ${data.silinenMarka ?? 0} marka, ${data.silinenModel ?? 0} model silindi.${atlanan > 0 ? ` (${atlanan} kayıt kullanımda olduğu için atlandı)` : ""}`,
      );
      setSonYuklemeId(null);
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setGeriAlYukleniyor(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Hızlı Kurulum */}
      <div style={{ marginBottom: "8px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Tanımlar</h1>
            <p className="mt-1 text-sm text-slate-600">
              Cihaz türü, marka ve model listelerini yönetin.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {sonYuklemeId ? (
              <button
                type="button"
                onClick={() => void handleGeriAl()}
                disabled={geriAlYukleniyor}
                style={{
                  padding: "8px 16px",
                  background: geriAlYukleniyor ? "#d1d5db" : "#fef2f2",
                  color: geriAlYukleniyor ? "#9ca3af" : "#dc2626",
                  border: "1px solid #fca5a5",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: geriAlYukleniyor ? "wait" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {geriAlYukleniyor ? "Geri alınıyor..." : "↩️ Son Yüklemeyi Geri Al"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setHizliKurulumAcik((v) => !v)}
              style={{
                padding: "8px 16px",
                background: hizliKurulumAcik ? "#111827" : "white",
                color: hizliKurulumAcik ? "white" : "#111827",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              ⚡ Hızlı Kurulum
            </button>
          </div>
        </div>

        {hizliKurulumAcik ? (
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "20px",
              background: "#f9fafb",
              marginBottom: "24px",
            }}
          >
            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>
              Servis türünüzü seçin, cihaz tanımları, markalar ve modeller otomatik
              eklensin.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              {[
                { id: "telefon", ad: "📱 Telefon / Tablet" },
                { id: "oyun-konsolu", ad: "🎮 Oyun Konsolu" },
                { id: "televizyon", ad: "📺 Televizyon / Görüntü" },
                { id: "klima", ad: "❄️ Klima / Isıtma" },
                { id: "beyaz-esya", ad: "🏠 Beyaz Eşya" },
                { id: "ofis-ekipmani", ad: "🖨️ Ofis Ekipmanı" },
                { id: "kamera", ad: "📷 Kamera / Optik" },
                { id: "kucuk-ev-aletleri", ad: "🔧 Küçük Ev Aletleri" },
                { id: "ses-sistemleri", ad: "🔊 Ses / Müzik" },
                { id: "bilgisayar", ad: "💻 Bilgisayar / Laptop" },
                { id: "endustriyel", ad: "🔌 Endüstriyel Elektronik" },
                { id: "oto-elektronik", ad: "🚗 Oto Elektronik" },
                { id: "medikal", ad: "🏥 Medikal / Sağlık" },
                { id: "guvenlik", ad: "🔑 Güvenlik Sistemleri" },
              ].map((tur) => (
                <button
                  key={tur.id}
                  type="button"
                  onClick={() => setSeciliTur(tur.id === seciliTur ? null : tur.id)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border:
                      seciliTur === tur.id ? "2px solid #111827" : "1px solid #d1d5db",
                    background: seciliTur === tur.id ? "#111827" : "white",
                    color: seciliTur === tur.id ? "white" : "#374151",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontWeight: seciliTur === tur.id ? 600 : 400,
                  }}
                >
                  {tur.ad}
                </button>
              ))}
            </div>
            {seciliTur
              ? (() => {
                  const tur = KURULUM_TURLERI.find((t) => t.id === seciliTur);
                  if (!tur) return null;
                  return (
                    <div
                      style={{
                        marginBottom: "16px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "10px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          background: "#f3f4f6",
                          padding: "10px 16px",
                          borderBottom: "1px solid #e5e7eb",
                          display: "flex",
                          gap: "24px",
                        }}
                      >
                        <span
                          style={{ fontSize: "12px", color: "#6b7280" }}
                        >
                          <strong style={{ color: "#111827" }}>
                            {tur.tanimlar.length}
                          </strong>{" "}
                          tanım
                        </span>
                        <span
                          style={{ fontSize: "12px", color: "#6b7280" }}
                        >
                          <strong style={{ color: "#111827" }}>
                            {tur.markalar.length}
                          </strong>{" "}
                          marka
                        </span>
                        <span
                          style={{ fontSize: "12px", color: "#6b7280" }}
                        >
                          <strong style={{ color: "#111827" }}>
                            {tur.markalar.reduce(
                              (acc, m) => acc + m.modeller.length,
                              0,
                            )}
                          </strong>{" "}
                          model
                        </span>
                      </div>
                      <div
                        style={{
                          padding: "12px 16px",
                          display: "flex",
                          gap: "32px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ minWidth: "120px" }}>
                          <p
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              marginBottom: "6px",
                            }}
                          >
                            Tanımlar
                          </p>
                          {tur.tanimlar.map((t) => (
                            <p
                              key={t.ad}
                              style={{
                                fontSize: "12px",
                                color: "#374151",
                                margin: "2px 0",
                              }}
                            >
                              • {t.ad}
                            </p>
                          ))}
                        </div>
                        <div style={{ flex: 1, minWidth: "200px" }}>
                          <p
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              marginBottom: "6px",
                            }}
                          >
                            Markalar ve Modeller
                          </p>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "12px",
                            }}
                          >
                            {tur.markalar.map((m) => (
                              <div key={m.ad} style={{ minWidth: "140px" }}>
                                <p
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: "#111827",
                                    margin: "0 0 3px 0",
                                  }}
                                >
                                  {m.ad}
                                </p>
                                {m.modeller.slice(0, 5).map((mo) => (
                                  <p
                                    key={mo.ad}
                                    style={{
                                      fontSize: "11px",
                                      color: "#6b7280",
                                      margin: "1px 0",
                                    }}
                                  >
                                    · {mo.ad}
                                  </p>
                                ))}
                                {m.modeller.length > 5 && (
                                  <p
                                    style={{
                                      fontSize: "11px",
                                      color: "#9ca3af",
                                      margin: "1px 0",
                                    }}
                                  >
                                    +{m.modeller.length - 5} daha
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              : null}
            {seciliTur ? (
              <>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginBottom: "10px",
                  }}
                >
                  💡 Bu listeler başlangıç içeriğidir. Yükledikten sonra Tanımlar,
                  Markalar ve Modeller sekmelerinden istediğiniz gibi
                  düzenleyebilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={() => void handleHizliKurulum()}
                  disabled={yukleniyor}
                  style={{
                    padding: "10px 24px",
                    background: yukleniyor ? "#d1d5db" : "#111827",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: yukleniyor ? "wait" : "pointer",
                  }}
                >
                  {yukleniyor ? "Yükleniyor..." : "✨ Seçili Türü Yükle"}
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
        {tabBtn("types", "Cihaz türleri")}
        {tabBtn("brands", "Markalar")}
        {tabBtn("models", "Modeller")}
      </div>

      {tanimlarSubTab === "types" ? (
        <DeviceTypesTab
          openDeletePasswordModal={openDeletePasswordModal}
          isDemo={isDemo}
        />
      ) : null}
      {tanimlarSubTab === "brands" ? (
        <BrandsTab
          openDeletePasswordModal={openDeletePasswordModal}
          isDemo={isDemo}
        />
      ) : null}
      {tanimlarSubTab === "models" ? (
        <ModelsTab
          openDeletePasswordModal={openDeletePasswordModal}
          isDemo={isDemo}
        />
      ) : null}

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
                  setPendingDeleteFetchUrl(null);
                  pendingDeleteSuccessRef.current = null;
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

      {/* Cascade Onay 1 */}
      {cascadeConfirm1 ? (
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
              maxWidth: "400px",
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
              ⚠️
            </div>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 600,
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              {cascadeConfirm1.tip === "tur"
                ? "Cihaz türünü sil?"
                : "Markayı sil?"}
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              {cascadeConfirm1.tip === "tur"
                ? "Bu cihaz türüne bağlı tüm markalar ve modeller de silinecek."
                : "Bu markaya bağlı tüm modeller de silinecek."}{" "}
              Silmek istediğinize emin misiniz?
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => {
                  setCascadeConfirm2(cascadeConfirm1);
                  setCascadeConfirm1(null);
                }}
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
                Evet, devam et
              </button>
              <button
                type="button"
                onClick={() => setCascadeConfirm1(null)}
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

      {/* Cascade Onay 2 */}
      {cascadeConfirm2 ? (
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
              maxWidth: "400px",
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
              Bu işlem geri alınamaz
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              {cascadeConfirm2.tip === "tur"
                ? "Cihaz türü ve bağlı tüm markalar ile modeller kalıcı olarak silinecek."
                : "Marka ve bağlı tüm modeller kalıcı olarak silinecek."}{" "}
              Onaylıyor musunuz?
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => void handleCascadeDelete()}
                disabled={deletingWithPassword}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: deletingWithPassword ? "#d1d5db" : "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: deletingWithPassword ? "wait" : "pointer",
                }}
              >
                {deletingWithPassword ? "Siliniyor..." : "Kalıcı Olarak Sil"}
              </button>
              <button
                type="button"
                onClick={() => setCascadeConfirm2(null)}
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

function DeviceTypesTab({
  openDeletePasswordModal,
  isDemo,
}: {
  openDeletePasswordModal: (url: string, onSuccess: () => void) => void;
  isDemo: boolean;
}) {
  const [items, setItems] = useState<IdName[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingDeviceTypeId, setEditingDeviceTypeId] = useState<string | null>(
    null,
  );
  const [editingDeviceTypeName, setEditingDeviceTypeName] = useState("");
  const [editSaving, setEditSaving] = useState(false);

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

  async function handleEditDeviceType(id: string) {
    if (isDemo) {
      toast.error("Demo hesapta bu işlem yapılamaz.");
      return;
    }
    if (!editingDeviceTypeName.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/device-types/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingDeviceTypeName.trim() }),
      });
      if (res.ok) {
        toast.success("Güncellendi");
        setEditingDeviceTypeId(null);
        await load();
      } else {
        toast.error("Güncellenemedi");
      }
    } catch {
      toast.error("Güncellenemedi");
    } finally {
      setEditSaving(false);
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
          <Button
            type="button"
            onClick={() => {
              if (isDemo) {
                toast.error("Demo hesapta bu işlem yapılamaz.");
                return;
              }
              void add();
            }}
            disabled={loading}
            style={
              isDemo
                ? { opacity: 0.5, cursor: "not-allowed" }
                : undefined
            }
          >
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
                className="flex flex-wrap items-center gap-2 px-4 py-3"
              >
                {editingDeviceTypeId === row.id ? (
                  <>
                    <Input
                      className="min-w-[8rem] flex-1"
                      value={editingDeviceTypeName}
                      onChange={(e) => setEditingDeviceTypeName(e.target.value)}
                      disabled={editSaving}
                    />
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={editSaving}
                        onClick={() => void handleEditDeviceType(row.id)}
                      >
                        {editSaving ? "Kaydediliyor..." : "Kaydet"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={editSaving}
                        onClick={() => {
                          setEditingDeviceTypeId(null);
                          setEditingDeviceTypeName("");
                        }}
                      >
                        İptal
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 text-sm font-medium text-slate-900">
                      {row.name}
                    </span>
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (isDemo) {
                            toast.error("Demo hesapta bu işlem yapılamaz.");
                            return;
                          }
                          setEditingDeviceTypeId(row.id);
                          setEditingDeviceTypeName(row.name);
                        }}
                        style={
                          isDemo
                            ? { opacity: 0.5, cursor: "not-allowed" }
                            : undefined
                        }
                      >
                        Düzenle
                      </Button>
                      <DeleteConfirmDialog
                        isDemo={isDemo}
                        onConfirm={() =>
                          openDeletePasswordModal(
                            `/api/device-types/${encodeURIComponent(row.id)}`,
                            () =>
                              setItems((prev) =>
                                prev.filter((x) => x.id !== row.id),
                              ),
                          )
                        }
                      />
                    </div>
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function BrandsTab({
  openDeletePasswordModal,
  isDemo,
}: {
  openDeletePasswordModal: (url: string, onSuccess: () => void) => void;
  isDemo: boolean;
}) {
  const [deviceTypes, setDeviceTypes] = useState<IdName[]>([]);
  const [deviceTypeId, setDeviceTypeId] = useState("");
  const [items, setItems] = useState<IdName[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editingBrandName, setEditingBrandName] = useState("");
  const [editSaving, setEditSaving] = useState(false);

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

  useEffect(() => {
    setEditingBrandId(null);
    setEditingBrandName("");
  }, [deviceTypeId]);

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

  async function handleEditBrand(id: string) {
    if (isDemo) {
      toast.error("Demo hesapta bu işlem yapılamaz.");
      return;
    }
    if (!editingBrandName.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/brands/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingBrandName.trim() }),
      });
      if (res.ok) {
        toast.success("Güncellendi");
        setEditingBrandId(null);
        if (deviceTypeId) await loadBrands(deviceTypeId);
      } else {
        toast.error("Güncellenemedi");
      }
    } catch {
      toast.error("Güncellenemedi");
    } finally {
      setEditSaving(false);
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
            onClick={() => {
              if (isDemo) {
                toast.error("Demo hesapta bu işlem yapılamaz.");
                return;
              }
              void add();
            }}
            disabled={loading || !deviceTypeId}
            style={
              isDemo
                ? { opacity: 0.5, cursor: "not-allowed" }
                : undefined
            }
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
                className="flex flex-wrap items-center gap-2 px-4 py-3"
              >
                {editingBrandId === row.id ? (
                  <>
                    <Input
                      className="min-w-[8rem] flex-1"
                      value={editingBrandName}
                      onChange={(e) => setEditingBrandName(e.target.value)}
                      disabled={editSaving}
                    />
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={editSaving}
                        onClick={() => void handleEditBrand(row.id)}
                      >
                        {editSaving ? "Kaydediliyor..." : "Kaydet"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={editSaving}
                        onClick={() => {
                          setEditingBrandId(null);
                          setEditingBrandName("");
                        }}
                      >
                        İptal
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 text-sm font-medium text-slate-900">
                      {row.name}
                    </span>
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (isDemo) {
                            toast.error("Demo hesapta bu işlem yapılamaz.");
                            return;
                          }
                          setEditingBrandId(row.id);
                          setEditingBrandName(row.name);
                        }}
                        style={
                          isDemo
                            ? { opacity: 0.5, cursor: "not-allowed" }
                            : undefined
                        }
                      >
                        Düzenle
                      </Button>
                      <DeleteConfirmDialog
                        isDemo={isDemo}
                        onConfirm={() =>
                          openDeletePasswordModal(
                            `/api/brands/${encodeURIComponent(row.id)}`,
                            () =>
                              setItems((prev) =>
                                prev.filter((x) => x.id !== row.id),
                              ),
                          )
                        }
                      />
                    </div>
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function ModelsTab({
  openDeletePasswordModal,
  isDemo,
}: {
  openDeletePasswordModal: (url: string, onSuccess: () => void) => void;
  isDemo: boolean;
}) {
  const [deviceTypes, setDeviceTypes] = useState<IdName[]>([]);
  const [brands, setBrands] = useState<IdName[]>([]);
  const [deviceTypeId, setDeviceTypeId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [items, setItems] = useState<IdName[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editingModelName, setEditingModelName] = useState("");
  const [editSaving, setEditSaving] = useState(false);

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

  useEffect(() => {
    setEditingModelId(null);
    setEditingModelName("");
  }, [brandId]);

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

  async function handleEditModel(id: string) {
    if (isDemo) {
      toast.error("Demo hesapta bu işlem yapılamaz.");
      return;
    }
    if (!editingModelName.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/models/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingModelName.trim() }),
      });
      if (res.ok) {
        toast.success("Güncellendi");
        setEditingModelId(null);
        if (brandId) await loadModels(brandId);
      } else {
        toast.error("Güncellenemedi");
      }
    } catch {
      toast.error("Güncellenemedi");
    } finally {
      setEditSaving(false);
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
            onClick={() => {
              if (isDemo) {
                toast.error("Demo hesapta bu işlem yapılamaz.");
                return;
              }
              void add();
            }}
            disabled={loading || !brandId}
            style={
              isDemo
                ? { opacity: 0.5, cursor: "not-allowed" }
                : undefined
            }
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
                className="flex flex-wrap items-center gap-2 px-4 py-3"
              >
                {editingModelId === row.id ? (
                  <>
                    <Input
                      className="min-w-[8rem] flex-1"
                      value={editingModelName}
                      onChange={(e) => setEditingModelName(e.target.value)}
                      disabled={editSaving}
                    />
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={editSaving}
                        onClick={() => void handleEditModel(row.id)}
                      >
                        {editSaving ? "Kaydediliyor..." : "Kaydet"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={editSaving}
                        onClick={() => {
                          setEditingModelId(null);
                          setEditingModelName("");
                        }}
                      >
                        İptal
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 text-sm font-medium text-slate-900">
                      {row.name}
                    </span>
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (isDemo) {
                            toast.error("Demo hesapta bu işlem yapılamaz.");
                            return;
                          }
                          setEditingModelId(row.id);
                          setEditingModelName(row.name);
                        }}
                        style={
                          isDemo
                            ? { opacity: 0.5, cursor: "not-allowed" }
                            : undefined
                        }
                      >
                        Düzenle
                      </Button>
                      <DeleteConfirmDialog
                        isDemo={isDemo}
                        onConfirm={() =>
                          openDeletePasswordModal(
                            `/api/models?id=${encodeURIComponent(row.id)}`,
                            () =>
                              setItems((prev) =>
                                prev.filter((x) => x.id !== row.id),
                              ),
                          )
                        }
                      />
                    </div>
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function SirketimPageInner() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    | "sirket"
    | "whatsapp"
    | "google"
    | "silinen"
    | "durumlar"
    | "tanimlar"
    | "fis"
    | "personeller"
    | "ikinci-el-belge"
  >("sirket");
  const [deletedOrders, setDeletedOrders] = useState<{
    id: string;
    orderNo: string;
    customerName: string;
    deviceName: string;
    deletedAt: string;
    createdAt: string;
  }[]>([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [waTemplates, setWaTemplates] = useState<Record<string, string>>({});
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [shop, setShop] = useState<ShopFull | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [receiptNotes, setReceiptNotes] = useState("");
  const [savingReceiptNotes, setSavingReceiptNotes] = useState(false);
  const [etiketGenislik, setEtiketGenislik] = useState("80");
  const [savingEtiket, setSavingEtiket] = useState(false);
  const [etiketFontBoyutu, setEtiketFontBoyutu] = useState("13");
  const [savingEtiketFont, setSavingEtiketFont] = useState(false);
  const [ikinciElGarantiSartlari, setIkinciElGarantiSartlari] = useState("");
  const [savingIkinciElGaranti, setSavingIkinciElGaranti] = useState(false);
  const [ikinciElAlimBelgeNotu, setIkinciElAlimBelgeNotu] = useState("");
  const [savingIkinciElAlim, setSavingIkinciElAlim] = useState(false);
  const [ikinciElSatisFiyatGoster, setIkinciElSatisFiyatGoster] = useState(true);
  const [savingIkinciElSatisFiyat, setSavingIkinciElSatisFiyat] = useState(false);

  const [personeller, setPersoneller] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [yeniPersonelAdi, setYeniPersonelAdi] = useState("");
  const [personelEkleniyor, setPersonelEkleniyor] = useState(false);
  const [personelSiliniyor, setPersonelSiliniyor] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [taxOrTcNo, setTaxOrTcNo] = useState("");
  const [taxOffice, setTaxOffice] = useState("");

  const [baileysPhone, setBaileysPhone] = useState("");
  const [baileysCode, setBaileysCode] = useState("");
  const [baileysStatus, setBaileysStatus] = useState<
    "idle" | "waiting_code" | "connected" | "loading"
  >("idle");
  const [baileysConnected, setBaileysConnected] = useState(false);
  const [savingBaileys, setSavingBaileys] = useState(false);

  const [settingsLocked, setSettingsLocked] = useState(true);
  const [hasSettingsPassword, setHasSettingsPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [modalCurrentPassword, setModalCurrentPassword] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Parola durumunu kontrol et
      try {
        const pwRes = await fetch("/api/shop/settings-password");
        const pwData = (await pwRes.json()) as { hasPassword?: boolean };
        setHasSettingsPassword(!!pwData.hasPassword);
        if (!pwData.hasPassword) {
          setSettingsLocked(false); // parola yoksa direkt aç
        }
      } catch {
        // parola uç noktası hata verirse ayarlar yine yüklensin
      }

      const res = await fetch("/api/shop");
      const data = (await res.json()) as ShopFull | { error?: string };
      if (!res.ok) {
        setError(
          (data as { error?: string }).error ?? "Bilgiler yüklenemedi",
        );
        setShop(null);
        setIsDemo(false);
        return;
      }
      const row = data as ShopFull;
      setShop(row);
      const isDemoAccount = row.isDemo === true;
      const isUnlocked =
        typeof document !== "undefined" &&
        document.cookie.includes("demo_unlocked=true");
      setIsDemo(isDemoAccount && !isUnlocked);
      setReceiptNotes(row.receiptNotes ?? "");
      setIkinciElGarantiSartlari(
        typeof row.ikinciElGarantiSartlari === "string"
          ? row.ikinciElGarantiSartlari
          : "Ürünün garanti süresi 6 aydır.\nÜrünün varsa kutu, fatura ve diğer belgelerini saklayın. Aksi halde garanti geçerli olmayacaktır.\nSıvı temas, enerji dalgalanmaları, darbe sonucu oluşan arızalar garanti kapsamı dışındadır.",
      );
      setIkinciElAlimBelgeNotu(
        typeof row.ikinciElAlimBelgeNotu === "string"
          ? row.ikinciElAlimBelgeNotu
          : "",
      );
      setIkinciElSatisFiyatGoster(row.ikinciElSatisFiyatGoster !== false);

      try {
        const settingsRes = await fetch("/api/settings");
        const settingsData = await settingsRes.json().catch(() => ({}));
        setEtiketGenislik(
          (settingsData as Record<string, string>).etiket_genislik ?? "80",
        );
        setEtiketFontBoyutu(
          (settingsData as Record<string, string>).etiket_font_boyutu ?? "13",
        );
      } catch {
        // varsayılan etiketGenislik kalır
      }

      // Baileys bağlantı durumunu kontrol et
      try {
        const statusRes = await fetch("/api/baileys/status");
        if (statusRes.ok) {
          const statusData = (await statusRes.json()) as {
            connected?: boolean;
          };
          setBaileysConnected(statusData.connected === true);
          if (statusData.connected) setBaileysStatus("connected");
        }
      } catch {
        // sessizce geç
      }
    } catch {
      setError("Bağlantı hatası");
      setShop(null);
      setIsDemo(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("googleSuccess")) {
      toast.success("Google Contacts bağlandı!");
      window.history.replaceState({}, "", "/sirketim");
    }
    if (searchParams.get("googleError")) {
      toast.error("Google bağlantısı başarısız");
      window.history.replaceState({}, "", "/sirketim");
    }
  }, [searchParams]);

  useEffect(() => {
    if (isDemo && settingsLocked) {
      setPasswordInput("1234");
    }
  }, [isDemo, settingsLocked]);

  useEffect(() => {
    if (activeTab === "personeller") {
      void fetch("/api/personnel")
        .then((r) => r.json())
        .then((data: { id: string; name: string }[]) => {
          if (Array.isArray(data)) setPersoneller(data);
        })
        .catch(() => null);
    }
  }, [activeTab]);

  function openEdit() {
    if (!shop) return;
    setName(shop.name ?? "");
    setPhone(phoneToDisplayField(shop.phone));
    setEmail(shop.email ?? "");
    setWebsite(shop.website ?? "");
    setAddress(shop.address ?? "");
    setTaxOrTcNo(shop.taxOrTcNo ?? "");
    setTaxOffice(shop.taxOffice ?? "");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function handleSaveReceiptNotes() {
    setSavingReceiptNotes(true);
    try {
      const res = await fetch("/api/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptNotes }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Kayıt başarısız");
        return;
      }
      toast.success("Fiş ayarları kaydedildi!");
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSavingReceiptNotes(false);
    }
  }

  async function handleSaveIkinciElAlim() {
    setSavingIkinciElAlim(true);
    try {
      const res = await fetch("/api/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ikinciElAlimBelgeNotu }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Kayıt başarısız");
        return;
      }
      toast.success("Alım belgesi notu kaydedildi!");
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSavingIkinciElAlim(false);
    }
  }

  async function handleSaveIkinciElSatisFiyat(value: boolean) {
    setSavingIkinciElSatisFiyat(true);
    try {
      const res = await fetch("/api/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ikinciElSatisFiyatGoster: value }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Kayıt başarısız");
        return;
      }
      setIkinciElSatisFiyatGoster(value);
      toast.success("Ayar kaydedildi!");
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSavingIkinciElSatisFiyat(false);
    }
  }

  async function handleSaveIkinciElGaranti() {
    setSavingIkinciElGaranti(true);
    try {
      const res = await fetch("/api/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ikinciElGarantiSartlari }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Kayıt başarısız");
        return;
      }
      toast.success("Garanti şartları kaydedildi!");
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSavingIkinciElGaranti(false);
    }
  }

  async function handleSaveEtiketGenislik() {
    setSavingEtiket(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etiket_genislik: etiketGenislik }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Kayıt başarısız");
        return;
      }
      toast.success("Etiket boyutu kaydedildi!");
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSavingEtiket(false);
    }
  }

  async function handleSaveEtiketFont() {
    setSavingEtiketFont(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etiket_font_boyutu: etiketFontBoyutu }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Kayıt başarısız");
        return;
      }
      toast.success("Font boyutu kaydedildi!");
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSavingEtiketFont(false);
    }
  }

  function selectTab(
    tab:
      | "sirket"
      | "whatsapp"
      | "google"
      | "silinen"
      | "durumlar"
      | "tanimlar"
      | "fis"
      | "personeller"
      | "ikinci-el-belge",
  ) {
    setActiveTab(tab);
    if (
      tab === "whatsapp" ||
      tab === "google" ||
      tab === "silinen" ||
      tab === "tanimlar" ||
      tab === "fis" ||
      tab === "personeller" ||
      tab === "ikinci-el-belge"
    )
      setEditing(false);
    if (tab === "silinen") void loadDeletedOrders();
    if (tab === "durumlar") void loadWaTemplates();
  }

  async function loadDeletedOrders() {
    setLoadingDeleted(true);
    try {
      const res = await fetch("/api/shop/deleted-orders");
      const data = await res.json();
      setDeletedOrders(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Silinen kayıtlar yüklenemedi");
    } finally {
      setLoadingDeleted(false);
    }
  }

  async function loadWaTemplates() {
    setLoadingTemplates(true);
    try {
      const res = await fetch("/api/shop/wa-templates");
      const data = await res.json();
      const map: Record<string, string> = {};
      if (Array.isArray(data)) {
        data.forEach((t: { templateName: string; message: string }) => {
          map[t.templateName] = t.message;
        });
      }
      setWaTemplates(map);
    } catch {
      toast.error("Şablonlar yüklenemedi");
    } finally {
      setLoadingTemplates(false);
    }
  }

  async function handlePersonelEkle() {
    if (!yeniPersonelAdi.trim()) return;
    setPersonelEkleniyor(true);
    try {
      const res = await fetch("/api/personnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: yeniPersonelAdi.trim() }),
      });
      const data = (await res.json()) as { id: string; name: string; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Eklenemedi");
        return;
      }
      setPersoneller((prev) => [...prev, data]);
      setYeniPersonelAdi("");
      toast.success("Personel eklendi");
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setPersonelEkleniyor(false);
    }
  }

  async function handlePersonelSil(id: string) {
    setPersonelSiliniyor(id);
    try {
      const res = await fetch(`/api/personnel/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Silinemedi");
        return;
      }
      setPersoneller((prev) => prev.filter((p) => p.id !== id));
      toast.success("Personel silindi");
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setPersonelSiliniyor(null);
    }
  }

  async function handleSaveTemplate(templateName: string, message: string) {
    setSavingTemplate(templateName);
    try {
      const res = await fetch("/api/shop/wa-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateName, message }),
      });
      if (!res.ok) {
        toast.error("Kayıt başarısız");
        return;
      }
      setWaTemplates((prev) => ({ ...prev, [templateName]: message }));
      toast.success("Şablon kaydedildi!");
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSavingTemplate(null);
    }
  }

  function handleResetTemplate(templateName: string) {
    const def = DEFAULT_TEMPLATES[templateName];
    if (!def) return;
    setWaTemplates((prev) => ({ ...prev, [templateName]: def.defaultMessage }));
  }

  function handleGoogleConnect() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error("Google istemci kimliği yapılandırılmamış");
      return;
    }
    const appBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    const redirectUri = appBase
      ? `${appBase}/api/auth/google/callback`
      : `${window.location.origin}/api/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/contacts",
      access_type: "offline",
      prompt: "consent",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async function handleGoogleDisconnect() {
    if (!shop) return;
    try {
      const res = await fetch("/api/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: shop.name.trim(),
          phone: shop.phone,
          email: shop.email,
          website: shop.website,
          address: shop.address,
          taxOrTcNo: shop.taxOrTcNo,
          taxOffice: shop.taxOffice,
          googleAccessToken: null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "İşlem başarısız");
        return;
      }
      toast.success("Google bağlantısı kesildi");
      await load();
    } catch {
      toast.error("Bağlantı hatası");
    }
  }

  async function handleSave() {
    if (name.trim().length < 2) {
      toast.error("Şirket adı zorunludur (en az 2 karakter)");
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
      const res = await fetch("/api/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phoneToSave,
          email: email.trim() || null,
          website: website.trim() || null,
          address: address.trim() || null,
          taxOrTcNo: taxOrTcNo.trim() || null,
          taxOffice: taxOffice.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string; name?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Kayıt başarısız");
        return;
      }
      toast.success("Şirket bilgileri güncellendi");
      window.dispatchEvent(
        new CustomEvent("shop-updated", {
          detail: { name: name.trim() },
        }),
      );
      setEditing(false);
      await load();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSaving(false);
    }
  }

  async function handleBaileysConnect() {
    if (!baileysPhone.trim()) {
      toast.error("Telefon numarası girin");
      return;
    }
    setSavingBaileys(true);
    setBaileysStatus("loading");
    try {
      const res = await fetch("/api/baileys/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "+90" + baileysPhone.trim() }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        code?: string;
        error?: string;
      };
      if (!res.ok || !data.success) {
        toast.error(data.error ?? "Bağlantı başlatılamadı");
        setBaileysStatus("idle");
        return;
      }
      setBaileysCode(data.code ?? "");
      setBaileysStatus("waiting_code");
      toast.success("WhatsApp'ınıza bir kod gönderildi!");
      // 30 saniye boyunca her 3 saniyede bağlandı mı kontrol et
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const statusRes = await fetch("/api/baileys/status");
        const statusData = (await statusRes.json()) as { connected?: boolean };
        if (statusData.connected) {
          setBaileysConnected(true);
          setBaileysStatus("connected");
          toast.success("WhatsApp başarıyla bağlandı! ✅");
          clearInterval(interval);
        }
        if (attempts >= 10) clearInterval(interval);
      }, 3000);
    } catch {
      toast.error("Bağlantı hatası");
      setBaileysStatus("idle");
    } finally {
      setSavingBaileys(false);
    }
  }

  async function handleBaileysDisconnect() {
    setSavingBaileys(true);
    try {
      await fetch("/api/baileys/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      setBaileysConnected(false);
      setBaileysStatus("idle");
      setBaileysCode("");
      setBaileysPhone("");
      toast.success("WhatsApp bağlantısı kesildi");
    } catch {
      toast.error("Hata oluştu");
    } finally {
      setSavingBaileys(false);
    }
  }

  async function handleVerifyPassword() {
    if (!passwordInput.trim()) return;
    setCheckingPassword(true);
    setPasswordError("");
    try {
      const res = await fetch("/api/shop/settings-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = (await res.json()) as { valid?: boolean };
      if (data.valid) {
        setSettingsLocked(false);
        setPasswordInput("");
        // sessionStorage'a işaretle
        sessionStorage.setItem("sirketim_unlocked", "1");
      } else {
        setPasswordError("Parola yanlış, tekrar deneyin");
      }
    } catch {
      setPasswordError("Bağlantı hatası");
    } finally {
      setCheckingPassword(false);
    }
  }

  async function handleCreatePassword() {
    if (newPassword.length < 4) {
      toast.error("Parola en az 4 karakter olmalı");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      toast.error("Parolalar eşleşmiyor");
      return;
    }
    if (hasSettingsPassword && !modalCurrentPassword.trim()) {
      toast.error("Mevcut parolayı girin");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/shop/settings-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          hasSettingsPassword
            ? {
                password: newPassword,
                currentPassword: modalCurrentPassword,
              }
            : { password: newPassword },
        ),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Hata oluştu");
        return;
      }
      setHasSettingsPassword(true);
      setShowCreatePassword(false);
      setNewPassword("");
      setNewPasswordConfirm("");
      setModalCurrentPassword("");
      toast.success("Parola oluşturuldu!");
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSavingPassword(false);
    }
  }

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "13px",
  };

  const labelStyle: CSSProperties = {
    fontSize: "13px",
    fontWeight: 500,
    color: "#374151",
    display: "block",
    marginBottom: "6px",
  };

  // Parola ekranını göster
  if (settingsLocked && hasSettingsPassword) {
    return (
      <div style={{ maxWidth: "400px", margin: "80px auto", padding: "0 16px" }}>
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
            Şirket Ayarları Korumalı
          </h2>
          <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "24px" }}>
            Devam etmek için parolanızı girin
          </p>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleVerifyPassword()}
            placeholder="Parolanız"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: passwordError ? "1px solid #fca5a5" : "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: "8px",
            }}
            autoFocus
          />
          {passwordError ? (
            <p style={{ fontSize: "12px", color: "#dc2626", marginBottom: "8px" }}>
              {passwordError}
            </p>
          ) : null}
          {isDemo ? (
            <p
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "8px",
                textAlign: "center",
              }}
            >
              Demo şifresi otomatik girildi. Giriş Yap&apos;a basın.
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void handleVerifyPassword()}
            disabled={checkingPassword}
            style={{
              width: "100%",
              padding: "10px",
              background: "#111827",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: checkingPassword ? "wait" : "pointer",
            }}
          >
            {checkingPassword ? "Doğrulanıyor..." : "Giriş Yap"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <PageSkeleton />
      ) : shop ? (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            {!isDemo ? (
              <button
                type="button"
                onClick={() => setShowCreatePassword(true)}
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                🔒 Şirket parolasını{" "}
                {hasSettingsPassword ? "değiştir" : "oluştur"}
              </button>
            ) : null}
          </div>
          <div style={{ paddingTop: "16px" }}>
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                borderBottom: "1px solid #e5e7eb",
                marginBottom: "24px",
                WebkitOverflowScrolling: "touch" as const,
                scrollbarWidth: "none" as const,
                gap: "0",
                position: "sticky",
                top: 0,
                background: "white",
                zIndex: 10,
                paddingTop: "8px",
              }}
            >
            <button
              type="button"
              onClick={() => selectTab("sirket")}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: activeTab === "sirket" ? "600" : "400",
                color: activeTab === "sirket" ? "#111" : "#6b7280",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "sirket"
                    ? "2px solid #111"
                    : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px",
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}
            >
              Şirket Bilgileri
            </button>
            <button
              type="button"
              onClick={() => selectTab("whatsapp")}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: activeTab === "whatsapp" ? "600" : "400",
                color: activeTab === "whatsapp" ? "#25D366" : "#6b7280",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "whatsapp"
                    ? "2px solid #25D366"
                    : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}
            >
              <svg
                width="16"
                height="16"
                fill="#25D366"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L0 24l6.29-1.505A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.366l-.36-.214-3.733.893.924-3.638-.235-.374A9.818 9.818 0 1 1 12 21.818z" />
              </svg>
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => selectTab("durumlar")}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: activeTab === "durumlar" ? "600" : "400",
                color: activeTab === "durumlar" ? "#25D366" : "#6b7280",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "durumlar"
                    ? "2px solid #25D366"
                    : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px",
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}
            >
              💬 Mesaj Şablonları
            </button>
            <button
              type="button"
              onClick={() => selectTab("silinen")}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: activeTab === "silinen" ? "600" : "400",
                color: activeTab === "silinen" ? "#dc2626" : "#6b7280",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "silinen"
                    ? "2px solid #dc2626"
                    : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}
            >
              🗑️ Silinen Kayıtlar
            </button>
            <button
              type="button"
              onClick={() => selectTab("google")}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: activeTab === "google" ? "600" : "400",
                color: activeTab === "google" ? "#EA4335" : "#6b7280",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "google"
                    ? "2px solid #EA4335"
                    : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px",
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}
            >
              Google Contacts
            </button>
            <button
              type="button"
              onClick={() => selectTab("tanimlar")}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: activeTab === "tanimlar" ? "600" : "400",
                color: activeTab === "tanimlar" ? "#111827" : "#6b7280",
                background: "none",
                border: "none",
                borderBottom: activeTab === "tanimlar" ? "2px solid #111827" : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px",
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}
            >
              ⚙️ Tanımlar
            </button>
            <button
              type="button"
              onClick={() => selectTab("fis")}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: activeTab === "fis" ? "600" : "400",
                color: activeTab === "fis" ? "#111827" : "#6b7280",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "fis"
                    ? "2px solid #111827"
                    : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px",
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}
            >
              🧾 Fiş / Nüsha Ayarları
            </button>
            <button
              type="button"
              onClick={() => selectTab("personeller")}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: activeTab === "personeller" ? "600" : "400",
                color: activeTab === "personeller" ? "#111827" : "#6b7280",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "personeller"
                    ? "2px solid #111827"
                    : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px",
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}
            >
              👥 Personeller
            </button>
            <button
              type="button"
              onClick={() => selectTab("ikinci-el-belge")}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: activeTab === "ikinci-el-belge" ? "600" : "400",
                color: activeTab === "ikinci-el-belge" ? "#111827" : "#6b7280",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "ikinci-el-belge"
                    ? "2px solid #111827"
                    : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px",
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}
            >
              📦 İkinci El Belge Ayarları
            </button>
            </div>

          {activeTab === "sirket" ? (
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              {!editing ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "18px", fontWeight: "600" }}>
                        Şirket Bilgileri
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#9ca3af",
                          marginTop: "2px",
                        }}
                      >
                        Fiş ve belgelerde kullanılır
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEdit()}
                      style={{
                        padding: "7px 16px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "13px",
                        cursor: "pointer",
                        background: "white",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      ✏ Düzenle
                    </button>
                  </div>

                  {(
                    [
                      { label: "Şirket Adı", value: shop?.name },
                      {
                        label: "Telefon",
                        value: phoneForDisplayRow(shop?.phone),
                      },
                      { label: "E-Posta", value: shop?.email },
                      { label: "Web Sitesi", value: shop?.website },
                      { label: "Adres", value: shop?.address },
                      { label: "Vergi No / TC", value: shop?.taxOrTcNo },
                      { label: "Vergi Dairesi", value: shop?.taxOffice },
                    ] as const
                  ).map(({ label, value }) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        padding: "12px 0",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <span
                        style={{
                          width: "160px",
                          fontSize: "13px",
                          color: "#9ca3af",
                          flexShrink: 0,
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          fontSize: "13px",
                          color: value ? "#111" : "#d1d5db",
                        }}
                      >
                        {value || "—"}
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "18px", fontWeight: "600" }}>
                      Şirket Bilgileri
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#9ca3af",
                        marginTop: "2px",
                      }}
                    >
                      Bilgileri güncelleyin
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: "16px" }}>
                    <div>
                      <label htmlFor="shop-name" style={labelStyle}>
                        Şirket Adı / Ünvan{" "}
                        <span style={{ color: "#dc2626" }}>*</span>
                      </label>
                      <input
                        id="shop-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="organization"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label htmlFor="shop-phone" style={labelStyle}>
                        Telefon
                      </label>
                      <div
                        style={{
                          display: "flex",
                          overflow: "hidden",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <span
                          style={{
                            flexShrink: 0,
                            borderRight: "1px solid #e5e7eb",
                            background: "#f9fafb",
                            padding: "10px 12px",
                            fontSize: "13px",
                            color: "#6b7280",
                          }}
                        >
                          +90
                        </span>
                        <input
                          id="shop-phone"
                          type="text"
                          value={phone}
                          onChange={(e) => {
                            const d = e.target.value.replace(/\D/g, "");
                            if (d.length > 10) return;
                            setPhone(formatPhone(e.target.value));
                          }}
                          placeholder="5XX XXX XX XX"
                          maxLength={13}
                          autoComplete="tel-national"
                          style={{
                            ...inputStyle,
                            border: "none",
                            borderRadius: 0,
                            flex: 1,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="shop-email" style={labelStyle}>
                        E-Posta
                      </label>
                      <input
                        id="shop-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label htmlFor="shop-website" style={labelStyle}>
                        Web Sitesi
                      </label>
                      <input
                        id="shop-website"
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://"
                        autoComplete="url"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label htmlFor="shop-address" style={labelStyle}>
                        Adres
                      </label>
                      <textarea
                        id="shop-address"
                        rows={4}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        style={{
                          ...inputStyle,
                          minHeight: "96px",
                          resize: "vertical",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gap: "16px",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      }}
                    >
                      <div style={{ gridColumn: "span 1" }}>
                        <label htmlFor="shop-tax" style={labelStyle}>
                          Vergi No / TC Kimlik No
                        </label>
                        <input
                          id="shop-tax"
                          type="text"
                          value={taxOrTcNo}
                          onChange={(e) => setTaxOrTcNo(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ gridColumn: "span 1" }}>
                        <label htmlFor="shop-tax-office" style={labelStyle}>
                          Vergi Dairesi
                        </label>
                        <input
                          id="shop-tax-office"
                          type="text"
                          value={taxOffice}
                          onChange={(e) => setTaxOffice(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                      marginTop: "24px",
                      paddingTop: "20px",
                      borderTop: "1px solid #f3f4f6",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => cancelEdit()}
                      disabled={saving}
                      style={{
                        padding: "10px 20px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "14px",
                        background: "white",
                        cursor: saving ? "wait" : "pointer",
                        color: "#374151",
                      }}
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={saving}
                      style={{
                        padding: "10px 20px",
                        background: saving ? "#9ca3af" : "#111827",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 500,
                        cursor: saving ? "wait" : "pointer",
                      }}
                    >
                      {saving ? "Kaydediliyor…" : "Kaydet"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : activeTab === "durumlar" ? (
            <div style={{ maxWidth: "700px", margin: "0 auto" }}>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "20px", fontWeight: 600 }}>
                  WhatsApp Mesaj Şablonları
                </h1>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  Her durum için gönderilecek mesajı özelleştirin. Değişken
                  kullanımı: {"{isim}"}, {"{seriNo}"}, {"{cihaz}"}, {"{fiyat}"},{" "}
                  {"{neden}"}
                </p>
              </div>

              {loadingTemplates ? (
                <p style={{ color: "#6b7280", fontSize: "14px" }}>
                  Yükleniyor...
                </p>
              ) : (
                <div style={{ display: "grid", gap: "20px" }}>
                  {Object.entries(DEFAULT_TEMPLATES).map(([key, def]) => {
                    const currentMessage = waTemplates[key] ?? def.defaultMessage;
                    const isModified =
                      waTemplates[key] !== undefined &&
                      waTemplates[key] !== def.defaultMessage;
                    return (
                      <div
                        key={key}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "10px",
                          }}
                        >
                          <label
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#374151",
                            }}
                          >
                            {def.label}
                            {isModified ? (
                              <span
                                style={{
                                  marginLeft: "8px",
                                  fontSize: "11px",
                                  color: "#25D366",
                                  fontWeight: 400,
                                }}
                              >
                                ● Özelleştirildi
                              </span>
                            ) : null}
                          </label>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              fontSize: "11px",
                              color: "#6b7280",
                            }}
                          >
                            {def.variables.map((v) => (
                              <span
                                key={v}
                                style={{
                                  background: "#f3f4f6",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontFamily: "monospace",
                                }}
                              >
                                {v}
                              </span>
                            ))}
                          </div>
                        </div>
                        <textarea
                          value={currentMessage}
                          onChange={(e) =>
                            setWaTemplates((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          rows={3}
                          style={{
                            width: "100%",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            padding: "10px 12px",
                            fontSize: "13px",
                            resize: "vertical",
                            outline: "none",
                            boxSizing: "border-box",
                            fontFamily: "inherit",
                          }}
                        />
                        <div
                          style={{
                            marginTop: "10px",
                            padding: "12px 14px",
                            background: "#dcfce7",
                            borderRadius: "8px",
                            fontSize: "13px",
                            color: "#166534",
                            lineHeight: "1.6",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#16a34a",
                              marginBottom: "6px",
                            }}
                          >
                            📱 Önizleme:
                          </p>
                          {(waTemplates[key] ?? def.defaultMessage)
                            .replace(/{isim}/g, "Ahmet Yılmaz")
                            .replace(/{seriNo}/g, "PS5-XA234567")
                            .replace(/{cihaz}/g, "Playstation 5")
                            .replace(/{fiyat}/g, "1.500 TL")
                            .replace(/{neden}/g, "Ana kart hasarı")}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginTop: "10px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (isDemo) {
                                toast.error(
                                  "Demo hesapta bu işlem yapılamaz.",
                                );
                                return;
                              }
                              void handleSaveTemplate(
                                key,
                                waTemplates[key] ?? def.defaultMessage,
                              );
                            }}
                            disabled={savingTemplate === key}
                            style={{
                              padding: "7px 16px",
                              background:
                                savingTemplate === key ? "#86efac" : "#25D366",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              fontSize: "13px",
                              fontWeight: 500,
                              cursor:
                                savingTemplate === key || isDemo
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: isDemo ? 0.5 : 1,
                            }}
                          >
                            {savingTemplate === key
                              ? "Kaydediliyor..."
                              : "Kaydet"}
                          </button>
                          {isModified ? (
                            <button
                              type="button"
                              onClick={() => handleResetTemplate(key)}
                              style={{
                                padding: "7px 16px",
                                background: "white",
                                color: "#6b7280",
                                border: "1px solid #d1d5db",
                                borderRadius: "8px",
                                fontSize: "13px",
                                cursor: "pointer",
                              }}
                            >
                              Varsayılana Dön
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === "silinen" ? (
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "20px", fontWeight: 600 }}>
                  Silinen Kayıtlar
                </h1>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  Silinen servis kayıtlarının listesi
                </p>
              </div>

              {loadingDeleted ? (
                <p style={{ color: "#6b7280", fontSize: "14px" }}>
                  Yükleniyor...
                </p>
              ) : deletedOrders.length === 0 ? (
                <p style={{ color: "#6b7280", fontSize: "14px" }}>
                  Silinmiş kayıt bulunamadı.
                </p>
              ) : (
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    overflow: "hidden",
                    overflowX: "auto",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "13px",
                      minWidth: "500px",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "#f9fafb",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <th
                          style={{
                            padding: "10px 16px",
                            textAlign: "left",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Kayıt No
                        </th>
                        <th
                          style={{
                            padding: "10px 16px",
                            textAlign: "left",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Müşteri
                        </th>
                        <th
                          style={{
                            padding: "10px 16px",
                            textAlign: "left",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Cihaz
                        </th>
                        <th
                          style={{
                            padding: "10px 16px",
                            textAlign: "left",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Kayıt Tarihi
                        </th>
                        <th
                          style={{
                            padding: "10px 16px",
                            textAlign: "left",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Silinme Tarihi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {deletedOrders.map((order, i) => (
                        <tr
                          key={order.id}
                          style={{
                            borderBottom:
                              i < deletedOrders.length - 1
                                ? "1px solid #e5e7eb"
                                : "none",
                          }}
                        >
                          <td style={{ padding: "10px 16px", color: "#374151" }}>
                            {order.orderNo}
                          </td>
                          <td style={{ padding: "10px 16px", color: "#374151" }}>
                            {order.customerName}
                          </td>
                          <td style={{ padding: "10px 16px", color: "#374151" }}>
                            {order.deviceName}
                          </td>
                          <td
                            style={{
                              padding: "10px 16px",
                              color: "#6b7280",
                            }}
                          >
                            {new Date(order.createdAt).toLocaleString(
                              "tr-TR",
                            )}
                          </td>
                          <td
                            style={{
                              padding: "10px 16px",
                              color: "#dc2626",
                            }}
                          >
                            {new Date(order.deletedAt).toLocaleString(
                              "tr-TR",
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === "whatsapp" ? (
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "20px", fontWeight: 600 }}>
                  WhatsApp Bağlantısı
                </h1>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  Kendi WhatsApp numaranızı bağlayarak müşterilerinize mesaj
                  gönderin
                </p>
              </div>

              {/* Durum bandı */}
              {baileysConnected ? (
                <div
                  style={{
                    background: "#dcfce7",
                    border: "1px solid #86efac",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    color: "#16a34a",
                  }}
                >
                  ✅ WhatsApp bağlı — mesajlar aktif olarak gönderilebilir
                </div>
              ) : (
                <div
                  style={{
                    background: "#fef9c3",
                    border: "1px solid #fde047",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    marginBottom: "20px",
                    fontSize: "13px",
                    color: "#854d0e",
                  }}
                >
                  WhatsApp henüz bağlı değil
                </div>
              )}

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "20px",
                  display: "grid",
                  gap: "16px",
                }}
              >
                {!baileysConnected ? (
                  <>
                    <div>
                      <label style={labelStyle}>
                        WhatsApp Telefon Numaranız
                      </label>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <span
                          style={{
                            padding: "10px 12px",
                            background: "#f3f4f6",
                            color: "#374151",
                            fontSize: "14px",
                            borderRight: "1px solid #d1d5db",
                            whiteSpace: "nowrap",
                          }}
                        >
                          +90
                        </span>
                        <input
                          type="text"
                          value={baileysPhone}
                          onChange={(e) => {
                            const val = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10);
                            setBaileysPhone(val);
                          }}
                          placeholder="5xxxxxxxxx"
                          style={{
                            border: "none",
                            outline: "none",
                            padding: "10px 12px",
                            fontSize: "14px",
                            width: "100%",
                          }}
                          disabled={baileysStatus === "waiting_code"}
                          maxLength={10}
                        />
                      </div>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginTop: "4px",
                        }}
                      >
                        Örn: 5321234567
                      </p>
                    </div>

                    {baileysStatus === "waiting_code" && baileysCode ? (
                      <div
                        style={{
                          background: "#eff6ff",
                          border: "1px solid #93c5fd",
                          borderRadius: "8px",
                          padding: "16px",
                          textAlign: "center",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#1d4ed8",
                            marginBottom: "8px",
                          }}
                        >
                          WhatsApp uygulamanızda şu kodu girin:
                        </p>
                        <p
                          style={{
                            fontSize: "32px",
                            fontWeight: 700,
                            color: "#1d4ed8",
                            letterSpacing: "4px",
                          }}
                        >
                          {baileysCode.slice(0, 4)}-{baileysCode.slice(4)}
                        </p>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            marginTop: "8px",
                          }}
                        >
                          WhatsApp → Bağlı Cihazlar → Cihaz Bağla → Telefon
                          Numarası ile Bağlan
                        </p>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            marginTop: "4px",
                          }}
                        >
                          Bağlantı kontrol ediliyor...
                        </p>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void handleBaileysConnect()}
                      disabled={
                        savingBaileys || baileysStatus === "waiting_code"
                      }
                      style={{
                        padding: "10px 20px",
                        background: savingBaileys ? "#86efac" : "#25D366",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 500,
                        cursor: savingBaileys ? "wait" : "pointer",
                        width: "fit-content",
                      }}
                    >
                      {baileysStatus === "loading"
                        ? "Bağlanıyor..."
                        : baileysStatus === "waiting_code"
                          ? "Kod Bekleniyor..."
                          : "Bağlan"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleBaileysDisconnect()}
                    disabled={savingBaileys}
                    style={{
                      padding: "10px 20px",
                      background: "#fee2e2",
                      color: "#dc2626",
                      border: "1px solid #fca5a5",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: "pointer",
                      width: "fit-content",
                    }}
                  >
                    Bağlantıyı Kes
                  </button>
                )}
              </div>
            </div>
          ) : activeTab === "fis" ? (
            <div style={{ maxWidth: "700px", margin: "0 auto" }}>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "20px", fontWeight: 600 }}>
                  Fiş / Nüsha Ayarları
                </h1>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  Müşteri nüshasının altında görünecek servis şartlarını
                  düzenleyin
                </p>
              </div>
              {/* Termal Etiket Boyutu */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "20px",
                  marginBottom: "24px",
                }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#374151",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Cihaz Etiketi Kağıt Genişliği (mm)
                </label>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginBottom: "12px",
                  }}
                >
                  Termal yazıcınızdaki kağıdın genişliğini girin. Yaygın
                  değerler: 58mm, 72mm, 80mm
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="number"
                    min={40}
                    max={120}
                    value={etiketGenislik}
                    onChange={(e) => setEtiketGenislik(e.target.value)}
                    style={{
                      width: "120px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                    placeholder="80"
                  />
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>
                    mm
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleSaveEtiketGenislik()}
                    disabled={savingEtiket}
                    style={{
                      padding: "8px 20px",
                      background: savingEtiket ? "#d1d5db" : "#111827",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      cursor: savingEtiket ? "wait" : "pointer",
                    }}
                  >
                    {savingEtiket ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </div>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "20px",
                  marginBottom: "24px",
                }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#374151",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Cihaz Etiketi Font Boyutu (px)
                </label>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginBottom: "12px",
                  }}
                >
                  Termal etiketteki yazı boyutu. Önerilen: 11-16 arası. Varsayılan:
                  13
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="number"
                    min={8}
                    max={24}
                    value={etiketFontBoyutu}
                    onChange={(e) => setEtiketFontBoyutu(e.target.value)}
                    style={{
                      width: "100px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                    placeholder="13"
                  />
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>px</span>
                  <button
                    type="button"
                    onClick={() => void handleSaveEtiketFont()}
                    disabled={savingEtiketFont}
                    style={{
                      padding: "8px 20px",
                      background: savingEtiketFont ? "#d1d5db" : "#111827",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      cursor: savingEtiketFont ? "wait" : "pointer",
                    }}
                  >
                    {savingEtiketFont ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </div>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "20px",
                }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#374151",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Servis Onarım Şartları
                </label>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginBottom: "12px",
                  }}
                >
                  Her satır müşteri nüshasında ayrı madde olarak görünür
                </p>
                <textarea
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  rows={8}
                  style={{
                    width: "100%",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    fontSize: "13px",
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    lineHeight: "1.6",
                  }}
                  placeholder="Her satıra bir madde yazın..."
                />
                <button
                  type="button"
                  onClick={() => void handleSaveReceiptNotes()}
                  disabled={savingReceiptNotes}
                  style={{
                    marginTop: "16px",
                    padding: "10px 20px",
                    background: savingReceiptNotes ? "#d1d5db" : "#111827",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: savingReceiptNotes ? "wait" : "pointer",
                  }}
                >
                  {savingReceiptNotes ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>

              {receiptNotes ? (
                <div
                  style={{
                    marginTop: "24px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "20px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      marginBottom: "12px",
                      color: "#374151",
                    }}
                  >
                    Önizleme
                  </p>
                  <div
                    style={{
                      borderTop: "1px solid #e5e7eb",
                      paddingTop: "12px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        marginBottom: "8px",
                        color: "#111827",
                      }}
                    >
                      Servis Onarım Şartlarımız
                    </p>
                    {receiptNotes
                      .split("\n")
                      .filter((l) => l.trim())
                      .map((line, i) => (
                        <p
                          key={i}
                          style={{
                            fontSize: "10px",
                            color: "#374151",
                            margin: "2px 0",
                            lineHeight: "1.6",
                          }}
                        >
                          • {line}
                        </p>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : activeTab === "personeller" ? (
            <div style={{ maxWidth: "700px", margin: "0 auto" }}>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "20px", fontWeight: 600 }}>Personeller</h1>
                <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
                  Servis kayıtlarında ve durum değişikliklerinde personel takibi yapın
                </p>
              </div>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "20px",
                  marginBottom: "24px",
                }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#374151",
                    display: "block",
                    marginBottom: "12px",
                  }}
                >
                  Yeni Personel Ekle
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={yeniPersonelAdi}
                    onChange={(e) => setYeniPersonelAdi(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handlePersonelEkle()}
                    placeholder="İsim soyisim"
                    style={{
                      flex: 1,
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void handlePersonelEkle()}
                    disabled={personelEkleniyor || !yeniPersonelAdi.trim()}
                    style={{
                      padding: "8px 20px",
                      background: "#111827",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    {personelEkleniyor ? "Ekleniyor..." : "Ekle"}
                  </button>
                </div>
              </div>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                {personeller.length === 0 ? (
                  <p
                    style={{
                      padding: "24px",
                      textAlign: "center",
                      color: "#9ca3af",
                      fontSize: "13px",
                    }}
                  >
                    Henüz personel eklenmedi
                  </p>
                ) : (
                  personeller.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "#f3f4f6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>
                          {p.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handlePersonelSil(p.id)}
                        disabled={personelSiliniyor === p.id}
                        style={{
                          padding: "4px 10px",
                          background: "#fef2f2",
                          color: "#dc2626",
                          border: "1px solid #fca5a5",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        {personelSiliniyor === p.id ? "Siliniyor..." : "Sil"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === "ikinci-el-belge" ? (
            <div style={{ maxWidth: "700px", margin: "0 auto" }}>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "20px", fontWeight: 600 }}>
                  İkinci El Alış / Satış Belge Ayarları
                </h1>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  İkinci el alım ve satış belgelerinin altında görünecek
                  notları düzenleyin
                </p>
              </div>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "20px",
                  marginBottom: "24px",
                }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#374151",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  📥 İkinci El Alım Belgesi Notu
                </label>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginBottom: "12px",
                  }}
                >
                  Alım belgesinin imza alanının altında görünür
                </p>
                <textarea
                  value={ikinciElAlimBelgeNotu}
                  onChange={(e) => setIkinciElAlimBelgeNotu(e.target.value)}
                  rows={5}
                  style={{
                    width: "100%",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    fontSize: "13px",
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    lineHeight: "1.6",
                  }}
                  placeholder="Alım belgesi için not ekleyin (opsiyonel)..."
                />
                <button
                  type="button"
                  onClick={() => void handleSaveIkinciElAlim()}
                  disabled={savingIkinciElAlim}
                  style={{
                    marginTop: "16px",
                    padding: "10px 20px",
                    background: savingIkinciElAlim ? "#d1d5db" : "#111827",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: savingIkinciElAlim ? "wait" : "pointer",
                  }}
                >
                  {savingIkinciElAlim ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "20px",
                }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#374151",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  📤 İkinci El Satış Belgesi Garanti Şartları
                </label>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginBottom: "12px",
                  }}
                >
                  Satış belgesinin imza alanının altında görünür. Her satır
                  ayrı madde olarak gösterilir.
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid #f3f4f6",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#374151",
                        margin: 0,
                      }}
                    >
                      Satış Fiyatını Belgede Göster
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        margin: "2px 0 0 0",
                      }}
                    >
                      Kapalıysa belgede fiyat alanı görünmez
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void handleSaveIkinciElSatisFiyat(!ikinciElSatisFiyatGoster)
                    }
                    disabled={savingIkinciElSatisFiyat}
                    style={{
                      width: "48px",
                      height: "26px",
                      borderRadius: "13px",
                      border: "none",
                      background: ikinciElSatisFiyatGoster ? "#4f46e5" : "#d1d5db",
                      cursor: savingIkinciElSatisFiyat ? "wait" : "pointer",
                      position: "relative",
                      transition: "background 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "3px",
                        left: ikinciElSatisFiyatGoster ? "24px" : "3px",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "white",
                        transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </button>
                </div>
                <textarea
                  value={ikinciElGarantiSartlari}
                  onChange={(e) => setIkinciElGarantiSartlari(e.target.value)}
                  rows={6}
                  style={{
                    width: "100%",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    fontSize: "13px",
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    lineHeight: "1.6",
                  }}
                  placeholder="Her satıra bir madde yazın..."
                />
                <button
                  type="button"
                  onClick={() => void handleSaveIkinciElGaranti()}
                  disabled={savingIkinciElGaranti}
                  style={{
                    marginTop: "16px",
                    padding: "10px 20px",
                    background: savingIkinciElGaranti ? "#d1d5db" : "#111827",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: savingIkinciElGaranti ? "wait" : "pointer",
                  }}
                >
                  {savingIkinciElGaranti ? "Kaydediliyor..." : "Kaydet"}
                </button>
                {ikinciElGarantiSartlari ? (
                  <div
                    style={{
                      marginTop: "20px",
                      borderTop: "1px solid #e5e7eb",
                      paddingTop: "16px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        marginBottom: "8px",
                        color: "#374151",
                      }}
                    >
                      Önizleme
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        marginBottom: "6px",
                        color: "#111827",
                      }}
                    >
                      Garanti Şartları
                    </p>
                    {ikinciElGarantiSartlari
                      .split("\n")
                      .filter((l) => l.trim())
                      .map((line, i) => (
                        <p
                          key={i}
                          style={{
                            fontSize: "10px",
                            color: "#374151",
                            margin: "2px 0",
                            lineHeight: "1.6",
                          }}
                        >
                          • {line}
                        </p>
                      ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : activeTab === "tanimlar" ? (
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
              <SirketimTanimlarPanel isDemo={isDemo} />
            </div>
          ) : (
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div style={{ marginBottom: "20px" }}>
                <h1 style={{ fontSize: "20px", fontWeight: 600 }}>
                  Google Contacts
                </h1>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  Dükkanınızın Gmail hesabıyla bağlanın; cihaz kaydında{" "}
                  <strong>yeni oluşturulan</strong> müşteriler rehbere eklenir.
                </p>
              </div>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "20px",
                  marginTop: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: "#EA4335",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "18px",
                        fontWeight: 700,
                      }}
                    >
                      G
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "600" }}>
                        Google Contacts
                      </div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {shop.googleContactsConnected
                          ? "✓ Bağlı — Yeni müşteriler otomatik ekleniyor"
                          : "Bağlı değil"}
                      </div>
                    </div>
                  </div>

                  {shop.googleContactsConnected ? (
                    <button
                      type="button"
                      onClick={() => void handleGoogleDisconnect()}
                      style={{
                        padding: "8px 16px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        background: "white",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "#dc2626",
                      }}
                    >
                      Bağlantıyı Kes
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={
                        isDemo
                          ? () =>
                              toast.error(
                                "Demo hesapta bu işlem yapılamaz.",
                              )
                          : () => handleGoogleConnect()
                      }
                      style={{
                        padding: "8px 16px",
                        background: "#EA4335",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: isDemo ? "not-allowed" : "pointer",
                        fontSize: "13px",
                        fontWeight: "500",
                        opacity: isDemo ? 0.5 : 1,
                      }}
                    >
                      Google ile Bağlan
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
        </>
      ) : null}

      {showCreatePassword ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "32px",
              width: "100%",
              maxWidth: "400px",
              margin: "0 16px",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>
              {hasSettingsPassword ? "Parolayı Değiştir" : "Parola Oluştur"}
            </h2>
            <div style={{ display: "grid", gap: "12px" }}>
              {hasSettingsPassword ? (
                <input
                  type="password"
                  value={modalCurrentPassword}
                  onChange={(e) => setModalCurrentPassword(e.target.value)}
                  placeholder="Mevcut parola"
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              ) : null}
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yeni parola (min 4 karakter)"
                style={{
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder="Parola tekrar"
                style={{
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => void handleCreatePassword()}
                  disabled={savingPassword}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#111827",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  {savingPassword ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreatePassword(false);
                    setNewPassword("");
                    setNewPasswordConfirm("");
                    setModalCurrentPassword("");
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
        </div>
      ) : null}
    </div>
  );
}

export default function SirketimPage() {
  return (
    <>
      <PageGuideModal
        pageKey="sirketim"
        icon="🏪"
        title="Şirketim"
        description="Şirket bilgilerinizi, entegrasyonları ve uygulama ayarlarını buradan yönetin."
        tips={[
          "Tanımlar → Hızlı Kurulum ile servis türünüzü seçin, cihaz türleri ve markalar otomatik yüklensin",
          "WhatsApp sekmesinden numaranızı bağlayın — müşterilere otomatik mesaj gönderin",
          "Google Contacts bağlayın — yeni müşteriler telefonunuzun rehberine otomatik eklensin",
          "Mesaj Şablonları sekmesinden WhatsApp mesaj metinlerini özelleştirin",
          "Fiş / Nüsha Ayarları sekmesinden termal yazıcı kağıt boyutunu ve servis şartlarınızı ayarlayın",
          "Sağ üstteki 'Şirket parolası oluştur' ile ayarlarınızı yetkisiz erişime karşı koruyun",
        ]}
      />
      <Suspense fallback={<PageSkeleton />}>
        <SirketimPageInner />
      </Suspense>
    </>
  );
}
