const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface GenerationOptions {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}

export class GeminiService {
  constructor(private apiKey: string) {}

  async generateResponse(prompt: string, image?: { data: string; mimeType: string }, personaInstruction?: string, responseStyleInstruction?: string, options?: GenerationOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('API key is required');
    }

    try {
      let finalPrompt = prompt;

      if (responseStyleInstruction || personaInstruction) {
        const instructions = [];
        if (responseStyleInstruction) instructions.push(responseStyleInstruction);
        if (personaInstruction) instructions.push(personaInstruction);
        finalPrompt = `${instructions.join('\n\n')}\n\n${prompt}`;
      }

      const parts: any[] = [{ text: finalPrompt }];

      if (image) {
        parts.push({
          inlineData: {
            mimeType: image.mimeType,
            data: image.data
          }
        });
      }

      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: parts
          }],
          generationConfig: {
            temperature: options?.temperature ?? 0.7,
            topK: options?.topK ?? 40,
            topP: options?.topP ?? 0.95,
            maxOutputTokens: options?.maxOutputTokens ?? 16384,
            thinkingConfig: {
              thinkingBudget: 0
            }
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
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
          // If we can't parse the error, use the status text
          errorMessage = `API Error: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated. The content may have been blocked by safety filters.');
      }

      const candidate = data.candidates[0];

      if (candidate.finishReason === 'SAFETY') {
        throw new Error('Response was blocked by safety filters. Please try rephrasing your question.');
      }

      if (candidate.finishReason === 'OTHER' || candidate.finishReason === 'IMAGE_OTHER') {
        throw new Error('The model could not process this request. If you uploaded an image, try a different image or rephrase your prompt.');
      }

      if (candidate.finishReason === 'MAX_TOKENS' && (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0)) {
        throw new Error('The response was cut off before completion. Please try a shorter prompt or request a more concise answer.');
      }

      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        const reason = candidate.finishReason ? `Finish reason: ${candidate.finishReason}` : 'No content returned';
        throw new Error(`The model returned an empty response. ${reason}. Please try again.`);
      }

      return candidate.content.parts[0].text ?? '';
    } catch (error) {
      console.error('Gemini API Error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to generate response');
    }
  }

  static validateApiKey(apiKey: string): boolean {
    return apiKey.startsWith('AIza') && apiKey.length > 30;
  }
}
