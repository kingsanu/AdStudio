
import axios from "axios";

interface AudioGenerationOptions {
  text: string;
  voice?: string;
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

interface AudioGenerationResult {
  success: boolean;
  data?: {
    audioUrl: string;
    duration: number;
    cloudUrl?: string;
  };
  error?: string;
}

interface VoiceOption {
  id: string;
  name: string;
  description: string;
  gender: "male" | "female";
  accent: string;
  // Enhanced parameters for more human-like speech
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
  emotionalTone: string;
}

class AudioService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = "https://adstudioserver.foodyqueen.com/api";
  }

  // Available voice options for Eleven Labs with MAXIMUM emotional impact
  getAvailableVoices(): VoiceOption[] {
    return [
      // Enhanced English Voices - Hyper-Emotional for Maximum Advertising Impact
      {
        id: "alloy",
        name: "Alloy",
        description: "🎯 COMMANDING Professional Voice - Builds Trust & Authority",
        gender: "male",
        accent: "American",
        stability: 0.30, // Lower stability = more emotional variation
        similarity_boost: 0.95, // High similarity for consistent quality
        style: 0.80, // High style for dramatic expression
        use_speaker_boost: true,
        emotionalTone: "🔥 POWERFUL & COMMANDING"
      },
      {
        id: "nova",
        name: "Nova",
        description: "⚡ EXPLOSIVE Energy - Perfect for Youth & Lifestyle Brands",
        gender: "female",
        accent: "American",
        stability: 0.25, // Very emotional and expressive
        similarity_boost: 0.98,
        style: 0.85,
        use_speaker_boost: true,
        emotionalTone: "🚀 SUPER ENERGETIC & VIBRANT"
      },
      {
        id: "echo",
        name: "Echo",
        description: "💼 AUTHORITATIVE Expert - Builds Credibility & Trust",
        gender: "male",
        accent: "American",
        stability: 0.40,
        similarity_boost: 0.90,
        style: 0.70,
        use_speaker_boost: true,
        emotionalTone: "🏆 TRUSTWORTHY & CONFIDENT"
      },
      {
        id: "shimmer",
        name: "Shimmer",
        description: "💖 HEARTWARMING Friend - Creates Emotional Connection",
        gender: "female",
        accent: "American",
        stability: 0.35,
        similarity_boost: 0.95,
        style: 0.75,
        use_speaker_boost: true,
        emotionalTone: "🌟 WARM & CARING"
      },
      
      // SUPER EXPRESSIVE Indian English Voices - Culturally Authentic
      {
        id: "aria",
        name: "Aria",
        description: "👑 ROYAL Indian Elegance - Premium Luxury Brand Voice",
        gender: "female",
        accent: "Indian English",
        stability: 0.20, // Maximum emotional range
        similarity_boost: 0.98,
        style: 0.90, // Very high style for dramatic impact
        use_speaker_boost: true,
        emotionalTone: "✨ SOPHISTICATED & MAJESTIC"
      },
      {
        id: "davis",
        name: "Davis",
        description: "💪 DYNAMIC Indian Leader - Tech & Innovation Voice",
        gender: "male",
        accent: "Indian English",
        stability: 0.30,
        similarity_boost: 0.95,
        style: 0.85,
        use_speaker_boost: true,
        emotionalTone: "🔥 CONFIDENT & INNOVATIVE"
      },
      {
        id: "maya",
        name: "Maya",
        description: "🎵 MELODIOUS Indian Beauty - Lifestyle & Fashion Voice",
        gender: "female",
        accent: "Indian English",
        stability: 0.15, // Super expressive
        similarity_boost: 0.99,
        style: 0.95,
        use_speaker_boost: true,
        emotionalTone: "🌺 ENCHANTING & EXPRESSIVE"
      },
      {
        id: "arjun",
        name: "Arjun",
        description: "⚡ EXPLOSIVE Indian Energy - Sports & Youth Voice",
        gender: "male",
        accent: "Indian English",
        stability: 0.25,
        similarity_boost: 0.97,
        style: 0.88,
        use_speaker_boost: true,
        emotionalTone: "🏃‍♂️ SUPER DYNAMIC & PASSIONATE"
      },
      
      // HYPER-EMOTIONAL Hindi Voices - Maximum Cultural Connection
      {
        id: "priya",
        name: "Priya (प्रिया)",
        description: "💝 SWEET Traditional Voice - Family & Heritage Brands",
        gender: "female",
        accent: "Hindi",
        stability: 0.10, // Maximum emotional variation
        similarity_boost: 0.99,
        style: 0.98, // Maximum style for cultural expression
        use_speaker_boost: true,
        emotionalTone: "🥰 SUPER SWEET & LOVING"
      },
      {
        id: "raj",
        name: "Raj (राज)",
        description: "👑 ROYAL Authority - Automotive & Finance Brands",
        gender: "male",
        accent: "Hindi",
        stability: 0.35,
        similarity_boost: 0.92,
        style: 0.80,
        use_speaker_boost: true,
        emotionalTone: "⚔️ STRONG & COMMANDING"
      },
      {
        id: "kavya",
        name: "Kavya (काव्या)",
        description: "💎 GRACEFUL Elegance - Jewelry & Fashion Campaigns",
        gender: "female",
        accent: "Hindi",
        stability: 0.12,
        similarity_boost: 0.99,
        style: 0.96,
        use_speaker_boost: true,
        emotionalTone: "👸 ELEGANT & GRACEFUL"
      },
      {
        id: "rohit",
        name: "Rohit (रोहित)",
        description: "🎉 SUPER ENERGETIC - Entertainment & FMCG Brands",
        gender: "male",
        accent: "Hindi",
        stability: 0.20,
        similarity_boost: 0.98,
        style: 0.92,
        use_speaker_boost: true,
        emotionalTone: "🎊 HYPER ENERGETIC & FUN"
      },
      {
        id: "ananya",
        name: "Ananya (अनन्या)",
        description: "💼 MODERN Confidence - E-commerce & Tech Brands",
        gender: "female",
        accent: "Hindi",
        stability: 0.25,
        similarity_boost: 0.96,
        style: 0.88,
        use_speaker_boost: true,
        emotionalTone: "🚀 MODERN & CONFIDENT"
      },
      {
        id: "vikram",
        name: "Vikram (विक्रम)",
        description: "🗿 DEEP Authority - Real Estate & Luxury Brands",
        gender: "male",
        accent: "Hindi",
        stability: 0.40,
        similarity_boost: 0.90,
        style: 0.75,
        use_speaker_boost: true,
        emotionalTone: "💎 DEEP & PRESTIGIOUS"
      }
    ];
  }

  /**
   * Enhance text for maximum emotional impact in advertising
   */
  private enhanceTextForAdvertising(text: string, voice: string): string {
    // Add emotional context based on voice personality
    const emotionalPrefixes: { [key: string]: string } = {
      priya: "मित्रों, ", // Friends in Hindi
      raj: "सुनिए, ", // Listen in Hindi  
      kavya: "आइए, ", // Come in Hindi
      rohit: "अरे यार, ", // Hey buddy in Hindi
      ananya: "जानिए, ", // Know this in Hindi
      vikram: "ध्यान दें, ", // Pay attention in Hindi
      aria: "Friends, ",
      davis: "Listen up, ",
      maya: "Discover, ",
      arjun: "Experience, ",
      alloy: "Attention, ",
      nova: "Hey there, ",
      echo: "Important: ",
      shimmer: "You know what? "
    };

    let enhancedText = text;
    
    // Add emotional prefix if available
    if (emotionalPrefixes[voice]) {
      enhancedText = emotionalPrefixes[voice] + enhancedText;
    }
    
    // Add strategic pauses and emphasis for advertising copy
    enhancedText = enhancedText
      .replace(/\./g, '... ') // Dramatic pause at sentence end
      .replace(/!/g, '! ') // Enthusiastic pause
      .replace(/\?/g, '? ') // Question pause
      .replace(/,/g, ', '); // Short pause at comma
    
    // Emphasize key advertising words with emotional markers
    const emphasisWords = [
      // English advertising keywords
      'offer', 'sale', 'discount', 'free', 'limited', 'exclusive', 'special',
      'now', 'today', 'best', 'amazing', 'incredible', 'fantastic', 'awesome',
      'save', 'buy', 'get', 'new', 'premium', 'luxury', 'quality',
      
      // Hindi advertising keywords
      'ऑफर', 'सेल', 'छूट', 'मुफ्त', 'सीमित', 'विशेष', 'आज', 'बेस्ट', 'शानदार',
      'खरीदें', 'पाएं', 'नया', 'प्रीमियम', 'लक्जरी', 'गुणवत्ता', 'बचाएं'
    ];
    
    emphasisWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      enhancedText = enhancedText.replace(regex, `*${word}*`);
    });
    
    // Add emotional punctuation for dramatic effect
    if (!enhancedText.includes('!') && !enhancedText.includes('?')) {
      enhancedText = enhancedText.replace(/\.$/, '!');
    }
    
    return enhancedText;
  }

  /**
   * Generate HYPER-EMOTIONAL audio from text using enhanced TTS
   */
  async generateAudio(options: AudioGenerationOptions): Promise<AudioGenerationResult> {
    try {
      console.log(`[AudioService] 🎯 Generating HYPER-EMOTIONAL audio with voice: ${options.voice || 'aria'}`);
      console.log(`[AudioService] 📝 Original text length: ${options.text.length} characters`);

      // Enhance text for maximum emotional advertising impact
      const enhancedText = this.enhanceTextForAdvertising(options.text, options.voice || 'aria');
      console.log(`[AudioService] ✨ Enhanced text: "${enhancedText.substring(0, 100)}..."`);

      // Get HYPER-EMOTIONAL voice settings
      const selectedVoice = this.getAvailableVoices().find(v => v.id === (options.voice || 'aria'));
      const voiceSettings = selectedVoice ? {
        stability: selectedVoice.stability, // Lower = more emotional variation
        similarity_boost: selectedVoice.similarity_boost, // Higher = better quality
        style: selectedVoice.style, // Higher = more dramatic
        use_speaker_boost: selectedVoice.use_speaker_boost // Always true for ads
      } : {
        // HYPER-EMOTIONAL default settings
        stability: 0.25, // Very low for maximum emotion
        similarity_boost: 0.95, // High for quality
        style: 0.85, // Very high for drama
        use_speaker_boost: true
      };

      console.log(`[AudioService] 🎭 Using HYPER-EMOTIONAL settings:`, voiceSettings);
      console.log(`[AudioService] 🎪 Emotional tone: ${selectedVoice?.emotionalTone || 'Maximum Drama'}`);

      const response = await axios.post(
        `${this.baseUrl}/audio/generate`,
        {
          text: enhancedText, // Use enhanced text
          voice: options.voice || "aria",
          // Force HYPER-EMOTIONAL settings
          stability: options.stability ?? voiceSettings.stability,
          similarity_boost: options.similarity_boost ?? voiceSettings.similarity_boost,
          style: options.style ?? voiceSettings.style,
          use_speaker_boost: options.use_speaker_boost ?? voiceSettings.use_speaker_boost,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 90000, // Increased timeout for enhanced processing
        }
      );

      console.log(`[AudioService] 🎉 HYPER-EMOTIONAL audio generation response:`, response.data);

      if (response.data.success && response.data.audioUrl) {
        return {
          success: true,
          data: {
            audioUrl: response.data.audioUrl,
            duration: response.data.duration || 0,
            cloudUrl: response.data.cloudUrl || response.data.audioUrl,
          },
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to generate audio",
        };
      }
    } catch (error: unknown) {
      console.error("Error generating audio:", error);
      return {
        success: false,
        error: (error as Error).message || "Failed to generate audio",
      };
    }
  }

  /**
   * Get audio duration from URL
   */
  async getAudioDuration(audioUrl: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.addEventListener("loadedmetadata", () => {
        resolve(audio.duration);
      });
      audio.addEventListener("error", () => {
        reject(new Error("Failed to load audio"));
      });
      audio.src = audioUrl;
    });
  }

  /**
   * Calculate optimal slide timing based on audio duration and number of slides
   */
  calculateSlideTiming(audioDuration: number, slideCount: number): {
    slideDuration: number;
    totalDuration: number;
    slideTimings: number[];
  } {
    if (slideCount === 0) {
      return {
        slideDuration: 0,
        totalDuration: 0,
        slideTimings: [],
      };
    }

    // Minimum slide duration is 2 seconds, maximum is 8 seconds
    const minSlideDuration = 2;
    const maxSlideDuration = 8;
    
    let slideDuration = audioDuration / slideCount;
    
    // If slides would be too short, we'll need to repeat the sequence
    if (slideDuration < minSlideDuration) {
      slideDuration = minSlideDuration;
    } else if (slideDuration > maxSlideDuration) {
      // If slides would be too long, cap at max duration
      slideDuration = maxSlideDuration;
    }

    const totalVideoDuration = Math.max(audioDuration, slideCount * slideDuration);
    
    // Calculate when each slide should appear
    const slideTimings: number[] = [];
    let currentTime = 0;
    
    while (currentTime < audioDuration) {
      for (let i = 0; i < slideCount && currentTime < audioDuration; i++) {
        slideTimings.push(currentTime);
        currentTime += slideDuration;
      }
    }

    return {
      slideDuration,
      totalDuration: totalVideoDuration,
      slideTimings,
    };
  }
}

export const audioService = new AudioService();
export default audioService;
