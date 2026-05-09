import { prisma } from "./prisma";

function formatE164Tr(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return null;
  if (digits.startsWith("90") && digits.length >= 12) {
    return `+${digits.slice(0, 12)}`;
  }
  if (digits.length === 10 && digits.startsWith("5")) {
    return `+90${digits}`;
  }
  if (digits.startsWith("0") && digits.length === 11 && digits[1] === "5") {
    return `+90${digits.slice(1)}`;
  }
  return `+${digits}`;
}

export async function addContactToGoogle(
  shopId: string,
  customer: { name: string; phone: string },
): Promise<boolean> {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
      },
    });

    if (!shop?.googleAccessToken) return false;

    let accessToken = shop.googleAccessToken;
    if (
      shop.googleTokenExpiry &&
      new Date() >= shop.googleTokenExpiry &&
      shop.googleRefreshToken
    ) {
      const refreshed = await refreshGoogleToken(shopId, shop.googleRefreshToken);
      if (!refreshed) return false;
      accessToken = refreshed;
    }

    const formattedPhone = formatE164Tr(customer.phone);
    if (!formattedPhone) return false;

    const trimmed = customer.name.trim();
    const nameParts = trimmed.split(/\s+/).filter(Boolean);
    const firstName =
      nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : trimmed;
    const lastName =
      nameParts.length > 1 ? (nameParts[nameParts.length - 1] ?? "") : "";

    const url =
      "https://people.googleapis.com/v1/people:createContact?personFields=names,phoneNumbers";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        names: [{ givenName: firstName, familyName: lastName }],
        phoneNumbers: [{ value: formattedPhone, type: "mobile" }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Google Contacts] createContact failed", res.status, errText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Google Contacts error:", error);
    return false;
  }
}

async function refreshGoogleToken(
  shopId: string,
  refreshToken: string,
): Promise<string | null> {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
      }),
    });

    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!data.access_token) return null;

    await prisma.shop.update({
      where: { id: shopId },
      data: {
        googleAccessToken: data.access_token,
        googleTokenExpiry: data.expires_in
          ? new Date(Date.now() + data.expires_in * 1000)
          : null,
      },
    });

    return data.access_token;
  } catch {
    return null;
  }
}
