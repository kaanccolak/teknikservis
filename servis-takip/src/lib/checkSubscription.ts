import { prisma } from "@/lib/prisma";
import { getShop } from "@/lib/getShop";
import { NextResponse } from "next/server";

export async function checkSubscription(): Promise<{ error: NextResponse } | null> {
  const shop = await getShop();
  if (!shop) return null;

  // isExempt olanlar her zaman geçer
  if (shop.isExempt) return null;

  // active olanlar geçer
  if (shop.subscriptionStatus === "active") return null;

  // trial olanlar: süresi dolmamışsa geçer
  if (shop.subscriptionStatus === "trial" && shop.trialEndsAt) {
    if (new Date(shop.trialEndsAt) > new Date()) return null;
  }

  // Diğer tüm durumlarda (expired, trial süresi dolmuş) hata dön
  return {
    error: NextResponse.json(
      { error: "Aboneliğiniz sona erdi. Lütfen planınızı yenileyin." },
      { status: 403 }
    ),
  };
}
