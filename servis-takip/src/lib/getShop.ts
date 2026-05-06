import type { Shop } from "@prisma/client";

import { prisma } from "./prisma";

let cachedShop: Shop | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000;

export async function getShop(): Promise<Shop | null> {
  const now = Date.now();
  if (cachedShop && now - cacheTime < CACHE_TTL) {
    return cachedShop;
  }
  const shop = await prisma.shop.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (shop) {
    cachedShop = shop;
    cacheTime = now;
  }
  return shop;
}

/** Yeni oluşturulan dükkanı önbelleğe yazar (getOrCreateDefaultShop sonrası). */
export function setShopCache(shop: Shop): void {
  cachedShop = shop;
  cacheTime = Date.now();
}

export function invalidateShopCache(): void {
  cachedShop = null;
  cacheTime = 0;
}
