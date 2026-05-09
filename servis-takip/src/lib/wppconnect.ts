/**
 * WPPConnect REST sunucusu istemcisi.
 *
 * Sunucu URL'i `WPPCONNECT_URL` (örn. `http://localhost:21465`),
 * paylaşılan secret ise `WPPCONNECT_SECRET` ile gelir.
 *
 * Her dükkan için `Shop.id` değerini `session` adı olarak kullanırız.
 */

const WPPCONNECT_URL = (process.env.WPPCONNECT_URL ?? "").replace(/\/+$/, "");
const SECRET_KEY = process.env.WPPCONNECT_SECRET || "THISISMYSECURETOKEN";

function isConfigured(): boolean {
  return Boolean(WPPCONNECT_URL);
}

/** Token al (POST /api/{session}/{secret}/generate-token) */
async function getToken(session: string): Promise<string | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(
      `${WPPCONNECT_URL}/api/${encodeURIComponent(session)}/${encodeURIComponent(
        SECRET_KEY,
      )}/generate-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: string; full?: string };
    return data.token || data.full || null;
  } catch {
    return null;
  }
}

/** Session başlat (POST /api/{session}/start-session) — QR kod akışı */
export async function startSession(session: string): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    const token = await getToken(session);
    if (!token) return false;

    const res = await fetch(
      `${WPPCONNECT_URL}/api/${encodeURIComponent(session)}/start-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          webhook: null,
          waitForLogin: true,
          qrCodeData: true,
        }),
        cache: "no-store",
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

/** Telefon kodu (link code) ile oturum başlat — POST /api/{session}/start-session
 *  WPPConnect 1.x: `linkCode: true` ve `phone` parametreleri ile pairing-code akışı.
 *  Cevap olarak bağlantı kodu döndüğünde onu da çıkarmaya çalışırız. */
