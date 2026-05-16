"use client";

import { useEffect, useState } from "react";

import AiAssistant from "@/components/AiAssistant";
import DemoBanner from "@/components/demo-banner";
import OneriModal from "@/components/OneriModal";
import PersonelSecimEkrani from "@/components/PersonelSecimEkrani";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  function handlePersonelSecim(personelId: string, personelAdi: string, isAdmin: boolean) {
    sessionStorage.setItem("activePersonnelId", personelId);
    sessionStorage.setItem("activePersonnelName", personelAdi);
    sessionStorage.setItem("activePersonnelIsAdmin", isAdmin ? "true" : "false");
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
