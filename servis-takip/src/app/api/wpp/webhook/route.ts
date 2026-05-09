import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { SERVICE_ORDER_DELIVERED_STATUSES } from "@/lib/service-order-status";
import { trPhoneDigitsOnly, trPhoneMatchKey } from "@/lib/tr-phone";

export const dynamic = "force-dynamic";

const DELIVERED_LIST = [...SERVICE_ORDER_DELIVERED_STATUSES];

/**
 * WPPConnect webhook payload örnekleri (şirket sürümüne göre değişebilir):
 *
 *  {
 *    "session": "shop_id",
 *    "event": "onmessage",
 *    "from": "905551234567@c.us",
 *    "body": "Onaylıyorum",
 *    "isGroupMsg": false,
 *    "fromMe": false,
 *    "timestamp": 1715300000
 *  }
 *
 * Bazı sürümler `data: { from, body, t, fromMe, isGroupMsg }` zarfı kullanır;
 * her ikisini de güvenli okuruz.
 */
type WppMessagePayload = {
  session?: string;
  event?: string;
  from?: string;
  body?: string;
  message?: string;
  isGroupMsg?: boolean;
  fromMe?: boolean;
  timestamp?: number | string;
  t?: number | string;
  data?: {
    session?: string;
    from?: string;
    body?: string;
    isGroupMsg?: boolean;
    fromMe?: boolean;
    t?: number | string;
    timestamp?: number | string;
    sender?: { id?: string; pushname?: string };
  };
  sender?: { id?: string; pushname?: string };
};

function pickStr(...vals: Array<unknown>): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function pickBool(...vals: Array<unknown>): boolean {
  for (const v of vals) {
    if (typeof v === "boolean") return v;
  }
  return false;
}

function pickNum(...vals: Array<unknown>): number | null {
  for (const v of vals) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | WppMessagePayload
      | null;
    if (!body) {
      return NextResponse.json({ status: "ok" });
    }

    const sessionRaw = pickStr(body.session, body.data?.session);
    const event = pickStr(body.event);
    if (event && event !== "onmessage" && event !== "message") {
      // status / acks / qrcode olayları kayda geçmesin
      return NextResponse.json({ status: "ok" });
    }

    const fromRaw = pickStr(body.from, body.data?.from, body.sender?.id);
    const messageText =
      pickStr(body.body, body.message, body.data?.body) || "[Boş]";
    const isGroup = pickBool(body.isGroupMsg, body.data?.isGroupMsg);
    const fromMe = pickBool(body.fromMe, body.data?.fromMe);
    const tsRaw = pickNum(body.timestamp, body.t, body.data?.t, body.data?.timestamp);

    if (!fromRaw || isGroup || fromMe) {
      return NextResponse.json({ status: "ok" });
    }

    // session, Shop.id (ya da Shop.wppSession) ile eşlenir
    const shop = sessionRaw
      ? await prisma.shop.findFirst({
          where: {
            OR: [{ id: sessionRaw }, { wppSession: sessionRaw }],
          },
        })
      : null;

    if (!shop) {
      console.warn(
        "[wpp/webhook] Shop bulunamadı (session eşleşmedi)",
        sessionRaw || "(yok)",
      );
      return NextResponse.json({ status: "ok" });
    }

    const phoneDigits = trPhoneDigitsOnly(fromRaw);
    const nationalKey = trPhoneMatchKey(fromRaw);
    const timestamp =
      tsRaw != null ? new Date(tsRaw * 1000) : new Date();

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
                where: { status: { notIn: DELIVERED_LIST } },
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
        message: messageText,
        timestamp,
        customerName: customer ? customer.name : null,
        serviceOrderId: openOrder?.id ?? null,
        isRead: false,
      },
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[wpp/webhook] error", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
