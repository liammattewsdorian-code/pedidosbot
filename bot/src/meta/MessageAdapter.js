import { sendTextMessage } from './client.js';

/**
 * Adapta el payload de Meta Cloud API a la interfaz que usan
 * los flujos existentes (message.reply, message.client.sendMessage, etc.)
 * sin modificar ningún flow handler.
 */
export class MetaMessage {
  constructor({ from, body, type, phoneNumberId, accessToken }) {
    this.from = from;          // número sin @c.us
    this.fromMe = false;
    this.body = body || '';
    this.type = type || 'text';
    this.hasMedia = ['audio', 'image', 'video', 'document', 'ptt'].includes(type);

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

  // Audio: por ahora devuelve null (fallback en messageHandler lo maneja)
  async downloadMedia() {
    return null;
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
