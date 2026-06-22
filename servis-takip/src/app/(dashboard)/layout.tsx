"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AiAssistant from "@/components/AiAssistant";
import DemoBanner from "@/components/demo-banner";
import OneriModal from "@/components/OneriModal";
import PersonelSecimEkrani from "@/components/PersonelSecimEkrani";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

// Beta döneminde false — canlıya alınca true yapılacak
const TRIAL_KONTROL_AKTIF = true;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [oneriOpen, setOneriOpen] = useState(false);
  const [personelGirisModuAktif, setPersonelGirisModuAktif] = useState(false);
  const [personelSecildi, setPersonelSecildi] = useState(false);
  const [ayarYuklendi, setAyarYuklendi] = useState(false);
  const [abonelikUyari, setAbonelikUyari] = useState(false);
  const [suresiDolduBanner, setSuresiDolduBanner] = useState(false);

  useEffect(() => {
    const aktifPersonel = sessionStorage.getItem("activePersonnelId");

    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        const modAktif = data.personel_giris_modu === "true";
        const isAtamaModu = data.is_atama_modu === "true";
        sessionStorage.setItem("isAtamaModuAktif", isAtamaModu ? "true" : "false");
        setPersonelGirisModuAktif(modAktif);
        if (!modAktif || aktifPersonel) {
          setPersonelSecildi(true);
        }
        setAyarYuklendi(true);
      })
      .catch(() => {
        setPersonelSecildi(true);
        setAyarYuklendi(true);
      });
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        const fontSize = data.font_boyutu;
        const fontWeight = data.font_agirlik;
        if (fontSize) {
          document.documentElement.style.setProperty("--app-font-size", `${fontSize}px`);
        }
        if (fontWeight) {
          document.documentElement.style.setProperty("--app-font-weight", fontWeight);
        }
        const tableFontSize = data.tablo_font_boyutu;
        if (tableFontSize) {
          document.documentElement.style.setProperty(
            "--app-table-font-size",
            `${tableFontSize}px`,
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/shop")
      .then((r) => r.json())
      .then((shopData) => {
        // Trial süresi kontrolü
        if (TRIAL_KONTROL_AKTIF) {
          const trialEndsAt = (shopData as { trialEndsAt?: string }).trialEndsAt;
          const subscriptionStatus = (shopData as { subscriptionStatus?: string }).subscriptionStatus;
          const isExempt = (shopData as { isExempt?: boolean }).isExempt;

          if (isExempt) return;

          // 3 gün kala popup göster
          if (trialEndsAt && !isExempt) {
            const kalan = Math.ceil(
              (new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            if (kalan > 0 && kalan <= 3) {
              // Bugün zaten gösterildiyse tekrar gösterme
              const gosterildi = localStorage.getItem("abonelikUyariGun");
              const bugun = new Date().toDateString();
              if (gosterildi !== bugun) {
                setAbonelikUyari(true);
              }
            }
          }

          // Süresi dolmuşsa banner göster
          const trialBitis = trialEndsAt ? new Date(trialEndsAt) : null;
          const suresiDoldu =
            subscriptionStatus === "expired" ||
            (subscriptionStatus === "trial" && trialBitis && trialBitis < new Date());
          if (suresiDoldu) {
            setSuresiDolduBanner(true);
          }
        }
      })
      .catch(() => {});
  }, [router]);

  function handlePersonelSecim(
    personelId: string,
    personelAdi: string,
    isAdmin: boolean,
    yetkiler: {
      canViewSirketim: boolean;
      canViewRaporlar: boolean;
      canViewPlanlarim: boolean;
      canViewBayiler: boolean;
      canViewCari: boolean;
      canViewStok: boolean;
      canViewDisServis: boolean;
      canViewBekleyen: boolean;
      canViewIkinciEl: boolean;
      canViewCihazSorgula: boolean;
      canViewCihazKayit: boolean;
    },
  ) {
    sessionStorage.setItem("activePersonnelId", personelId);
    sessionStorage.setItem("activePersonnelName", personelAdi);
    sessionStorage.setItem("activePersonnelIsAdmin", isAdmin ? "true" : "false");
    sessionStorage.setItem("activePersonnelPermissions", JSON.stringify(yetkiler));
    document.cookie = `personnelIsAdmin=${isAdmin ? "true" : "false"}; path=/`;
    setPersonelSecildi(true);
  }

  if (!ayarYuklendi) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#f9fafb",
        }}
      >
        <p style={{ color: "#6b7280", fontSize: "14px" }}>Yükleniyor...</p>
      </div>
    );
  }

  if (personelGirisModuAktif && !personelSecildi) {
    return <PersonelSecimEkrani onSecim={handlePersonelSecim} />;
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-slate-50/80">
      {suresiDolduBanner && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9998,
          background: "#dc2626",
          color: "white",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>
            ⚠️ Aboneliğiniz sona erdi. Kayıtlarınızı görüntüleyebilirsiniz ancak değişiklik yapamazsınız.
          </span>
          <button
            type="button"
            onClick={() => window.location.href = "/paket-sec"}
            style={{
              background: "white",
              color: "#dc2626",
              border: "none",
              borderRadius: "6px",
              padding: "6px 16px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Planı Yenile
          </button>
        </div>
      )}
      {abonelikUyari && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}>
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "32px 28px",
            maxWidth: "420px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#111827", marginBottom: "12px" }}>
              Aboneliğiniz Dolmak Üzere
            </h2>
            <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px", lineHeight: 1.6 }}>
              Aboneliğinizin bitmesine <strong style={{ color: "#dc2626" }}>3 gün veya daha az</strong> kaldı. Kesintisiz kullanım için lütfen planınızı yenileyin.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("abonelikUyariGun", new Date().toDateString());
                  setAbonelikUyari(false);
                  window.location.href = "/paket-sec?yukselt=1";
                }}
                style={{
                  background: "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 24px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Hemen Yenile
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("abonelikUyariGun", new Date().toDateString());
                  setAbonelikUyari(false);
                }}
                style={{
                  background: "none",
                  color: "#6b7280",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Daha Sonra
              </button>
            </div>
          </div>
        </div>
      )}
      <Sidebar onOneriOpen={() => setOneriOpen(true)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <DemoBanner />
        <main className="flex-1 overflow-auto p-6 pt-20 lg:pt-6">{children}</main>
      </div>
      <AiAssistant />
      <OneriModal open={oneriOpen} onClose={() => setOneriOpen(false)} />
    </div>
  );
}
