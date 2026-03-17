const ORPHEUS_VOICES = ['autumn', 'diana', 'hannah', 'austin', 'daniel', 'troy'] as const;
export type OrpheusVoice = typeof ORPHEUS_VOICES[number];

const STORAGE_KEY = 'orpheus_tts_settings';
const GROQ_TTS_URL = 'https://api.groq.com/openai/v1/audio/speech';
const MODEL = 'canopylabs/orpheus-v1-english';
const MAX_CHUNK_LENGTH = 190;

export interface OrpheusTtsSettings {
  enabled: boolean;
  voice: OrpheusVoice;
  termsAccepted: boolean;
}

export function loadOrpheusTtsSettings(): OrpheusTtsSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: !!parsed.enabled,
        voice: ORPHEUS_VOICES.includes(parsed.voice) ? parsed.voice : 'autumn',
        termsAccepted: !!parsed.termsAccepted,
      };
    }
  } catch {
  }
  return { enabled: false, voice: 'autumn', termsAccepted: false };
}

export function saveOrpheusTtsSettings(settings: OrpheusTtsSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export { ORPHEUS_VOICES };

function splitTextIntoChunks(text: string): string[] {
  if (text.length <= MAX_CHUNK_LENGTH) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= MAX_CHUNK_LENGTH) {
      chunks.push(remaining);
      break;
    }

    let splitAt = -1;

    const sentenceEnd = remaining.substring(0, MAX_CHUNK_LENGTH).search(/[.!?]\s/);
    if (sentenceEnd > 20) {
      splitAt = sentenceEnd + 1;
    }

    if (splitAt === -1) {
      const commaOrColon = remaining.substring(0, MAX_CHUNK_LENGTH).search(/[,;:]\s/);
      if (commaOrColon > 20) {
        splitAt = commaOrColon + 1;
      }
    }

    if (splitAt === -1) {
      const lastSpace = remaining.substring(0, MAX_CHUNK_LENGTH).lastIndexOf(' ');
      if (lastSpace > 20) {
        splitAt = lastSpace;
      } else {
        splitAt = MAX_CHUNK_LENGTH;
      }
    }

    chunks.push(remaining.substring(0, splitAt).trim());
    remaining = remaining.substring(splitAt).trim();
  }

  return chunks.filter(c => c.length > 0);
}

export class OrpheusTtsService {
  private groqKey: string;
  private currentAudio: HTMLAudioElement | null = null;
  private stopped = false;

  constructor(groqKey: string) {
    this.groqKey = groqKey;
  }

  async speak(
    text: string,
    voice: OrpheusVoice,
    onStart: () => void,
    onEnd: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    this.stopped = false;
    const chunks = splitTextIntoChunks(text);

    onStart();

    for (let i = 0; i < chunks.length; i++) {
      if (this.stopped) break;

      try {
        const audioUrl = await this.fetchAudioChunk(chunks[i], voice);
        if (this.stopped) {
          URL.revokeObjectURL(audioUrl);
          break;
        }
        await this.playAudio(audioUrl);
        URL.revokeObjectURL(audioUrl);
      } catch (err) {
        if (!this.stopped) {
          onError(err instanceof Error ? err : new Error(String(err)));
          return;
        }
      }
    }

    onEnd();
  }

  private async fetchAudioChunk(text: string, voice: OrpheusVoice): Promise<string> {
    const response = await fetch(GROQ_TTS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        input: text,
        voice,
        response_format: 'wav',
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      if (response.status === 403 || response.status === 401) {
        throw new Error('Groq API key invalid or model terms not accepted. Please visit the Groq Playground to accept model terms.');
      }
      throw new Error(`Orpheus TTS error (${response.status}): ${errText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  private playAudio(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      this.currentAudio = audio;

      audio.onended = () => {
        this.currentAudio = null;
        resolve();
      };

      audio.onerror = () => {
        this.currentAudio = null;
        reject(new Error('Audio playback failed'));
      };

      audio.play().catch(reject);
    });
  }

  stop() {
    this.stopped = true;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
  }
}
