import OpenAI from 'openai';
import { Readable } from 'stream';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(base64Data) {
  if (!process.env.OPENAI_API_KEY) return null;

  const buffer = Buffer.from(base64Data, 'base64');
  const stream = Readable.from(buffer);
  // Whisper necesita un nombre de archivo para detectar el formato
  stream.path = 'audio.ogg'; 

  const transcription = await openai.audio.transcriptions.create({
    file: stream,
    model: 'whisper-1',
    language: 'es',
  });

  return transcription.text;
}