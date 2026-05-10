import { getShop } from "@/lib/getShop";
import { sendBaileysMessage } from "@/lib/baileys-client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const shop = await getShop();
  if (!shop) return Response.json({ error: "Shop bulunamadı" }, { status: 401 });

  const { to, message } = await req.json();
  const normalized = to.replace(/\D/g, "");

  const result = await sendBaileysMessage(shop.id, normalized, message);
  return Response.json(result);
}
