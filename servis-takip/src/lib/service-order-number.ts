import type { PrismaClient } from "@prisma/client";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

/** YYYYMM (örn. 202605) — ay değişince sıra sıfırlanır. */
export function serviceOrderMonthPrefix(ref = new Date()): string {
  return `${ref.getFullYear()}${String(ref.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Aynı ay önekine sahip kayıtların son ekini sayısal olarak artırır (string sıralama hatası olmaz).
 */
export async function allocateServiceOrderNumber(
  tx: Tx,
  shopId: string,
  ref = new Date(),
): Promise<string> {
  const prefix = serviceOrderMonthPrefix(ref);
  const rows = await tx.serviceOrder.findMany({
    where: {
      orderNumber: { startsWith: prefix },
      shopId,
      deletedAt: null,
    },
    select: { orderNumber: true },
  });
  let maxSeq = 0;
  for (const { orderNumber } of rows) {
    if (orderNumber == null || !orderNumber.startsWith(prefix)) continue;
    const seq = parseInt(orderNumber.slice(prefix.length), 10);
    if (!Number.isNaN(seq)) maxSeq = Math.max(maxSeq, seq);
  }
  const next = maxSeq + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

/** Listelerde gösterim (ileride eski kayıt olursa id yedek). */
export function formatServiceOrderNo(order: {
  orderNumber: string | null;
  id: string;
}): string {
  return order.orderNumber ?? order.id;
}
