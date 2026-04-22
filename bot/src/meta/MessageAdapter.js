import { sendTextMessage, getMediaUrl, sendInteractiveMessage } from './client.js';

/**
 * Adapta el payload de Meta Cloud API a la interfaz que usan
 * los flujos existentes (message.reply, message.client.sendMessage, etc.)
 * sin modificar ningún flow handler.
 */
export class MetaMessage {
  constructor({ from, body, type, phoneNumberId, accessToken, mediaId, location }) { // Ya está correcto
    this.from = from;          // número sin @c.us
    this.fromMe = false;
    this.body = body || '';
    this.type = type || 'text';
    this.hasMedia = ['audio', 'image', 'video', 'document', 'ptt'].includes(type);
    this.mediaId = mediaId;
    this.location = location; // { latitude, longitude, name, address }

    this._phoneNumberId = phoneNumberId;
    this._accessToken = accessToken;

    // Fake client compatible con whatsapp-web.js
    // confirm.js usa: await client.sendMessage(`${phone}@c.us`, msg)
    this.client = {
      sendMessage: async (toJid, text) => {
        const phone = toJid.replace('@c.us', '');
        await sendTextMessage(phoneNumberId, accessToken, phone, text);
      },
    };
  }

  async reply(text) {
    await sendTextMessage(this._phoneNumberId, this._accessToken, this.from, text);
  }

  async sendButtons(text, buttons, title = null) {
    const payload = {
      type: 'button',
      body: { text },
      action: {
        buttons: buttons.map(b => ({
          type: 'reply',
          reply: { id: b.id, title: b.title }
        }))
      }
    };
    if (title) payload.header = { type: 'text', text: title };
    await sendInteractiveMessage(this._phoneNumberId, this._accessToken, this.from, payload);
  }

  async sendList(text, buttonText, sections, title = null) {
    const payload = {
      type: 'list',
      body: { text },
      action: {
        button: buttonText,
        sections: sections.map(s => ({
          title: s.title,
          rows: s.rows.map(r => ({
            id: r.id,
            title: r.title,
            description: r.description || ''
          }))
        }))
      }
    };
    if (title) payload.header = { type: 'text', text: title };
    await sendInteractiveMessage(this._phoneNumberId, this._accessToken, this.from, payload);
  }

  async downloadMedia() {
    if (!this.mediaId) return null;
    const url = await getMediaUrl(this._accessToken, this.mediaId);
    if (!url) return null;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this._accessToken}` },
    });
    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    // Retornamos el formato esperado por messageHandler.js
    return { data: Buffer.from(arrayBuffer).toString('base64') };
  }
}

/**
 * Construye un fake client para el ctx de routeByState.
 * confirm.js recibe client en el ctx y llama client.sendMessage()
 */
export function buildFakeClient(phoneNumberId, accessToken) {
  return {
    sendMessage: async (toJid, text) => {
      const phone = toJid.replace('@c.us', '');
      await sendTextMessage(phoneNumberId, accessToken, phone, text);
    },
  };
}
