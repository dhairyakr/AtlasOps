const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export interface GroqGenerationOptions {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

export class GroqService {
  constructor(private apiKey: string) {}

  async generateResponse(prompt: string, options?: GroqGenerationOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Groq API key is required');
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: Math.min(options?.temperature ?? 0.7, 2.0),
        top_p: options?.topP ?? 0.95,
        max_tokens: options?.maxTokens ?? 8192,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        errorMessage = `Groq API Error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response generated from Groq API.');
    }

    return data.choices[0].message.content;
  }
}
