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
export async function getOrCreateDefaultShop() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    let shop = await prisma.shop.findUnique({
      where: { userId: user.id },
    });
    if (shop) {
      setShopCache(shop);
      return shop;
    }

    try {
      shop = await prisma.shop.create({
        data: { name: DEFAULT_SHOP_NAME, userId: user.id },
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

  let shop = await getShop();
  if (shop) {
    return shop;
  }

  try {
    shop = await prisma.shop.create({
      data: { name: DEFAULT_SHOP_NAME },
    });
    setShopCache(shop);
    return shop;
  } catch (createErr) {
    console.error(
      "[getOrCreateDefaultShop] İlk create başarısız, tekrar findFirst deneniyor",
      createErr,
    );
    shop = await prisma.shop.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (shop) {
      setShopCache(shop);
      return shop;
    }
    throw createErr;
  }
}
