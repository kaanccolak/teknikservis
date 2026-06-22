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

          if (subscriptionStatus === "trial" && trialEndsAt) {
            const trialBitis = new Date(trialEndsAt);
            if (trialBitis < new Date()) {
              router.push("/paket-sec");
              return;
            }
          }

          if (subscriptionStatus === "expired") {
            router.push("/paket-sec");
            return;
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
