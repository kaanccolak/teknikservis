"use client";
import { useEffect, useState } from "react";

type YetkiKey =
  | "canViewCihazKayit" | "canViewCihazSorgula" | "canViewBekleyen"
  | "canViewIkinciEl" | "canViewDisServis" | "canViewStok"
  | "canViewCari" | "canViewBayiler" | "canViewPlanlarim"
  | "canViewRaporlar" | "canViewSirketim" | "canViewIsEmirleri"
  | "canCreateRecord" | "canDeleteIkinciEl" | "canDeleteServis"
  | "canEditServis" | "canEditIkinciEl" | "canUpdateServisStatus"
  | "canAddDisServis" | "canDeleteDisServis" | "canEditDisServis"
  | "canAddStok" | "canDeleteStok" | "canEditStok"
  | "canAddCari" | "canEditCari" | "canDeleteCari"
  | "canAddBayi" | "canEditBayi" | "canDeleteBayi"
  | "canAddPlan" | "canEditPlan" | "canDeletePlan"
  | "canViewCiro" | "canPrintMusteri" | "canPrintTeslim"
  | "canPrintEtiket" | "canPrintAlimFisi" | "canPrintSatisFisi"
  | "canSellIkinciEl"
  | "canAssignPersonnel";

export function usePersonelYetki() {
  const [yetkiler, setYetkiler] = useState<Record<string, boolean>>({});
  const [isAdmin, setIsAdmin] = useState(true);
  const [yuklendi, setYuklendi] = useState(false);

  useEffect(() => {
    const isAdminRaw = sessionStorage.getItem("activePersonnelIsAdmin");
    const adminMi = isAdminRaw === null || isAdminRaw === "true";
    setIsAdmin(adminMi);

    if (!adminMi) {
      const permsRaw = sessionStorage.getItem("activePersonnelPermissions");
      if (permsRaw) {
        try {
          setYetkiler(JSON.parse(permsRaw) as Record<string, boolean>);
        } catch {
          setYetkiler({});
        }
      }
    }
    setYuklendi(true);
  }, []);

  function yetkiVar(key: YetkiKey): boolean {
    if (isAdmin) return true; // admin her şeyi yapabilir
    return !!yetkiler[key];
  }

  return { yetkiVar, isAdmin, yuklendi };
}
