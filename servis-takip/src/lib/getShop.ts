import type { Shop } from "@prisma/client";

import { prisma } from "./prisma";
import { createClient } from "./supabase/server";

export type ShopWithDemo = Shop & { isDemo: boolean };

export async function getShop(): Promise<ShopWithDemo | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const shop = await prisma.shop.findUnique({
      where: { userId: user.id },
    });

    if (!shop) return null;

    return {
      ...shop,
      isDemo: user.email === "demo@demo.tr",
    };
  } catch {
    return null;
  }
}

/** Önbellek kaldırıldı; `default-shop` uyumluluğu için no-op. */
export function setShopCache(shop: Shop): void {
  void shop;
}

export function invalidateShopCache() {
  // Artık kullanılmıyor
}
