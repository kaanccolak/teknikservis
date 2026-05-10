const BAILEYS_URL = process.env.BAILEYS_API_URL!
const BAILEYS_KEY = process.env.BAILEYS_API_KEY!

const headers = {
  "Content-Type": "application/json",
  "x-api-key": BAILEYS_KEY,
}

export async function connectShopWhatsApp(shopId: string, phone: string) {
  const res = await fetch(`${BAILEYS_URL}/session/connect`, {
    method: "POST",
    headers,
    body: JSON.stringify({ shopId, phone }),
  })
  return res.json()
}

export async function getSessionStatus(shopId: string) {
  const res = await fetch(`${BAILEYS_URL}/session/status/${shopId}`, {
    headers,
  })
  return res.json()
}

export async function sendBaileysMessage(shopId: string, to: string, message: string) {
  const res = await fetch(`${BAILEYS_URL}/message/send`, {
    method: "POST",
    headers,
    body: JSON.stringify({ shopId, to, message }),
  })
  return res.json()
}

export async function disconnectShopWhatsApp(shopId: string) {
  const res = await fetch(`${BAILEYS_URL}/session/disconnect`, {
    method: "POST",
    headers,
    body: JSON.stringify({ shopId }),
  })
  return res.json()
}
