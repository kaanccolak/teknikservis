import type { Shop } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getShop, setShopCache } from "@/lib/getShop";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

// Supabase transaction pooler kullanıyorsanız DATABASE_URL sonuna
// ?pgbouncer=true eklemek Prisma hatalarını önleyebilir.

/** Tüm API route'larında kullanılan varsayılan dükkan adı */
export const DEFAULT_SHOP_NAME = "Varsayılan Dükkan";

/**
 * 1) Veritabanındaki ilk Shop kaydını döndürür (createdAt'e göre).
 * 2) Yoksa DEFAULT_SHOP_NAME ile oluşturur.
 * Supabase pooler ile uyum için shop oluşturma tek bir `create` ile yapılır
 * (interactive transaction kullanılmaz).
 */
export async function getOrCreateDefaultShop(): Promise<Shop> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email === "kaanccolak@gmail.com") {
    throw new Error("Admin kullanıcısı için dükkan oluşturulamaz");
  }

  if (user?.id) {
    let shop = await prisma.shop.findUnique({
      where: { userId: user.id },
    });
    if (shop) {
      setShopCache(shop);
      return shop;
    }

    try {
      const shopName =
        typeof user.user_metadata?.shop_name === "string" &&
        user.user_metadata.shop_name.trim().length >= 2
          ? user.user_metadata.shop_name.trim()
          : DEFAULT_SHOP_NAME;

      shop = await prisma.shop.create({
        data: {
          name: shopName,
          userId: user.id,
          planType: "trial",
          subscriptionStatus: "trial",
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      setShopCache(shop);
      return shop;
    } catch (createErr) {
      console.error(
        "[getOrCreateDefaultShop] Kullanıcı dükkanı oluşturulamadı, tekrar deneniyor",
        createErr,
      );
      shop = await prisma.shop.findUnique({
        where: { userId: user.id },
      });
      if (shop) {
        setShopCache(shop);
        return shop;
      }
      throw createErr;
    }
  }

  const shopWithDemo = await getShop();
  if (shopWithDemo) {
    const { isDemo, ...plainShop } = shopWithDemo;
    void isDemo;
    setShopCache(plainShop);
    return plainShop;
  }

  try {
    const created = await prisma.shop.create({
      data: {
        name: DEFAULT_SHOP_NAME,
        planType: "trial",
        subscriptionStatus: "trial",
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    setShopCache(created);
    return created;
  } catch (createErr) {
    console.error(
      "[getOrCreateDefaultShop] İlk create başarısız, tekrar findFirst deneniyor",
      createErr,
    );
    const recovered = await prisma.shop.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (recovered) {
      setShopCache(recovered);
      return recovered;
    }
    throw createErr;
  }
}
