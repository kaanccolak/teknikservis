import { getShop } from "@/lib/getShop";
import { disconnectShopWhatsApp } from "@/lib/baileys-client";

export const dynamic = "force-dynamic";

export async function POST() {
  const shop = await getShop();
  if (!shop)
    return Response.json({ error: "Shop bulunamadı" }, { status: 401 });

  const result = await disconnectShopWhatsApp(shop.id);
  return Response.json(result);
}
