export class SpeechService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private isListening = false;
  private _currentVoice: SpeechSynthesisVoice | null = null;
  private _currentRate: number = 1.2;
  private _currentPitch: number = 1.1;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
    this.loadSettingsFromLocalStorage();
    
    // Load voices when they become available
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        this.loadSettingsFromLocalStorage();
      };
    }
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
    }
  }

  private loadSettingsFromLocalStorage() {
    try {
      const savedVoiceName = localStorage.getItem('voice-assistant-voice');
      const savedRate = localStorage.getItem('voice-assistant-rate');
      const savedPitch = localStorage.getItem('voice-assistant-pitch');

      if (savedRate) {
        this._currentRate = parseFloat(savedRate);
      }

      if (savedPitch) {
        this._currentPitch = parseFloat(savedPitch);
      }

      // Set voice after voices are loaded
      if (savedVoiceName) {
        this.updateVoiceSelection(savedVoiceName);
      } else {
        // Use best available voice if no saved preference
        this._currentVoice = this.selectBestVoice();
      }
    } catch (error) {
      console.error('Failed to load voice settings:', error);
      this._currentVoice = this.selectBestVoice();
    }
  }

  public updateVoiceSelection(voiceName: string): void {
    const voices = this.synthesis.getVoices();
    const selectedVoice = voices.find(voice => voice.name === voiceName);
    
    if (selectedVoice) {
      this._currentVoice = selectedVoice;
    } else {
      // Fallback to best available voice
      this._currentVoice = this.selectBestVoice();
    }

    // Save to localStorage
    try {
      if (this._currentVoice) {
        localStorage.setItem('voice-assistant-voice', this._currentVoice.name);
      }
    } catch (error) {
      console.error('Failed to save voice preference:', error);
    }
  }

  public setRate(rate: number): void {
    this._currentRate = Math.max(0.1, Math.min(2.0, rate));
    try {
      localStorage.setItem('voice-assistant-rate', this._currentRate.toString());
    } catch (error) {
      console.error('Failed to save rate preference:', error);
    }
  }

  public setPitch(pitch: number): void {
    this._currentPitch = Math.max(0.1, Math.min(2.0, pitch));
    try {
      localStorage.setItem('voice-assistant-pitch', this._currentPitch.toString());
    } catch (error) {
      console.error('Failed to save pitch preference:', error);
    }
  }

  public getCurrentSettings(): { voice: SpeechSynthesisVoice | null; rate: number; pitch: number } {
    return {
      voice: this._currentVoice,
      rate: this._currentRate,
      pitch: this._currentPitch
    };
  }

  public isSupported(): boolean {
    return this.recognition !== null && 'speechSynthesis' in window;
  }

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onStart: () => void,
    onEnd: () => void
  ): void {
    if (!this.recognition || this.isListening) return;

    this.isListening = true;

    this.recognition.onstart = () => {
      onStart();
    };

    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      
      onResult(transcript, isFinal);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not accessible. Please check permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error occurred during speech recognition.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      onError(errorMessage);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
    } catch (error) {
      this.isListening = false;
      onError('Failed to start speech recognition');
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  private selectBestVoice(): SpeechSynthesisVoice | null {
    const voices = this.synthesis.getVoices();
    
    // High-priority voice names/keywords for beautiful, natural-sounding voices (including Indian languages)
    const premiumVoiceKeywords = [
      'Google US English Female',
      'Google US English Male',
      'Google UK English Female',
      'Google UK English Male',
      'Google français',
      'Google español',
      'Google Deutsch',
      'Google italiano',
      'Google 日本語',
      'Google 한국의',
      'Google 中文',
      'Google português',
      'Google русский',
      'Google हिन्दी',
      'Google বাংলা',
      'Google தமிழ்',
      'Google తెలుగు',
      'Google मराठी',
      'Google ગુજરાતી',
      'Google ಕನ್ನಡ',
      'Google മലയാളം',
      'Google ਪੰਜਾਬੀ',
      'Google ଓଡ଼ିଆ',
      'Google অসমীয়া',
      'Google नेपाली',
      'Google سنڌي',
      'Google اردو',
      'Google العربية',
      'Microsoft Zira Desktop',
      'Microsoft David Desktop',
      'Microsoft Aria Online',
      'Microsoft Jenny Online',
      'Microsoft Guy Online',
      'Microsoft Hazel Desktop',
      'Microsoft Eva Desktop',
      'Microsoft Hedda Desktop',
      'Microsoft Katja Desktop',
      'Microsoft Helena Desktop',
      'Microsoft Sabina Desktop',
      'Microsoft Paulina Desktop',
      'Microsoft Elsa Desktop',
      'Microsoft Maria Desktop',
      'Microsoft Cosimo Desktop',
      'Microsoft Hortense Desktop',
      'Microsoft Julie Desktop',
      'Microsoft Ayumi Desktop',
      'Microsoft Haruka Desktop',
      'Microsoft Heami Desktop',
      'Microsoft Huihui Desktop',
      'Microsoft Yaoyao Desktop',
      'Microsoft Tracy Desktop',
      'Microsoft Danny Desktop',
      'Microsoft Yating Desktop',
      'Microsoft Zhiwei Desktop',
      'Microsoft Hemant Desktop',
      'Microsoft Kalpana Desktop',
      'Microsoft Ravi Desktop',
      'Microsoft Swara Desktop',
      'Samantha',
      'Alex',
      'Victoria',
      'Daniel',
      'Karen',
      'Moira',
      'Tessa',
      'Veena',
      'Rishi',
      'Ting-Ting',
      'Lekha',
      'Sangeeta',
      'Neel',
      'Aditi',
      'Raveena',
      'Fiona',
      'Allison'
    ];

    // Indian language specific keywords for better voice selection
    const indianLanguageKeywords = [
      'Hindi',
      'Bengali',
      'Tamil',
      'Telugu',
      'Marathi',
      'Gujarati',
      'Kannada',
      'Malayalam',
      'Punjabi',
      'Odia',
      'Assamese',
      'Nepali',
      'Sindhi',
      'Urdu',
      'हिन्दी',
      'বাংলা',
      'தமிழ்',
      'తెలుగు',
      'मराठी',
      'ગુજરાતી',
      'ಕನ್ನಡ',
      'മലയാളം',
      'ਪੰਜਾਬੀ',
      'ଓଡ଼ିଆ',
      'অসমীয়া',
      'नेपाली',
      'سنڌي',
      'اردو'
    ];
    // Secondary priority - general quality indicators
    const qualityKeywords = [
      'Premium',
      'Enhanced',
      'Neural',
      'Studio',
      'Natural',
      'HD',
      'High Quality'
    ];

    // Tertiary priority - brand/platform indicators
    const brandKeywords = [
      'Google',
      'Microsoft',
      'Apple',
      'Amazon'
    ];

    // First, try to find premium voices by exact or partial name match
    for (const keyword of premiumVoiceKeywords) {
      const voice = voices.find(v => 
        v.name.toLowerCase().includes(keyword.toLowerCase())
      );
      if (voice) {
        console.log(`Selected premium voice: ${voice.name}`);
        return voice;
      }
    }

    // Second, try Indian language specific voices
    for (const keyword of indianLanguageKeywords) {
      const voice = voices.find(v => 
        v.name.toLowerCase().includes(keyword.toLowerCase()) ||
        v.lang.toLowerCase().includes(keyword.toLowerCase())
      );
      if (voice) {
        console.log(`Selected Indian language voice: ${voice.name}`);
        return voice;
      }
    }
    // Third, try quality indicator keywords
    for (const keyword of qualityKeywords) {
      const voice = voices.find(v => 
        v.name.toLowerCase().includes(keyword.toLowerCase())
      );
      if (voice) {
        console.log(`Selected quality voice: ${voice.name}`);
        return voice;
      }
    }

    // Fourth, try brand keywords
    for (const keyword of brandKeywords) {
      const voice = voices.find(v => 
        v.name.toLowerCase().includes(keyword.toLowerCase())
      );
      if (voice) {
        console.log(`Selected brand voice: ${voice.name}`);
        return voice;
      }
    }

    // Fifth, prefer English voices if available
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      console.log(`Selected English voice: ${englishVoice.name}`);
      return englishVoice;
    }

    // Sixth, prefer female voices as they're often perceived as more pleasant
    const femaleVoice = voices.find(v => 
      (v.name.toLowerCase().includes('female') || 
       v.name.toLowerCase().includes('woman') ||
       v.name.toLowerCase().includes('femme') ||
       v.name.toLowerCase().includes('mujer') ||
       v.name.toLowerCase().includes('donna') ||
       ['samantha', 'victoria', 'karen', 'moira', 'tessa', 'veena', 'fiona', 'allison', 'zira', 'aria', 'jenny', 'lekha', 'sangeeta', 'kalpana', 'aditi', 'raveena'].some(name => 
         v.name.toLowerCase().includes(name)
       ))
    );
    
    if (femaleVoice) {
      console.log(`Selected female voice: ${femaleVoice.name}`);
      return femaleVoice;
    }

    // Seventh, fall back to any available voice
    const anyVoice = voices[0];
    if (anyVoice) {
      console.log(`Selected fallback voice: ${anyVoice.name}`);
      return anyVoice;
    }

    // Last resort - use default voice
    console.log('Using default system voice');
    return null;
  }

  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: string) => void
  ): void {
    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Use current settings
    utterance.rate = this._currentRate;
    utterance.pitch = this._currentPitch;
    utterance.volume = 0.9;
    
    // Use current voice
    if (this._currentVoice) {
      utterance.voice = this._currentVoice;
      // Set language to match the voice for better pronunciation
      utterance.lang = this._currentVoice.lang;
    }

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = (event) => {
     // Don't treat 'interrupted' as an error - it's normal when speech is cancelled
     if (event.error === 'interrupted') {
       return;
     }
      onError?.(`Speech synthesis error: ${event.error}`);
    };

    this.synthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    this.synthesis.cancel();
  }

  public isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  // Get available voices for user selection
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  // Test voice with language-appropriate sample text
  public testVoice(customText?: string): void {
    let text = customText;
    
    if (!text && this._currentVoice) {
      // Use language-specific test phrases
      text = this.getLanguageSpecificTestText(this._currentVoice.lang);
    }
    
    if (!text) {
      text = "Hello! This is how I sound with the current voice settings.";
    }
    
    this.speak(text);
  }

  // Get language-specific test text
  private getLanguageSpecificTestText(lang: string): string {
    const langCode = lang.toLowerCase().split('-')[0];
    
    const testPhrases: Record<string, string> = {
      'hi': 'नमस्ते! मैं आपकी आवाज़ सहायक हूँ। मैं हिंदी में बोल सकती हूँ।',
      'bn': 'নমস্কার! আমি আপনার ভয়েস সহায়ক। আমি বাংলায় কথা বলতে পারি।',
      'ta': 'வணக்கம்! நான் உங்கள் குரல் உதவியாளர். நான் தமிழில் பேச முடியும்।',
      'te': 'నమస్కారం! నేను మీ వాయిస్ అసిస్టెంట్. నేను తెలుగులో మాట్లాడగలను।',
      'mr': 'नमस्कार! मी तुमची आवाज सहाय्यक आहे। मी मराठीत बोलू शकते।',
      'gu': 'નમસ્તે! હું તમારો વૉઇસ આસિસ્ટન્ટ છું. હું ગુજરાતીમાં બોલી શકું છું।',
      'kn': 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಧ್ವನಿ ಸಹಾಯಕ. ನಾನು ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಬಲ್ಲೆ।',
      'ml': 'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ വോയ്സ് അസിസ്റ്റന്റ്. എനിക്ക് മലയാളത്തിൽ സംസാരിക്കാം।',
      'pa': 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਵੌਇਸ ਅਸਿਸਟੈਂਟ ਹਾਂ। ਮੈਂ ਪੰਜਾਬੀ ਵਿੱਚ ਬੋਲ ਸਕਦਾ ਹਾਂ।',
      'or': 'ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର ଭଏସ୍ ଆସିଷ୍ଟାଣ୍ଟ। ମୁଁ ଓଡ଼ିଆରେ କହିପାରେ।',
      'as': 'নমস্কাৰ! মই আপোনাৰ ভইচ এচিষ্টেণ্ট। মই অসমীয়াত কথা ক\'ব পাৰোঁ।',
      'ne': 'नमस्ते! म तपाईंको आवाज सहायक हुँ। म नेपालीमा बोल्न सक्छु।',
      'ur': 'السلام علیکم! میں آپ کا وائس اسسٹنٹ ہوں۔ میں اردو میں بول سکتا ہوں۔',
      'ar': 'السلام عليكم! أنا مساعدك الصوتي. يمكنني التحدث باللغة العربية.',
      'fr': 'Bonjour! Je suis votre assistant vocal. Je peux parler en français.',
      'es': '¡Hola! Soy tu asistente de voz. Puedo hablar en español.',
      'de': 'Hallo! Ich bin Ihr Sprachassistent. Ich kann auf Deutsch sprechen.',
      'it': 'Ciao! Sono il tuo assistente vocale. Posso parlare in italiano.',
      'pt': 'Olá! Eu sou seu assistente de voz. Posso falar em português.',
      'ru': 'Привет! Я ваш голосовой помощник. Я могу говорить по-русски.',
      'ja': 'こんにちは！私はあなたの音声アシスタントです。日本語で話すことができます。',
      'ko': '안녕하세요! 저는 당신의 음성 어시스턴트입니다. 한국어로 말할 수 있습니다.',
      'zh': '你好！我是你的语音助手。我可以说中文。',
      'en': 'Hello! I am your voice assistant. This is how I sound with the current settings.'
    };
    
    return testPhrases[langCode] || testPhrases['en'];
  }
}

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}