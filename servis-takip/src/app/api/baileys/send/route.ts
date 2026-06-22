import { getShop } from "@/lib/getShop";
import { sendBaileysMessage } from "@/lib/baileys-client";
import { checkSubscription } from "@/lib/checkSubscription";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const shop = await getShop();
  if (!shop) return Response.json({ error: "Shop bulunamadı" }, { status: 401 });

  const subCheck = await checkSubscription();
  if (subCheck) return subCheck.error;

  const { to, message } = await req.json();
  const normalized = to.replace(/\D/g, "");

  const result = await sendBaileysMessage(shop.id, normalized, message);
  return Response.json(result);
}
