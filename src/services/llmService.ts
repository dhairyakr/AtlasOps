import { GeminiService, GenerationOptions } from './geminiService';
import { GroqService } from './groqService';
import { LLMProvider } from '../contexts/ApiSettingsContext';

export interface LLMGenerationOptions {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxTokens?: number;
}

export class LLMService {
  private provider: LLMProvider;
  private geminiService?: GeminiService;
  private groqService?: GroqService;

  constructor(provider: LLMProvider, geminiKey: string, groqKey: string) {
    this.provider = provider;
    if (provider === 'gemini' && geminiKey) {
      this.geminiService = new GeminiService(geminiKey);
    } else if (provider === 'groq' && groqKey) {
      this.groqService = new GroqService(groqKey);
    }
  }

  async generateResponse(
    prompt: string,
    image?: { data: string; mimeType: string },
    personaInstruction?: string,
    responseStyleInstruction?: string,
    options?: LLMGenerationOptions
  ): Promise<string> {
    if (this.provider === 'gemini') {
      if (!this.geminiService) throw new Error('Gemini API key is not configured');
      const geminiOpts: GenerationOptions = {
        temperature: options?.temperature,
        topK: options?.topK,
        topP: options?.topP,
        maxOutputTokens: options?.maxTokens,
      };
      return this.geminiService.generateResponse(prompt, image, personaInstruction, responseStyleInstruction, geminiOpts);
    }

    if (!this.groqService) throw new Error('Groq API key is not configured');

    let finalPrompt = prompt;
    if (responseStyleInstruction || personaInstruction) {
      const instructions: string[] = [];
      if (responseStyleInstruction) instructions.push(responseStyleInstruction);
      if (personaInstruction) instructions.push(personaInstruction);
      finalPrompt = `${instructions.join('\n\n')}\n\n${prompt}`;
    }

    if (image) {
      finalPrompt = `[Note: An image was attached but Groq does not support image analysis. Please answer based on the text only.]\n\n${finalPrompt}`;
    }

    return this.groqService.generateResponse(finalPrompt, {
      temperature: options?.temperature,
      topP: options?.topP,
      maxTokens: options?.maxTokens,
    });
  }

  getProviderName(): string {
    return this.provider === 'gemini' ? 'Gemini 2.5 Flash' : 'Llama 3.3 70B';
  }

  getProvider(): LLMProvider {
    return this.provider;
  }

  static validateGeminiKey(key: string): boolean {
    return key.startsWith('AIza') && key.length > 30;
  }

  static validateGroqKey(key: string): boolean {
    return key.startsWith('gsk_') && key.length > 20;
  }
}
