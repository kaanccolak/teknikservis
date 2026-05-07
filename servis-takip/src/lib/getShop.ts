import type { Shop } from "@prisma/client";

import { prisma } from "./prisma";
import { createClient } from "./supabase/server";

export async function getShop(): Promise<Shop | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const shop = await prisma.shop.findUnique({
      where: { userId: user.id },
    });

    return shop;
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
