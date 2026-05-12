import { demoGuard } from "@/lib/demo-guard";
import { getShop } from "@/lib/getShop";
import { connectShopWhatsApp } from "@/lib/baileys-client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const guard = await demoGuard();
  if (guard) return guard;

  const shop = await getShop();
  if (!shop) return Response.json({ error: "Shop bulunamadı" }, { status: 401 });

  const { phone } = await req.json();
  const normalized = phone.replace(/\D/g, "");

  const result = await connectShopWhatsApp(shop.id, normalized);
  return Response.json(result);
}
