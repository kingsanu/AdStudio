const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Environment variables for Eleven Labs API
const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const ELEVEN_LABS_BASE_URL = 'https://api.elevenlabs.io/v1';

// Enhanced voice mapping with professional advertising voices
const VOICE_MAPPING = {
  // Professional English voices (using premium Eleven Labs voices)
  alloy: 'pNInz6obpgDQGcFmaJgB', // Professional male voice
  nova: 'ErXwobaYiN019PkySvjV', // Energetic female voice
  echo: 'VR6AewLTigWG4xSOukaG', // Authoritative male voice
  shimmer: 'AZnzlk1XvdvUeBnXmlld', // Warm female voice
  
  // Indian English voices (premium voices with Indian accent)
  aria: 'pFZP5JQG7iQjIQuC4Bku', // Sophisticated Indian female
  davis: '29vD33N1CtxCmqQRPOHJ', // Confident Indian male
  maya: 'IKne3meq5aSn9XLyUdCD', // Melodious Indian female
  arjun: 'flq6f7yk4E4fJM5XTYuZ', // Dynamic Indian male
  
  // Hindi voices (multilingual voices)
  priya: 'ThT5KcBeYPX3keUQqHPh', // Sweet Hindi female
  raj: 'JBFqnCBsd6RMkjVDRZzb', // Strong Hindi male
  kavya: 'XrExE9yKIg1WjnnlVkGX', // Elegant Hindi female
  rohit: 'GBv7mTt0atIp3Br8iCZE', // Energetic Hindi male
  ananya: 'oWAxZDx7w5VEj9dCyTzz', // Modern Hindi female
  vikram: 'bVMeCyTHy58xNoL34h3p'  // Deep Hindi male
};

// Enhanced voice settings for maximum emotional impact
const ENHANCED_VOICE_SETTINGS = {
  // Professional advertising voices with high emotional range
  alloy: { stability: 0.30, similarity_boost: 0.95, style: 0.80, use_speaker_boost: true },
  nova: { stability: 0.25, similarity_boost: 0.98, style: 0.85, use_speaker_boost: true },
  echo: { stability: 0.40, similarity_boost: 0.90, style: 0.70, use_speaker_boost: true },
  shimmer: { stability: 0.35, similarity_boost: 0.95, style: 0.75, use_speaker_boost: true },
  
  // Indian English voices with cultural emotional expression
  aria: { stability: 0.20, similarity_boost: 0.98, style: 0.90, use_speaker_boost: true },
  davis: { stability: 0.30, similarity_boost: 0.95, style: 0.85, use_speaker_boost: true },
  maya: { stability: 0.15, similarity_boost: 0.99, style: 0.95, use_speaker_boost: true },
  arjun: { stability: 0.25, similarity_boost: 0.97, style: 0.88, use_speaker_boost: true },
  
  // Hindi voices with maximum expressiveness
  priya: { stability: 0.10, similarity_boost: 0.99, style: 0.98, use_speaker_boost: true },
  raj: { stability: 0.35, similarity_boost: 0.92, style: 0.80, use_speaker_boost: true },
  kavya: { stability: 0.12, similarity_boost: 0.99, style: 0.96, use_speaker_boost: true },
  rohit: { stability: 0.20, similarity_boost: 0.98, style: 0.92, use_speaker_boost: true },
  ananya: { stability: 0.25, similarity_boost: 0.96, style: 0.88, use_speaker_boost: true },
  vikram: { stability: 0.40, similarity_boost: 0.90, style: 0.75, use_speaker_boost: true }
};

/**
 * Add emotional context and SSML tags to enhance speech naturalness
 */
function enhanceTextForEmotion(text, voice) {
  // Add emotional context based on voice type
  const emotionalPrefixes = {
    priya: "मित्रों, ", // Friends in Hindi
    raj: "सुनिए, ", // Listen in Hindi
    kavya: "आइए, ", // Come in Hindi
    rohit: "अरे यार, ", // Hey buddy in Hindi
    ananya: "जानिए, ", // Know this in Hindi
    vikram: "ध्यान दें, ", // Pay attention in Hindi
    aria: "Listen, ",
    davis: "Attention, ",
    maya: "Discover, ",
    arjun: "Experience, "
  };

  // Add emotional markers and pauses for more natural speech
  let enhancedText = text;
  
  // Add appropriate emotional prefix
  if (emotionalPrefixes[voice]) {
    enhancedText = emotionalPrefixes[voice] + enhancedText;
  }
  
  // Add strategic pauses for better pacing
  enhancedText = enhancedText
    .replace(/\./g, '... ') // Longer pause at sentence end
    .replace(/,/g, ', ') // Short pause at comma
    .replace(/!/g, '! ') // Enthusiastic pause
    .replace(/\?/g, '? '); // Question pause
  
  // Add emphasis markers for key advertising words
  const emphasisWords = [
    'offer', 'sale', 'discount', 'free', 'limited', 'exclusive', 'special',
    'now', 'today', 'best', 'amazing', 'incredible', 'fantastic',
    'ऑफर', 'सेल', 'छूट', 'मुफ्त', 'सीमित', 'विशेष', 'आज', 'बेस्ट', 'शानदार'
  ];
  
  emphasisWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    enhancedText = enhancedText.replace(regex, `*${word}*`);
  });
  
  return enhancedText;
}

