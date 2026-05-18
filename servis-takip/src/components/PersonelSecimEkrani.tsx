"use client";

import { useEffect, useState } from "react";

interface Personel {
  id: string;
  name: string;
  hasPassword: boolean;
  isAdmin: boolean;
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
  canCreateRecord: boolean;
  canDeleteIkinciEl: boolean;
  canDeleteServis: boolean;
  canEditServis: boolean;
  canEditIkinciEl: boolean;
  canUpdateServisStatus: boolean;
  canAddDisServis: boolean;
  canDeleteDisServis: boolean;
  canEditDisServis: boolean;
  canAddStok: boolean;
  canDeleteStok: boolean;
  canEditStok: boolean;
  canAddCari: boolean;
  canEditCari: boolean;
  canDeleteCari: boolean;
  canAddBayi: boolean;
  canEditBayi: boolean;
  canDeleteBayi: boolean;
  canAddPlan: boolean;
  canEditPlan: boolean;
  canDeletePlan: boolean;
  canViewCiro: boolean;
  canPrintMusteri: boolean;
  canPrintTeslim: boolean;
  canPrintEtiket: boolean;
  canPrintAlimFisi: boolean;
  canPrintSatisFisi: boolean;
  canSellIkinciEl: boolean;
}

interface Props {
  onSecim: (
    personelId: string,
    personelAdi: string,
    isAdmin: boolean,
    yetkiler: Omit<Personel, "id" | "name" | "hasPassword" | "isAdmin">,
  ) => void;
}

