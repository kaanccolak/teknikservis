import { getShop } from "@/lib/getShop";
import { getSessionStatus } from "@/lib/baileys-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const shop = await getShop();
  if (!shop) return Response.json({ error: "Shop bulunamadı" }, { status: 401 });

  const result = await getSessionStatus(shop.id);
  return Response.json(result);
}