/**
 * Generate audio from text using Eleven Labs API or OpenAI TTS (fallback)
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      text,
      voice = 'aria',
      stability,
      similarity_boost,
      style,
      use_speaker_boost
    } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Text is required and must be a string'
      });
    }

    console.log(`[Audio API] Generating audio for text: "${text.substring(0, 100)}..."`);
    console.log(`[Audio API] Voice: ${voice}, Length: ${text.length} characters`);

    // Enhance text for maximum emotional impact
    const enhancedText = enhanceTextForEmotion(text, voice);
    console.log(`[Audio API] Enhanced text: "${enhancedText.substring(0, 100)}..."`);

    let audioBuffer;
    let audioDuration = 0;

    // Try Eleven Labs first (prioritize for emotional speech)
    if (ELEVEN_LABS_API_KEY) {
      try {
        console.log('[Audio API] Using Eleven Labs for enhanced emotional audio generation');
        
        const voiceId = VOICE_MAPPING[voice] || VOICE_MAPPING.aria;
        const voiceSettings = ENHANCED_VOICE_SETTINGS[voice] || ENHANCED_VOICE_SETTINGS.aria;
        
        // Use enhanced settings with user overrides
        const finalSettings = {
          stability: stability !== undefined ? stability : voiceSettings.stability,
          similarity_boost: similarity_boost !== undefined ? similarity_boost : voiceSettings.similarity_boost,
          style: style !== undefined ? style : voiceSettings.style,
          use_speaker_boost: use_speaker_boost !== undefined ? use_speaker_boost : voiceSettings.use_speaker_boost
        };
        
        console.log(`[Audio API] Voice ID: ${voiceId}`);
        console.log(`[Audio API] Enhanced settings:`, finalSettings);
        
        const elevenLabsResponse = await axios.post(
          `${ELEVEN_LABS_BASE_URL}/text-to-speech/${voiceId}`,
          {
            text: enhancedText,
            model_id: "eleven_multilingual_v2", // Use the latest multilingual model for better quality
            voice_settings: finalSettings
          },
          {
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': ELEVEN_LABS_API_KEY
            },
            responseType: 'arraybuffer',
            timeout: 45000 // Increased timeout for enhanced processing
          }
        );

        audioBuffer = Buffer.from(elevenLabsResponse.data);
        
        // More accurate duration calculation for enhanced text
        const wordsPerMinute = voice.includes('hindi') || ['priya', 'raj', 'kavya', 'rohit', 'ananya', 'vikram'].includes(voice) ? 120 : 140; // Hindi is typically slower
        const estimatedWords = enhancedText.length / 4.5; // More accurate word estimation
        audioDuration = (estimatedWords / wordsPerMinute) * 60; // Convert to seconds
        
        console.log(`[Audio API] Eleven Labs success: ${audioBuffer.length} bytes, ~${audioDuration}s (enhanced)`);
        
      } catch (elevenLabsError) {
        console.error('[Audio API] Eleven Labs failed:', elevenLabsError.message);
        if (elevenLabsError.response) {
          console.error('[Audio API] Eleven Labs error details:', elevenLabsError.response.data);
        }
        throw elevenLabsError;
      }
    } else {
      // Enhanced OpenAI TTS fallback
      console.log('[Audio API] Using OpenAI TTS as fallback with enhanced settings');
      
      const openaiResponse = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1-hd', // Use HD model for better quality
          input: enhancedText,
          voice: voice === 'aria' ? 'nova' : (VOICE_MAPPING[voice] ? voice : 'alloy'), // Map to closest OpenAI voice
          response_format: 'mp3',
          speed: 0.95 // Slightly slower for more natural speech
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 45000 // Increased timeout for enhanced processing
        }
      );

      audioBuffer = Buffer.from(openaiResponse.data);
      
      // Enhanced duration calculation for OpenAI TTS
      const wordsPerMinute = 140;
      const estimatedWords = enhancedText.length / 4.5;
      audioDuration = (estimatedWords / wordsPerMinute) * 60;
      
      console.log(`[Audio API] OpenAI TTS success: ${audioBuffer.length} bytes, ~${audioDuration}s (enhanced)`);
    }

    // Save audio file
    const audioFilename = `audio_${uuidv4()}.mp3`;
    const tempDir = path.join(__dirname, '../temp');
    const audioPath = path.join(tempDir, audioFilename);

    // Create temp directory if it doesn't exist
    try {
      await fs.access(tempDir);
    } catch {
      await fs.mkdir(tempDir, { recursive: true });
    }

    // Write audio file
    await fs.writeFile(audioPath, audioBuffer);
    
    console.log(`[Audio API] Audio saved to: ${audioPath}`);

    // Return audio URL and duration
    const audioUrl = `http://localhost:4000/temp/${audioFilename}`;
    
    res.json({
      success: true,
      audioUrl: audioUrl,
      duration: Math.round(audioDuration * 10) / 10, // Round to 1 decimal place
      cloudUrl: audioUrl, // For compatibility
      message: 'Audio generated successfully'
    });

  } catch (error) {
    console.error('[Audio API] Error generating audio:', error);
    
    // Return appropriate error message
    let errorMessage = 'Failed to generate audio';
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'Invalid API key for audio service';
      } else if (error.response.status === 429) {
        errorMessage = 'Audio generation rate limit exceeded';
      } else if (error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      }
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get audio duration (utility endpoint)
 */
router.get('/duration/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const audioPath = path.join(__dirname, '../temp', filename);
    
    // Check if file exists
    await fs.access(audioPath);
    
    // For now, return a basic estimation - in production, you might want to use ffprobe
    const stats = await fs.stat(audioPath);
    const fileSizeKB = stats.size / 1024;
    const estimatedDuration = fileSizeKB / 16; // Rough estimate for MP3 at 128kbps
    
    res.json({
      success: true,
      duration: Math.round(estimatedDuration * 10) / 10,
      fileSize: stats.size
    });
    
  } catch (error) {
    console.error('[Audio API] Error getting duration:', error);
    res.status(404).json({
      success: false,
      message: 'Audio file not found'
    });
  }
});

module.exports = router;
