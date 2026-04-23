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
 * Envía un mensaje interactivo (botones o lista) via Meta Cloud API.
 */
export async function sendInteractiveMessage(phoneNumberId, accessToken, to, interactivePayload) {
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
      type: 'interactive',
      interactive: interactivePayload,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meta API error (${res.status}): ${err}`);
  }
  return res.json();
}

/**
 * Obtiene la URL de un archivo multimedia (imagen, audio, etc.) desde Meta.
 */
export async function getMediaUrl(accessToken, mediaId) {
  const res = await fetch(`${GRAPH}/${mediaId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.url;
}

/**
 * Verifica que las credenciales sean válidas consultando el número de teléfono.
 */
export async function verifyCredentials(phoneNumberId, accessToken) {
  const res = await fetch(`${GRAPH}/${phoneNumberId}?fields=display_phone_number,verified_name`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    console.error('❌ Meta Verification Failed:', JSON.stringify(errData, null, 2));
    return null;
  }
  return res.json();
}
