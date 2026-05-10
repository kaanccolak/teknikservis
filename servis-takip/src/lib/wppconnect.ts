/**
 * Baileys REST sunucusu istemcisi.
 *
 * Sunucu URL'i `WPPCONNECT_URL` (örn. `https://baileys.up.railway.app`),
 * paylaşılan secret ise `WPPCONNECT_SECRET` ile gelir.
 *
 * Token üretim akışı yok — her istek `Authorization: Bearer ${SECRET}` ile gider.
 * Her dükkan için `Shop.id` değerini `sessionId` olarak kullanırız.
 */

const WPPCONNECT_URL = (process.env.WPPCONNECT_URL ?? "").replace(/\/+$/, "");
const SECRET_KEY = process.env.WPPCONNECT_SECRET || "servis-takip-secret";

function isConfigured(): boolean {
  return Boolean(WPPCONNECT_URL);
}

const headers: Record<string, string> = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SECRET_KEY}`,
};

export type WppSessionStatus = {
  status: string;
  connected: boolean;
  phone: string | null;
};

/** Session başlat — POST /session/start */
export async function startSession(sessionId: string): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    const res = await fetch(`${WPPCONNECT_URL}/session/start`, {
      method: "POST",
      headers,
      body: JSON.stringify({ sessionId }),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** QR kod (base64 data URL) — GET /session/:sessionId/qr */
export async function getQRCode(sessionId: string): Promise<string | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(
      `${WPPCONNECT_URL}/session/${encodeURIComponent(sessionId)}/qr`,
      {
        headers,
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { qr?: string };
    return data.qr || null;
  } catch {
    return null;
  }
}

/** Session durumu — GET /session/:sessionId/status */
export async function getSessionStatus(
  sessionId: string,
): Promise<WppSessionStatus> {
  if (!isConfigured()) {
    return { status: "CLOSED", connected: false, phone: null };
  }
  try {
    const res = await fetch(
      `${WPPCONNECT_URL}/session/${encodeURIComponent(sessionId)}/status`,
      {
        headers,
        cache: "no-store",
      },
    );
    if (!res.ok) {
      return { status: "CLOSED", connected: false, phone: null };
    }
    const data = (await res.json()) as Partial<WppSessionStatus>;
    return {
      status: typeof data.status === "string" ? data.status : "CLOSED",
      connected: Boolean(data.connected),
      phone: typeof data.phone === "string" ? data.phone : null,
    };
  } catch {
    return { status: "CLOSED", connected: false, phone: null };
  }
}

/** Mesaj gönder — POST /session/:sessionId/send */
export async function sendWppMessage(
  sessionId: string,
  phone: string,
  message: string,
): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    const digits = (phone ?? "").replace(/\D/g, "");
    if (!digits) return false;
    const formatted = digits.startsWith("90") ? digits : `90${digits.slice(-10)}`;

    const res = await fetch(
      `${WPPCONNECT_URL}/session/${encodeURIComponent(sessionId)}/send`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ phone: formatted, message }),
        cache: "no-store",
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

/** Session kapat — DELETE /session/:sessionId */
export async function closeSession(sessionId: string): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    const res = await fetch(
      `${WPPCONNECT_URL}/session/${encodeURIComponent(sessionId)}`,
      {
        method: "DELETE",
        headers,
        cache: "no-store",
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export const WPP_CONFIGURED = isConfigured;
