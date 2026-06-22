import { NextRequest, NextResponse } from "next/server";
import { getShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Session kontrolü
    const shop = await getShop();
    if (!shop) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const shopId = shop.id;

    // 2. Body'den plan bilgilerini al
    const { planType, billingCycle } = await req.json();

    // 3. Tutar hesapla
    const PRICES: Record<string, Record<string, number>> = {
      basic:      { monthly: 130, yearly: 1300 },
      premium:    { monthly: 210, yearly: 2100 },
      enterprise: { monthly: 300, yearly: 3000 },
    };

    if (!PRICES[planType] || !PRICES[planType][billingCycle]) {
      return NextResponse.json({ error: "Geçersiz plan veya döngü" }, { status: 400 });
    }

    const amount = PRICES[planType][billingCycle];
    const paymentAmount = amount * 100; // PayTR kuruş formatı

    // 4. Mağaza bilgilerini çek
    const shopDetails = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, name: true, email: true, phone: true, address: true },
    });

    if (!shopDetails) {
      return NextResponse.json({ error: "Mağaza bulunamadı" }, { status: 404 });
    }

    // 5. merchant_oid üret
    const shortId = shopId.slice(0, 6);
    const timestamp = Date.now();
    const merchantOid = `TT${shortId}${timestamp}`;

    // 6. Subscription kaydını pending olarak oluştur
    await prisma.subscription.create({
      data: {
        shopId,
        merchantOid,
        planType,
        billingCycle,
        amount,
        status: "pending",
        testMode: process.env.PAYTR_TEST_MODE === "1",
      },
    });

    // 7. Kullanıcı IP'sini al
    const userIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "1.2.3.4";

    // 8. Sepet içeriği (base64)
    const userBasket = Buffer.from(
      JSON.stringify([[`TamirTakip ${planType} - ${billingCycle === "monthly" ? "Aylık" : "Yıllık"}`, amount.toFixed(2), 1]])
    ).toString("base64");

    // 9. PayTR token hesapla (HMAC-SHA256)
    const merchantId = process.env.PAYTR_MERCHANT_ID!;
    const merchantKey = process.env.PAYTR_MERCHANT_KEY!;
    const merchantSalt = process.env.PAYTR_MERCHANT_SALT!;

    const userEmail = shopDetails.email || "destek@tamirtakip.com.tr";
    const userName = shopDetails.name;
    const userAddress = shopDetails.address || "Türkiye";
    const userPhone = shopDetails.phone || "05000000000";
    const okUrl = `${process.env.NEXT_PUBLIC_APP_URL}/odeme/basarili`;
    const failUrl = `${process.env.NEXT_PUBLIC_APP_URL}/odeme/basarisiz`;
    const noInstallment = 0;
    const maxInstallment = 0;
    const currency = "TL";
    const testMode = process.env.PAYTR_TEST_MODE === "1" ? "1" : "0";
    const lang = "tr";

    const hashStr = `${merchantId}${userIp}${merchantOid}${userEmail}${paymentAmount}${userBasket}${noInstallment}${maxInstallment}${currency}${testMode}`;
    const paytrToken = crypto
      .createHmac("sha256", merchantKey + merchantSalt)
      .update(hashStr)
      .digest("base64");

    // 10. PayTR'a token isteği gönder
    const params = new URLSearchParams({
      merchant_id: merchantId,
      user_ip: userIp,
      merchant_oid: merchantOid,
      email: userEmail,
      payment_amount: paymentAmount.toString(),
      currency,
      user_basket: userBasket,
      no_installment: noInstallment.toString(),
      max_installment: maxInstallment.toString(),
      paytr_token: paytrToken,
      user_name: userName,
      user_address: userAddress,
      user_phone: userPhone,
      merchant_ok_url: okUrl,
      merchant_fail_url: failUrl,
      test_mode: testMode,
      debug_on: "1",
      lang,
      timeout_limit: "30",
    });

    const paytrRes = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      body: params,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const paytrData = await paytrRes.json();

    if (paytrData.status !== "success") {
      // Pending kaydı failed yap
      await prisma.subscription.update({
        where: { merchantOid },
        data: { status: "failed", failReason: paytrData.reason || "PayTR token alınamadı" },
      });
      return NextResponse.json({ error: paytrData.reason || "PayTR token alınamadı" }, { status: 400 });
    }

    // 11. iFrame token'ı dön
    return NextResponse.json({ token: paytrData.token, merchantOid });
  } catch (error) {
    console.error("PayTR get-token error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
