"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

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
  wppConnected?: boolean;
  wppPhone?: string | null;
};

type WppSessionInfo = {
  configured: boolean;
  status: string;
  qr: string | null;
  connected: boolean;
  phone: string | null;
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

function SirketimPageInner() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingWa, setSavingWa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "sirket" | "whatsapp" | "wpp" | "google"
  >("sirket");
  const [editing, setEditing] = useState(false);

  const [shop, setShop] = useState<ShopFull | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [taxOrTcNo, setTaxOrTcNo] = useState("");
  const [taxOffice, setTaxOffice] = useState("");

  const [waPhoneNumberId, setWaPhoneNumberId] = useState("");
  const [waAccessToken, setWaAccessToken] = useState("");
  const [waEnabled, setWaEnabled] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [wppInfo, setWppInfo] = useState<WppSessionInfo | null>(null);
  const [wppLoading, setWppLoading] = useState(false);
  const [wppConnecting, setWppConnecting] = useState(false);
  const [wppDisconnecting, setWppDisconnecting] = useState(false);

  const [wppMode, setWppMode] = useState<"qr" | "phone">("qr");
  const [wppPhoneInput, setWppPhoneInput] = useState("");
  const [wppPhoneCode, setWppPhoneCode] = useState("");
  const [wppLinkCode, setWppLinkCode] = useState<string | null>(null);
  const [wppCodeStage, setWppCodeStage] = useState<"phone" | "code">("phone");
  const [wppSendingCode, setWppSendingCode] = useState(false);
  const [wppConfirmingCode, setWppConfirmingCode] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shop");
      const data = (await res.json()) as ShopFull | { error?: string };
      if (!res.ok) {
        setError(
          (data as { error?: string }).error ?? "Bilgiler yüklenemedi",
        );
        setShop(null);
        return;
      }
      const row = data as ShopFull;
      setShop(row);
      setWaPhoneNumberId(row.waPhoneNumberId ?? "");
      setWaAccessToken("");
      setWaEnabled(Boolean(row.waEnabled));
    } catch {
      setError("Bağlantı hatası");
      setShop(null);
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

  function selectTab(tab: "sirket" | "whatsapp" | "wpp" | "google") {
    setActiveTab(tab);
    if (tab === "whatsapp" || tab === "google" || tab === "wpp") setEditing(false);
  }

  const loadWpp = useCallback(async () => {
    setWppLoading(true);
    try {
      const res = await fetch("/api/wpp/session", { cache: "no-store" });
      const data = (await res.json()) as WppSessionInfo | { error?: string };
      if (!res.ok) {
        setWppInfo({
          configured: false,
          status: "CLOSED",
          qr: null,
          connected: false,
          phone: null,
        });
        return;
      }
      setWppInfo(data as WppSessionInfo);
    } catch {
      setWppInfo({
        configured: false,
        status: "CLOSED",
        qr: null,
        connected: false,
        phone: null,
      });
    } finally {
      setWppLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "wpp") return;
    void loadWpp();
  }, [activeTab, loadWpp]);

  // WPP sekmesindeyken bağlı değilsek ya da QR aşamasındaysak 3 sn'de bir yokla
  useEffect(() => {
    if (activeTab !== "wpp") return;
    if (wppInfo?.connected) return;
    const t = setInterval(() => {
      void loadWpp();
    }, 3000);
    return () => clearInterval(t);
  }, [activeTab, wppInfo?.connected, loadWpp]);

  // Bağlantı yeni kurulmuşsa shop tablosunu yenile
  useEffect(() => {
    if (wppInfo?.connected && shop && !shop.wppConnected) {
      void load();
    }
  }, [wppInfo?.connected, shop, load]);

  async function handleWppConnect() {
    setWppConnecting(true);
    try {
      const res = await fetch("/api/wpp/session", { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Bağlantı başlatılamadı");
        return;
      }
      toast.success("Oturum başlatıldı, QR kodu bekleniyor…");
      await loadWpp();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setWppConnecting(false);
    }
  }

  async function handleWppDisconnect() {
    setWppDisconnecting(true);
    try {
      const res = await fetch("/api/wpp/session", { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Bağlantı kesilemedi");
        return;
      }
      toast.success("WhatsApp bağlantısı kesildi");
      setWppPhoneInput("");
      setWppPhoneCode("");
      setWppLinkCode(null);
      setWppCodeStage("phone");
      await loadWpp();
      await load();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setWppDisconnecting(false);
    }
  }

  async function handleSendPhoneCode() {
    const digits = wppPhoneInput.replace(/\D/g, "");
    if (digits.length !== 10) {
      toast.error("Geçerli bir telefon numarası girin (10 hane)");
      return;
    }
    const formatted = `90${digits}`;
    setWppSendingCode(true);
    try {
      const res = await fetch("/api/wpp/phone-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formatted,
          session: shop?.id,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        linkCode?: string | null;
        error?: string;
      };
      if (!res.ok || !data.success) {
        toast.error(data.error ?? "Kod gönderilemedi");
        return;
      }
      setWppLinkCode(data.linkCode ?? null);
      setWppCodeStage("code");
      if (data.linkCode) {
        toast.success("Pairing kodu oluşturuldu");
      } else {
        toast.success("Oturum başlatıldı, kodu telefonunuza girin");
      }
      void loadWpp();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setWppSendingCode(false);
    }
  }

  async function handleConfirmPhoneCode() {
    const cleaned = wppPhoneCode.trim().replace(/\s|-/g, "");
    if (cleaned.length < 4) {
      toast.error("Lütfen geçerli bir kod girin");
      return;
    }
    setWppConfirmingCode(true);
    try {
      const res = await fetch("/api/wpp/confirm-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleaned,
          session: shop?.id,
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        toast.error(data.error ?? "Kod doğrulanamadı");
        return;
      }
      toast.success("Kod doğrulandı, bağlantı bekleniyor…");
      void loadWpp();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setWppConfirmingCode(false);
    }
  }

  function resetPhoneCodeFlow() {
    setWppPhoneCode("");
    setWppLinkCode(null);
    setWppCodeStage("phone");
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

  async function handleSaveWA() {
    if (!shop) {
      toast.error("Şirket bilgisi yüklenemedi");
      return;
    }
    if (shop.name.trim().length < 2) {
      toast.error("Şirket adı eksik; önce şirket bilgilerini tamamlayın");
      return;
    }

    setSavingWa(true);
    try {
      const body: Record<string, unknown> = {
        name: shop.name.trim(),
        phone: shop.phone,
        email: shop.email,
        website: shop.website,
        address: shop.address,
        taxOrTcNo: shop.taxOrTcNo,
        taxOffice: shop.taxOffice,
        waPhoneNumberId: waPhoneNumberId.trim() || null,
        waEnabled,
      };
      if (waAccessToken.trim()) {
        body.waAccessToken = waAccessToken.trim();
      }
      const res = await fetch("/api/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Kayıt başarısız");
        return;
      }
      toast.success("WhatsApp ayarları kaydedildi");
      setWaAccessToken("");
      await load();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSavingWa(false);
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
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #e5e7eb",
              marginBottom: "24px",
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
              WhatsApp API
            </button>
            <button
              type="button"
              onClick={() => selectTab("wpp")}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: activeTab === "wpp" ? "600" : "400",
                color: activeTab === "wpp" ? "#128C7E" : "#6b7280",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "wpp"
                    ? "2px solid #128C7E"
                    : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg
                width="16"
                height="16"
                fill="#128C7E"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L0 24l6.29-1.505A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.366l-.36-.214-3.733.893.924-3.638-.235-.374A9.818 9.818 0 1 1 12 21.818z" />
              </svg>
              WhatsApp (WPP)
              {shop?.wppConnected ? (
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#16a34a",
                    display: "inline-block",
                  }}
                  aria-label="bağlı"
                />
              ) : null}
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
              }}
            >
              Google Contacts
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
          ) : activeTab === "whatsapp" ? (
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "20px", fontWeight: 600 }}>
                  WhatsApp Business API
                </h1>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  WhatsApp bildirimlerini aktif etmek için API bilgilerinizi
                  girin
                </p>
              </div>

              {shop.waEnabled ? (
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
                  ✓ WhatsApp bildirimleri aktif
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
                  WhatsApp bildirimleri henüz aktif değil
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gap: "16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "20px",
                }}
              >
                <div>
                  <label style={labelStyle}>Phone Number ID</label>
                  <input
                    type="text"
                    value={waPhoneNumberId}
                    onChange={(e) => setWaPhoneNumberId(e.target.value)}
                    placeholder="123456789012345"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Access Token
                    {shop.waTokenConfigured ? (
                      <span style={{ fontWeight: 400, color: "#16a34a" }}>
                        {" "}
                        (Kayıtlı — yeni token için doldurun)
                      </span>
                    ) : null}
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showToken ? "text" : "password"}
                      value={waAccessToken}
                      onChange={(e) => setWaAccessToken(e.target.value)}
                      placeholder="EAAxxxxx..."
                      autoComplete="new-password"
                      style={{
                        ...inputStyle,
                        padding: "10px 40px 10px 12px",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#9ca3af",
                      }}
                      aria-label={showToken ? "Token gizle" : "Token göster"}
                    >
                      {showToken ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    padding: "10px",
                    background: "#f9fafb",
                    borderRadius: "8px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={waEnabled}
                    onChange={(e) => setWaEnabled(e.target.checked)}
                    style={{ width: "16px", height: "16px" }}
                  />
                  <span style={{ fontSize: "13px", color: "#374151" }}>
                    WhatsApp bildirimlerini aktif et
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => void handleSaveWA()}
                  disabled={savingWa}
                  style={{
                    padding: "10px 20px",
                    background: savingWa ? "#86efac" : "#25D366",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: savingWa ? "wait" : "pointer",
                    width: "fit-content",
                  }}
                >
                  {savingWa ? "Kaydediliyor…" : "Ayarları Kaydet"}
                </button>
              </div>
            </div>
          ) : activeTab === "wpp" ? (
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "20px", fontWeight: 600 }}>
                  WhatsApp (WPPConnect)
                </h1>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  WhatsApp Web üzerinden QR kod ile bağlanın. Şablon onayı
                  gerekmez; mesajlar bağlı telefonunuz üzerinden gider.
                </p>
              </div>

              {wppInfo && !wppInfo.configured ? (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    marginBottom: "20px",
                    fontSize: "13px",
                    color: "#991b1b",
                  }}
                >
                  WPPConnect sunucusu yapılandırılmamış. Sunucu yöneticisinden{" "}
                  <code>WPPCONNECT_URL</code> ortam değişkenini ayarlamasını
                  isteyin.
                </div>
              ) : null}

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                {wppLoading && !wppInfo ? (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#6b7280",
                      textAlign: "center",
                      padding: "40px 0",
                    }}
                  >
                    Yükleniyor…
                  </div>
                ) : shop?.wppConnected || wppInfo?.connected ? (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "16px",
                      }}
                    >
                      <span
                        style={{
                          background: "#dcfce7",
                          border: "1px solid #86efac",
                          color: "#16a34a",
                          fontSize: "13px",
                          fontWeight: 600,
                          padding: "6px 12px",
                          borderRadius: "999px",
                        }}
                      >
                        ✓ Bağlı
                      </span>
                      {wppInfo?.phone || shop?.wppPhone ? (
                        <span style={{ fontSize: "14px", color: "#111" }}>
                          +{(wppInfo?.phone || shop?.wppPhone || "").replace(
                            /\D/g,
                            "",
                          )}
                        </span>
                      ) : null}
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#6b7280",
                        marginBottom: "16px",
                      }}
                    >
                      Cihazınız WhatsApp Web üzerinden bu sunucuya bağlı.
                      Telefonun internet bağlantısı koparsa oturum sona erer ve
                      yeniden bağlanmanız gerekir.
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleWppDisconnect()}
                      disabled={wppDisconnecting}
                      style={{
                        padding: "10px 20px",
                        background: "white",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 500,
                        cursor: wppDisconnecting ? "wait" : "pointer",
                      }}
                    >
                      {wppDisconnecting
                        ? "Bağlantı kesiliyor…"
                        : "Bağlantıyı Kes"}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "20px",
                        background: "#f3f4f6",
                        padding: "4px",
                        borderRadius: "10px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setWppMode("qr")}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          fontSize: "13px",
                          fontWeight: wppMode === "qr" ? 600 : 400,
                          color: wppMode === "qr" ? "#111" : "#6b7280",
                          background: wppMode === "qr" ? "white" : "transparent",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          boxShadow:
                            wppMode === "qr"
                              ? "0 1px 2px rgba(0,0,0,0.05)"
                              : "none",
                        }}
                      >
                        QR Kod
                      </button>
                      <button
                        type="button"
                        onClick={() => setWppMode("phone")}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          fontSize: "13px",
                          fontWeight: wppMode === "phone" ? 600 : 400,
                          color: wppMode === "phone" ? "#111" : "#6b7280",
                          background:
                            wppMode === "phone" ? "white" : "transparent",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          boxShadow:
                            wppMode === "phone"
                              ? "0 1px 2px rgba(0,0,0,0.05)"
                              : "none",
                        }}
                      >
                        Telefon Kodu
                      </button>
                    </div>

                    {wppMode === "qr" ? (
                      wppInfo?.qr ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              background: "white",
                              padding: "12px",
                              border: "1px solid #e5e7eb",
                              borderRadius: "12px",
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={wppInfo.qr}
                              alt="WhatsApp QR Kodu"
                              width={256}
                              height={256}
                              style={{ display: "block" }}
                            />
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#374151",
                              textAlign: "center",
                              lineHeight: 1.6,
                            }}
                          >
                            Telefonunuzda <strong>WhatsApp</strong>’ı açın →{" "}
                            <strong>Ayarlar</strong> →{" "}
                            <strong>Bağlı Cihazlar</strong> →{" "}
                            <strong>Cihaz Bağla</strong> ile QR kodu tarayın.
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                            }}
                          >
                            Durum: {wppInfo.status} · Bağlantı kontrol ediliyor…
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#6b7280",
                            }}
                          >
                            {wppInfo
                              ? `Durum: ${wppInfo.status}`
                              : "Henüz bir oturum başlatılmadı."}
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleWppConnect()}
                            disabled={
                              wppConnecting ||
                              (wppInfo ? !wppInfo.configured : false)
                            }
                            style={{
                              padding: "10px 20px",
                              background: wppConnecting
                                ? "#86efac"
                                : "#25D366",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              fontSize: "14px",
                              fontWeight: 500,
                              cursor:
                                wppConnecting ||
                                (wppInfo ? !wppInfo.configured : false)
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                wppInfo && !wppInfo.configured ? 0.6 : 1,
                            }}
                          >
                            {wppConnecting ? "Başlatılıyor…" : "Bağlan"}
                          </button>
                        </div>
                      )
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                        }}
                      >
                        {wppCodeStage === "phone" ? (
                          <>
                            <div>
                              <label style={labelStyle}>
                                Telefon Numarası
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
                                  type="text"
                                  value={wppPhoneInput}
                                  onChange={(e) => {
                                    const d = e.target.value.replace(
                                      /\D/g,
                                      "",
                                    );
                                    if (d.length > 10) return;
                                    setWppPhoneInput(formatPhone(e.target.value));
                                  }}
                                  placeholder="5XX XXX XX XX"
                                  maxLength={13}
                                  inputMode="numeric"
                                  autoComplete="tel-national"
                                  style={{
                                    ...inputStyle,
                                    border: "none",
                                    borderRadius: 0,
                                    flex: 1,
                                  }}
                                />
                              </div>
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: "#6b7280",
                                  marginTop: "6px",
                                }}
                              >
                                WhatsApp’a kayıtlı telefon numaranızı girin.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleSendPhoneCode()}
                              disabled={
                                wppSendingCode ||
                                (wppInfo ? !wppInfo.configured : false)
                              }
                              style={{
                                padding: "10px 20px",
                                background: wppSendingCode
                                  ? "#86efac"
                                  : "#25D366",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: 500,
                                cursor:
                                  wppSendingCode ||
                                  (wppInfo ? !wppInfo.configured : false)
                                    ? "not-allowed"
                                    : "pointer",
                                width: "fit-content",
                                opacity:
                                  wppInfo && !wppInfo.configured ? 0.6 : 1,
                              }}
                            >
                              {wppSendingCode ? "Gönderiliyor…" : "Kod Gönder"}
                            </button>
                          </>
                        ) : (
                          <>
                            <div
                              style={{
                                background: "#f0f9ff",
                                border: "1px solid #bae6fd",
                                borderRadius: "8px",
                                padding: "12px 14px",
                                fontSize: "13px",
                                color: "#075985",
                                lineHeight: 1.6,
                              }}
                            >
                              {wppLinkCode ? (
                                <>
                                  Aşağıdaki kodu telefonunuzdaki{" "}
                                  <strong>WhatsApp</strong> →{" "}
                                  <strong>Ayarlar</strong> →{" "}
                                  <strong>Bağlı Cihazlar</strong> →{" "}
                                  <strong>Cihaz Bağla</strong> →{" "}
                                  <strong>
                                    Telefon numarasıyla bağla
                                  </strong>{" "}
                                  ekranına girin:
                                  <div
                                    style={{
                                      marginTop: "10px",
                                      fontSize: "22px",
                                      fontWeight: 700,
                                      letterSpacing: "4px",
                                      fontFamily:
                                        "ui-monospace, SFMono-Regular, Menlo, monospace",
                                      color: "#0c4a6e",
                                    }}
                                  >
                                    {wppLinkCode}
                                  </div>
                                </>
                              ) : (
                                <>
                                  Pairing kodu oluşturuldu. WPPConnect
                                  sunucusunun bu sürümü kodu doğrudan
                                  döndürmüyor; aşağıya, telefonunuzdaki
                                  WhatsApp uygulamasının verdiği kodu girip
                                  <strong> Bağlan</strong>’a basın.
                                </>
                              )}
                            </div>
                            <div>
                              <label style={labelStyle}>Bağlantı Kodu</label>
                              <input
                                type="text"
                                value={wppPhoneCode}
                                onChange={(e) =>
                                  setWppPhoneCode(
                                    e.target.value
                                      .toUpperCase()
                                      .replace(/\s|-/g, "")
                                      .slice(0, 8),
                                  )
                                }
                                placeholder="XXXXXXXX"
                                maxLength={8}
                                autoComplete="one-time-code"
                                style={{
                                  ...inputStyle,
                                  letterSpacing: "3px",
                                  fontFamily:
                                    "ui-monospace, SFMono-Regular, Menlo, monospace",
                                  fontSize: "16px",
                                  textTransform: "uppercase",
                                }}
                              />
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: "#6b7280",
                                  marginTop: "8px",
                                  lineHeight: 1.6,
                                }}
                              >
                                <strong>WhatsApp</strong>’ı açın →{" "}
                                <strong>Ayarlar</strong> →{" "}
                                <strong>Bağlı Cihazlar</strong> →{" "}
                                <strong>Telefonla bağlan</strong> → Kodu buraya
                                girin
                              </p>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => resetPhoneCodeFlow()}
                                disabled={wppConfirmingCode}
                                style={{
                                  padding: "10px 20px",
                                  background: "white",
                                  color: "#374151",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "8px",
                                  fontSize: "14px",
                                  cursor: wppConfirmingCode
                                    ? "wait"
                                    : "pointer",
                                }}
                              >
                                Geri
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleConfirmPhoneCode()}
                                disabled={wppConfirmingCode}
                                style={{
                                  padding: "10px 20px",
                                  background: wppConfirmingCode
                                    ? "#86efac"
                                    : "#25D366",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "8px",
                                  fontSize: "14px",
                                  fontWeight: 500,
                                  cursor: wppConfirmingCode
                                    ? "wait"
                                    : "pointer",
                                }}
                              >
                                {wppConfirmingCode
                                  ? "Bağlanıyor…"
                                  : "Bağlan"}
                              </button>
                            </div>
                            {wppInfo ? (
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#6b7280",
                                }}
                              >
                                Durum: {wppInfo.status} · Bağlantı kontrol
                                ediliyor…
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                      onClick={() => handleGoogleConnect()}
                      style={{
                        padding: "8px 16px",
                        background: "#EA4335",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "500",
                      }}
                    >
                      Google ile Bağlan
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

export default function SirketimPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SirketimPageInner />
    </Suspense>
  );
}
