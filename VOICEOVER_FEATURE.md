# WhatsApp Campaign Voiceover Feature

This feature adds voiceover capability to WhatsApp campaigns when multiple pages/slides are detected in a design.

## Overview

When creating a WhatsApp campaign with multiple design pages:

1. **Step 1**: Campaign Details & WhatsApp Connection
2. **Step 2**: Customer Selection  
3. **Step 3**: Voiceover (NEW) - Optional audio generation
4. **Step 4**: Message Composition & Campaign Review

## How It Works

### Automatic Detection
- **Single Page**: Skip voiceover step, create image campaign
- **Multiple Pages**: Show voiceover step, create video campaign

### Voiceover Generation
- Enter script text for narration
- Choose from 6 available AI voices (male/female, different accents)
- Audio is generated using Eleven Labs or OpenAI TTS (fallback)
- Video timing is automatically calculated based on audio duration

### Smart Timing Calculation
- **Optimal Duration**: Audio length ÷ number of slides
- **Minimum**: 2 seconds per slide
- **Maximum**: 8 seconds per slide  
- **Repetition**: If audio is longer, slides repeat in sequence

### Examples
- **10 seconds audio + 2 slides** = 5 seconds per slide
- **6 seconds audio + 4 slides** = 2 seconds per slide (minimum applied)
- **20 seconds audio + 2 slides** = 8 seconds per slide (maximum applied), then repeat

## Technical Implementation

### Frontend Components
- **Audio Service** (`src/services/audioService.ts`): Eleven Labs integration
- **Video Service** (`src/services/videoService.ts`): Enhanced with audio support
- **Campaign Dialog** (`src/components/WhatsAppCampaignDialog.tsx`): New voiceover step

### Backend APIs
- **Audio Route** (`api/routes/audio.js`): Audio generation endpoint
- **Video Controller** (`api/controllers/videoshowController.js`): Audio-video sync
- **FFmpeg Integration**: Audio overlay on video slideshows

### Database Updates
- **Campaign Model**: Added `audioUrl` and `audioDuration` fields
- **Form Data**: Extended to include voiceover information

## Environment Variables

Add these to your `.env` file:

```bash
# Audio Generation APIs
ELEVEN_LABS_API_KEY="your_eleven_labs_api_key_here"
OPENAI_API_KEY="your_openai_api_key_here"
```

## API Endpoints

### Generate Audio
```
POST /api/audio/generate
{
  "text": "Your script text here",
  "voice": "alloy", // or "echo", "fable", "onyx", "nova", "shimmer"
  "stability": 0.5,
  "similarity_boost": 0.75
}
```

### Create Video with Audio
```
POST /api/video-processing/create-videoshow-slideshow
FormData:
- images: [files]
- duration: 3
- audioUrl: "http://localhost:4000/temp/audio_123.mp3"
- audioDuration: 10.5
- slideTimings: "[0, 5, 10]"
```

## Voice Options

1. **Alloy** - Professional, neutral (Male, American)
2. **Echo** - Clear, articulate (Male, American)  
3. **Fable** - Warm, expressive (Male, British)
4. **Onyx** - Deep, authoritative (Male, American)
5. **Nova** - Young, energetic (Female, American)
6. **Shimmer** - Soft, gentle (Female, American)

## User Flow

1. User creates multi-page design in editor
2. Clicks "Share" → Opens WhatsApp Campaign Dialog
3. Completes steps 1-2 (campaign details, customer selection)
4. **Step 3 - Voiceover** (shown only for multi-page designs):
   - Enter script text
   - Select preferred voice
   - Click "Generate Voiceover"
   - Preview generated audio
   - See timing calculations
5. Step 4 - Complete campaign setup

## Error Handling

- **No API Keys**: Falls back to OpenAI TTS
- **Audio Generation Fails**: Continue without audio
- **Invalid Script**: Show validation error
- **Network Issues**: Retry mechanism with timeout

## Performance Considerations

- Audio files are cached in `/temp` directory
- Maximum 3 concurrent video processing requests
- Audio generation timeout: 60 seconds
- Video generation timeout: 120 seconds

## Future Enhancements

1. **Custom Voice Cloning**: Upload voice samples
2. **SSML Support**: Advanced speech synthesis markup
3. **Background Music**: Add ambient audio tracks
4. **Multi-language**: Support for different languages
5. **Voice Emotions**: Emotional tone variations
