import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { SERVICE_ORDER_DELIVERED_STATUSES } from "@/lib/service-order-status";
import { trPhoneDigitsOnly, trPhoneMatchKey } from "@/lib/tr-phone";

export const dynamic = "force-dynamic";

const VERIFY_TOKEN =
  process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "servis-takip-webhook";

const DELIVERED_LIST = [...SERVICE_ORDER_DELIVERED_STATUSES];

// Meta webhook doğrulama (GET)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// Gelen mesajları al (POST)
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            metadata?: { phone_number_id?: string };
            messages?: Array<{
              from?: string;
              type?: string;
              text?: { body?: string };
              timestamp?: string;
            }>;
          };
        }>;
      }>;
    };

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages?.length) {
      return NextResponse.json({ status: "ok" });
    }

    const phoneNumberId = value.metadata?.phone_number_id?.trim();
    const shop = phoneNumberId
      ? await prisma.shop.findFirst({
          where: { waPhoneNumberId: phoneNumberId },
        })
      : null;

    if (!shop) {
      console.warn(
        "[whatsapp/webhook] Shop bulunamadı (waPhoneNumberId eşleşmedi veya metadata yok)",
        phoneNumberId ?? "(yok)",
      );
      return NextResponse.json({ status: "ok" });
    }

    const message = value.messages[0];
    const fromRaw = message.from ?? "";
    const phoneDigits = trPhoneDigitsOnly(fromRaw);
    const nationalKey = trPhoneMatchKey(fromRaw);

    const messageText =
      message.type === "text"
        ? (message.text?.body ?? "")
        : "[Metin dışı mesaj]";

    const tsRaw = message.timestamp;
    const timestamp = tsRaw
      ? new Date(Number.parseInt(tsRaw, 10) * 1000)
      : new Date();

    const customer =
      nationalKey.length >= 3
        ? await prisma.customer.findFirst({
            where: {
              shopId: shop.id,
              OR: [
                { phoneDigits: { contains: nationalKey } },
                { phoneDigits: { endsWith: nationalKey.slice(-10) } },
              ],
            },
            include: {
              orders: {
                where: {
                  status: { notIn: DELIVERED_LIST },
                },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          })
        : null;

    const openOrder = customer?.orders?.[0];

    await prisma.whatsAppMessage.create({
      data: {
        shopId: shop.id,
        from: phoneDigits || fromRaw,
        message: messageText || "[Boş]",
        timestamp,
        customerName: customer ? customer.name : null,
        serviceOrderId: openOrder?.id ?? null,
        isRead: false,
      },
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
