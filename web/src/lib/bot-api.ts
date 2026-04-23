const BOT_URL = process.env.BOT_API_URL || "http://localhost:3010";
const SECRET  = process.env.BOT_API_SECRET || "dev_secret";

async function call(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BOT_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-api-secret": SECRET,
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Bot API ${res.status}: ${await res.text()}`);
  return res.json();
}

export const botApi = {
  saveCredentials: (tenantId: string, phoneNumberId: string, accessToken: string, wabaId?: string) =>
    call(`/api/sessions/${tenantId}/credentials`, {
      method: "POST",
      body: JSON.stringify({ phoneNumberId, accessToken, wabaId }),
    }),

  disconnect: (tenantId: string) =>
    call(`/api/sessions/${tenantId}/disconnect`, { method: "POST" }),

  getSession: (tenantId: string) =>
    call(`/api/sessions/${tenantId}`),

  sendMessage: (tenantId: string, to: string, message: string) =>
    call(`/api/sessions/${tenantId}/send`, {
      method: "POST",
      body: JSON.stringify({ to, message }),
    }),

  dispatchOrder: (tenantId: string, orderId: string) =>
    call(`/api/sessions/${tenantId}/orders/${orderId}/dispatch`, {
      method: "POST",
    }),
};
