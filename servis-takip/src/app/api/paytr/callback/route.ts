import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);

    const merchantOid   = params.get("merchant_oid") || "";
    const status        = params.get("status") || "";
    const totalAmount   = params.get("total_amount") || "";
    const hash          = params.get("hash") || "";
    const failReasonCode = params.get("failed_reason_code") || "";
    const failReasonMsg  = params.get("failed_reason_msg") || "";
    const testMode      = params.get("test_mode") === "1";
    const _paymentType   = params.get("payment_type") || "";
    const _currency      = params.get("currency") || "";
    const _paymentAmount = params.get("payment_amount") || "";

    // 1. Hash doğrulama
    const merchantKey  = process.env.PAYTR_MERCHANT_KEY!;
    const merchantSalt = process.env.PAYTR_MERCHANT_SALT!;

    const hashStr = `${merchantOid}${merchantSalt}${status}${totalAmount}`;
    const expectedHash = crypto
      .createHmac("sha256", merchantKey)
      .update(hashStr)
      .digest("base64");

    if (hash !== expectedHash) {
      console.error("PayTR callback hash doğrulama başarısız:", { merchantOid });
      return new NextResponse("HASH_MISMATCH", { status: 400 });
    }

    // 2. Subscription kaydını bul
    const subscription = await prisma.subscription.findUnique({
      where: { merchantOid },
    });

    if (!subscription) {
      console.error("PayTR callback: subscription bulunamadı:", merchantOid);
      // Yine de OK dön, PayTR tekrar denemesin
      return new NextResponse("OK", { status: 200 });
    }

    // 3. Tekrarlayan bildirim kontrolü — zaten işlendiyse sadece OK dön
    if (subscription.status !== "pending") {
      return new NextResponse("OK", { status: 200 });
    }

    if (status === "success") {
      // 4a. Abonelik süresini hesapla
      const now = new Date();
      const endsAt = new Date(now);
      if (subscription.billingCycle === "yearly") {
        endsAt.setFullYear(endsAt.getFullYear() + 1);
      } else {
        endsAt.setDate(endsAt.getDate() + 30);
      }

      // 4b. Subscription güncelle
      await prisma.subscription.update({
        where: { merchantOid },
        data: {
          status: "success",
          paytrStatus: status,
          startsAt: now,
          endsAt,
          testMode,
        },
      });

      // 4c. Shop güncelle
      await prisma.shop.update({
        where: { id: subscription.shopId },
        data: {
          planType: subscription.planType,
          subscriptionStatus: "active",
          planStartedAt: now,
          trialEndsAt: endsAt,
        },
      });

    } else {
      // 5. Başarısız ödeme
      await prisma.subscription.update({
        where: { merchantOid },
        data: {
          status: "failed",
          paytrStatus: status,
          failReason: `[${failReasonCode}] ${failReasonMsg}`,
          testMode,
        },
      });
    }

    // 6. PayTR'a OK dön — kesinlikle başka içerik olmamalı
    return new NextResponse("OK", { status: 200 });

  } catch (error) {
    console.error("PayTR callback error:", error);
    // Hata olsa bile OK dönmeyelim, PayTR tekrar denesin
    return new NextResponse("ERROR", { status: 500 });
  }
}
