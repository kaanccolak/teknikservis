"use client";
import { useEffect, useState } from "react";

// Beta döneminde false — canlıya alınca true yapılacak
const KISITLAMALAR_AKTIF = false;

type PlanType = "trial" | "basic" | "premium" | "enterprise";

export function usePlanKisit() {
  const [planType, setPlanType] = useState<PlanType>("trial");
  const [yuklendi, setYuklendi] = useState(false);

  useEffect(() => {
    fetch("/api/shop")
      .then((r) => r.json())
      .then((data: { planType?: string }) => {
        setPlanType((data.planType as PlanType) ?? "trial");
      })
      .catch(() => {})
      .finally(() => setYuklendi(true));
  }, []);

  function kisitVar(ozellik: string): boolean {
    // Beta döneminde hiçbir kısıtlama yok
    if (!KISITLAMALAR_AKTIF) return false;
    if (planType === "trial" || planType === "enterprise") return false;

    const basicKisitlari = [
      "stok",
      "raporlar",
      "ciro",
      "personel",
      "is-emirleri",
      "google-contacts",
      "yapay-zeka",
    ];

    const premiumKisitlari = [
      "is-emirleri",
    ];

    if (planType === "basic") return basicKisitlari.includes(ozellik);
    if (planType === "premium") return premiumKisitlari.includes(ozellik);

    return false;
  }

  function planYeterli(gereken: PlanType): boolean {
    if (!KISITLAMALAR_AKTIF) return true;
    const siralama: PlanType[] = ["trial", "basic", "premium", "enterprise"];
    return siralama.indexOf(planType) >= siralama.indexOf(gereken);
  }

  return { planType, kisitVar, planYeterli, yuklendi };
}
