const GRAPH = 'https://graph.facebook.com/v20.0';

/**
 * Envía un mensaje de texto via Meta Cloud API.
 */
export async function sendTextMessage(phoneNumberId, accessToken, to, text) {
  const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text, preview_url: false },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meta API error (${res.status}): ${err}`);
  }
  return res.json();
}

/**
 * Verifica que las credenciales sean válidas consultando el número de teléfono.
 */
export async function verifyCredentials(phoneNumberId, accessToken) {
  const res = await fetch(`${GRAPH}/${phoneNumberId}?fields=display_phone_number,verified_name`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}
