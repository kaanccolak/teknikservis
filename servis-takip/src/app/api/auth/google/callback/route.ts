import { NextResponse } from "next/server";

import { getShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
      return NextResponse.redirect(
        new URL("/sirketim?googleError=true", req.url),
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      console.error("Google OAuth: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET eksik");
      return NextResponse.redirect(
        new URL("/sirketim?googleError=true", req.url),
      );
    }

    const appBase =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      new URL(req.url).origin;
    const redirectUri = `${appBase}/api/auth/google/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = (await tokenRes.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
    };

    if (!tokens.access_token) {
      console.error("Google OAuth token response:", tokens);
      return NextResponse.redirect(
        new URL("/sirketim?googleError=true", req.url),
      );
    }

    const shop = await getShop();
    if (!shop) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token ?? shop.googleRefreshToken,
        googleTokenExpiry: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
      },
    });

    return NextResponse.redirect(
      new URL("/sirketim?googleSuccess=true", req.url),
    );
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(
      new URL("/sirketim?googleError=true", req.url),
    );
  }
}