export async function startSessionWithPhoneCode(
  session: string,
  phone: string,
): Promise<{ ok: boolean; linkCode: string | null }> {
  if (!isConfigured()) return { ok: false, linkCode: null };
  try {
    const token = await getToken(session);
    if (!token) return { ok: false, linkCode: null };

    const digits = (phone ?? "").replace(/\D/g, "");
    if (!digits) return { ok: false, linkCode: null };
    const formatted = digits.startsWith("90") ? digits : `90${digits.slice(-10)}`;

    const res = await fetch(
      `${WPPCONNECT_URL}/api/${encodeURIComponent(session)}/start-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: formatted,
          qrCodeData: false,
          useChrome: false,
          linkCode: true,
          webhook: null,
          waitForLogin: false,
        }),
        cache: "no-store",
      },
    );

    let linkCode: string | null = null;
    try {
      const data = (await res.clone().json()) as {
        linkCode?: string;
        phoneCode?: string;
        pairingCode?: string;
        code?: string;
        urlcode?: string;
        response?: {
          linkCode?: string;
          phoneCode?: string;
          pairingCode?: string;
          code?: string;
        };
      };
      linkCode =
        data.linkCode ||
        data.phoneCode ||
        data.pairingCode ||
        data.code ||
        data.response?.linkCode ||
        data.response?.phoneCode ||
        data.response?.pairingCode ||
        data.response?.code ||
        null;
    } catch {
      linkCode = null;
    }

    return { ok: res.ok, linkCode };
  } catch {
    return { ok: false, linkCode: null };
  }
}

/** QR kod (data URL / base64) — GET /api/{session}/qrcode-session */
export async function getQRCode(session: string): Promise<string | null> {
  if (!isConfigured()) return null;
  try {
    const token = await getToken(session);
    if (!token) return null;

    const res = await fetch(
      `${WPPCONNECT_URL}/api/${encodeURIComponent(session)}/qrcode-session`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;

    const ct = res.headers.get("content-type") ?? "";
    if (ct.startsWith("application/json")) {
      const data = (await res.json()) as {
        qrcode?: string;
        base64Qr?: string;
        urlcode?: string;
      };
      const raw = data.qrcode || data.base64Qr || null;
      if (!raw) return null;
      return raw.startsWith("data:") ? raw : `data:image/png;base64,${raw}`;
    }

    if (ct.startsWith("image/")) {
      const buf = await res.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      return `data:${ct};base64,${b64}`;
    }

    return null;
  } catch {
    return null;
  }
}

/** Session durumu — GET /api/{session}/status-session
 * Olası dönüşler: `CLOSED`, `INITIALIZING`, `QRCODE`, `CONNECTED`, ...
 */
export async function getSessionStatus(session: string): Promise<string> {
  if (!isConfigured()) return "CLOSED";
  try {
    const token = await getToken(session);
    if (!token) return "CLOSED";

    const res = await fetch(
      `${WPPCONNECT_URL}/api/${encodeURIComponent(session)}/status-session`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!res.ok) return "CLOSED";
    const data = (await res.json()) as { status?: string; state?: string };
    return data.status || data.state || "CLOSED";
  } catch {
    return "CLOSED";
  }
}

/** qrcode-session yanıtında pairing kodu varsa döndürür.
 *  Link-code modunda bu endpoint base64 QR yerine 8 haneli kodu döndürür
 *  (bazı sürümler `qrcode`, bazıları `code` / `pairingCode` alanını kullanır).
 *  Başlatıldıktan kısa süre sonra çağrılmalıdır.
 */
export async function getPairingCodeFromQr(
  session: string,
): Promise<string | null> {
  if (!isConfigured()) return null;
  try {
    const token = await getToken(session);
    if (!token) return null;

    const res = await fetch(
      `${WPPCONNECT_URL}/api/${encodeURIComponent(session)}/qrcode-session`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;

    const ct = res.headers.get("content-type") ?? "";
    if (!ct.startsWith("application/json")) {
      // image/png döndüyse bu QR-mode; pairing kodu değil
      return null;
    }

    const data = (await res.json()) as {
      qrcode?: string;
      code?: string;
      pairingCode?: string;
      linkCode?: string;
      phoneCode?: string;
      base64Qr?: string;
      response?: {
        qrcode?: string;
        code?: string;
        pairingCode?: string;
        linkCode?: string;
        phoneCode?: string;
      };
    };

    const candidates = [
      data.code,
      data.pairingCode,
      data.linkCode,
      data.phoneCode,
      data.response?.code,
      data.response?.pairingCode,
      data.response?.linkCode,
      data.response?.phoneCode,
      data.qrcode,
      data.response?.qrcode,
    ];

    for (const c of candidates) {
      if (typeof c !== "string") continue;
      const trimmed = c.trim();
      if (!trimmed) continue;
      // Base64 QR ya da data URL (uzun) — kod değil; atla
      if (trimmed.startsWith("data:")) continue;
      if (trimmed.length > 16) continue;
      return trimmed;
    }
    return null;
  } catch {
    return null;
  }
}

/** status-session yanıtında pairing kodu varsa döndürür (start-session geç dönerse fallback) */
export async function getPairingCodeFromStatus(
  session: string,
): Promise<string | null> {
  if (!isConfigured()) return null;
  try {
    const token = await getToken(session);
    if (!token) return null;

    const res = await fetch(
      `${WPPCONNECT_URL}/api/${encodeURIComponent(session)}/status-session`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      code?: string;
      linkCode?: string;
      pairingCode?: string;
      phoneCode?: string;
      qrcode?: string;
      response?: {
        code?: string;
        linkCode?: string;
        pairingCode?: string;
        phoneCode?: string;
      };
    };
    return (
      data.code ||
      data.linkCode ||
      data.pairingCode ||
      data.phoneCode ||
      data.response?.code ||
      data.response?.linkCode ||
      data.response?.pairingCode ||
      data.response?.phoneCode ||
      null
    );
  } catch {
    return null;
  }
}

/** Bağlı oturumun WhatsApp profil bilgisi — GET /api/{session}/check-connection-session
 *  Bazı sürümlerde `host-device` da kullanılabilir; ikisini de deneriz.
 */
export async function getConnectedPhone(
  session: string,
): Promise<string | null> {
  if (!isConfigured()) return null;
  try {
    const token = await getToken(session);
    if (!token) return null;

    const tryUrls = [
      `${WPPCONNECT_URL}/api/${encodeURIComponent(session)}/host-device`,
      `${WPPCONNECT_URL}/api/${encodeURIComponent(session)}/check-connection-session`,
    ];
    for (const url of tryUrls) {
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) continue;
        const data = (await res.json()) as {
          response?: {
            id?: { user?: string; _serialized?: string };
            wid?: { user?: string; _serialized?: string };
            phone?: string;
          };
          phone?: string;
        };
        const r = data.response ?? data;
        const candidates = [
          (r as { phone?: string })?.phone,
          (r as { id?: { user?: string } })?.id?.user,
          (r as { wid?: { user?: string } })?.wid?.user,
          (r as { id?: { _serialized?: string } })?.id?._serialized,
          (r as { wid?: { _serialized?: string } })?.wid?._serialized,
        ];
        for (const c of candidates) {
          if (typeof c === "string" && c.trim()) {
            return c.replace(/@.*$/, "").replace(/\D/g, "") || null;
          }
        }
      } catch {
        // bir sonraki URL'i dene
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Mesaj gönder — POST /api/{session}/send-message */
export async function sendWppMessage(
  session: string,
  phone: string,
  message: string,
): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    const token = await getToken(session);
    if (!token) return false;

    const digits = (phone ?? "").replace(/\D/g, "");
    if (!digits) return false;
    const formatted = digits.startsWith("90") ? digits : `90${digits.slice(-10)}`;

    const res = await fetch(
      `${WPPCONNECT_URL}/api/${encodeURIComponent(session)}/send-message`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: `${formatted}@c.us`,
          message,
          isGroup: false,
          isNewsletter: false,
        }),
        cache: "no-store",
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

/** Session kapat — POST /api/{session}/close-session */
export async function closeSession(session: string): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    const token = await getToken(session);
    if (!token) return false;

    const res = await fetch(
      `${WPPCONNECT_URL}/api/${encodeURIComponent(session)}/close-session`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export const WPP_CONFIGURED = isConfigured;