export default function PersonelSecimEkrani({ onSecim }: Props) {
  const [personeller, setPersoneller] = useState<Personel[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secilenId, setSecilenId] = useState<string | null>(null);
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [dogrulanıyor, setDogrulanıyor] = useState(false);

  useEffect(() => {
    fetch("/api/personnel")
      .then((r) => r.json())
      .then((data: Personel[]) => {
        setPersoneller(data);
        setYukleniyor(false);
      })
      .catch(() => setYukleniyor(false));
  }, []);

  async function handleSecim(p: Personel) {
    if (!p.hasPassword) {
      onSecim(p.id, p.name, p.isAdmin, {
        canViewSirketim: p.canViewSirketim,
        canViewRaporlar: p.canViewRaporlar,
        canViewPlanlarim: p.canViewPlanlarim,
        canViewBayiler: p.canViewBayiler,
        canViewCari: p.canViewCari,
        canViewStok: p.canViewStok,
        canViewDisServis: p.canViewDisServis,
        canViewBekleyen: p.canViewBekleyen,
        canViewIkinciEl: p.canViewIkinciEl,
        canViewCihazSorgula: p.canViewCihazSorgula,
        canViewCihazKayit: p.canViewCihazKayit,
        canCreateRecord: p.canCreateRecord,
        canDeleteIkinciEl: p.canDeleteIkinciEl,
        canDeleteServis: p.canDeleteServis,
        canEditServis: p.canEditServis,
        canEditIkinciEl: p.canEditIkinciEl,
        canUpdateServisStatus: p.canUpdateServisStatus,
        canAddDisServis: p.canAddDisServis,
        canDeleteDisServis: p.canDeleteDisServis,
        canEditDisServis: p.canEditDisServis,
        canAddStok: p.canAddStok,
        canDeleteStok: p.canDeleteStok,
        canEditStok: p.canEditStok,
        canAddCari: p.canAddCari,
        canEditCari: p.canEditCari,
        canDeleteCari: p.canDeleteCari,
        canAddBayi: p.canAddBayi,
        canEditBayi: p.canEditBayi,
        canDeleteBayi: p.canDeleteBayi,
        canAddPlan: p.canAddPlan,
        canEditPlan: p.canEditPlan,
        canDeletePlan: p.canDeletePlan,
        canViewCiro: p.canViewCiro,
        canPrintMusteri: p.canPrintMusteri,
        canPrintTeslim: p.canPrintTeslim,
        canPrintEtiket: p.canPrintEtiket,
        canPrintAlimFisi: p.canPrintAlimFisi,
        canPrintSatisFisi: p.canPrintSatisFisi,
        canSellIkinciEl: p.canSellIkinciEl,
      });
      return;
    }
    setSecilenId(p.id);
    setSifre("");
    setHata("");
  }

  async function handleSifreDogrula() {
    if (!secilenId) return;
    setDogrulanıyor(true);
    setHata("");
    try {
      const res = await fetch("/api/personnel/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personnelId: secilenId, password: sifre }),
      });
      if (res.ok) {
        const p = personeller.find((x) => x.id === secilenId)!;
        onSecim(p.id, p.name, p.isAdmin, {
          canViewSirketim: p.canViewSirketim,
          canViewRaporlar: p.canViewRaporlar,
          canViewPlanlarim: p.canViewPlanlarim,
          canViewBayiler: p.canViewBayiler,
          canViewCari: p.canViewCari,
          canViewStok: p.canViewStok,
          canViewDisServis: p.canViewDisServis,
          canViewBekleyen: p.canViewBekleyen,
          canViewIkinciEl: p.canViewIkinciEl,
          canViewCihazSorgula: p.canViewCihazSorgula,
          canViewCihazKayit: p.canViewCihazKayit,
          canCreateRecord: p.canCreateRecord,
          canDeleteIkinciEl: p.canDeleteIkinciEl,
          canDeleteServis: p.canDeleteServis,
          canEditServis: p.canEditServis,
          canEditIkinciEl: p.canEditIkinciEl,
          canUpdateServisStatus: p.canUpdateServisStatus,
          canAddDisServis: p.canAddDisServis,
          canDeleteDisServis: p.canDeleteDisServis,
          canEditDisServis: p.canEditDisServis,
          canAddStok: p.canAddStok,
          canDeleteStok: p.canDeleteStok,
          canEditStok: p.canEditStok,
          canAddCari: p.canAddCari,
          canEditCari: p.canEditCari,
          canDeleteCari: p.canDeleteCari,
          canAddBayi: p.canAddBayi,
          canEditBayi: p.canEditBayi,
          canDeleteBayi: p.canDeleteBayi,
          canAddPlan: p.canAddPlan,
          canEditPlan: p.canEditPlan,
          canDeletePlan: p.canDeletePlan,
          canViewCiro: p.canViewCiro,
          canPrintMusteri: p.canPrintMusteri,
          canPrintTeslim: p.canPrintTeslim,
          canPrintEtiket: p.canPrintEtiket,
          canPrintAlimFisi: p.canPrintAlimFisi,
          canPrintSatisFisi: p.canPrintSatisFisi,
          canSellIkinciEl: p.canSellIkinciEl,
        });
      } else {
        setHata("Şifre yanlış, tekrar deneyin");
      }
    } catch {
      setHata("Bir hata oluştu");
    } finally {
      setDogrulanıyor(false);
    }
  }

  if (yukleniyor) {
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

  const secilen = personeller.find((p) => p.id === secilenId);

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
      <div style={{ width: "100%", maxWidth: "400px", padding: "0 16px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827" }}>
            Kim olduğunuzu seçin
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "8px" }}>
            Devam etmek için personel seçin
          </p>
        </div>

        {!secilenId ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {personeller.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => void handleSecim(p)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 16px",
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#374151",
                    flexShrink: 0,
                  }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>
                    {p.name}
                  </p>
                  <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>
                    {p.hasPassword ? "🔒 Şifre gerekli" : "Şifresiz giriş"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#374151",
                }}
              >
                {secilen?.name.charAt(0).toUpperCase()}
              </div>
              <p style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: 0 }}>
                {secilen?.name}
              </p>
            </div>
            <input
              type="password"
              placeholder="Şifrenizi girin"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleSifreDogrula()}
              autoFocus
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {hata && (
              <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "8px" }}>{hata}</p>
            )}
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button
                type="button"
                onClick={() => {
                  setSecilenId(null);
                  setHata("");
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
                Geri
              </button>
              <button
                type="button"
                onClick={() => void handleSifreDogrula()}
                disabled={dogrulanıyor || !sifre}
                style={{
                  flex: 2,
                  padding: "10px",
                  background: "#111827",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                {dogrulanıyor ? "Doğrulanıyor..." : "Giriş Yap"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
