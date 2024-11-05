import { NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'
import { google } from 'googleapis'
import OpenAI from 'openai'
import { z } from 'zod'

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
})

// Add console.log to debug API key
console.log('OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
console.log('OpenAI API Key starts with:', process.env.OPENAI_API_KEY?.slice(0, 7));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '' // Ensure it's not undefined
});

// Zod schemas
const TipSchema = z.object({
  content: z.string(),
  category: z.enum(['transportation', 'dining', 'accommodation', 'activities', 'general']),
  importance: z.number().min(1).max(5)
})

const AnalysisSchema = z.object({
  title: z.string(),
  summary: z.string(),
  tips: z.array(TipSchema),
  key_points: z.array(z.string())
})

export async function GET() {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ 
      error: 'OpenAI API key not configured',
      tip: 'Check your .env.local file'
    }, { status: 500 });
  }

  try {
    const response = await youtube.search.list({
      channelId: 'UC1xwwLwm6WSMbUn_Tp597hQ',
      part: ['id', 'snippet'],
      order: 'date',
      maxResults: 1,
      type: ['video']
    });

    const video = response.data.items?.[0];
    if (!video?.id?.videoId) return NextResponse.json([]);

    const transcript = await YoutubeTranscript.fetchTranscript(video.id.videoId);
    const mainTranscript = transcript.filter(t => t.offset < 5000);
    const transcriptText = mainTranscript.map(t => t.text).join(' ');

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a Disney Parks expert. Extract specific, actionable tips from video transcripts about Disney World resorts and experiences."
        },
        {
          role: "user",
          content: `Extract key information and tips from this Disney video transcript: ${transcriptText}`
        }
      ],
      functions: [{
        name: "analyze_content",
        parameters: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Title summarizing the main topic"
            },
            summary: {
              type: "string",
              description: "Brief summary of the video content"
            },
            tips: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  content: {
                    type: "string",
                    description: "The actual tip content"
                  },
                  category: {
                    type: "string",
                    enum: ["transportation", "dining", "accommodation", "activities", "general"]
                  },
                  importance: {
                    type: "number",
                    description: "Importance rating from 1-5",
                    minimum: 1,
                    maximum: 5
                  }
                },
                required: ["content", "category", "importance"]
              }
            },
            key_points: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Key takeaways from the video"
            }
          },
          required: ["title", "summary", "tips", "key_points"]
        }
      }],
      function_call: { name: "analyze_content" }
    });

    const result = JSON.parse(completion.choices[0].message.function_call?.arguments || '{}');
    
    // Validate with Zod
    const validatedAnalysis = AnalysisSchema.parse(result);

    return NextResponse.json({
      videoInfo: {
        title: video.snippet?.title ?? 'Untitled',
        url: `https://youtube.com/watch?v=${video.id?.videoId}`,
        channelTitle: video.snippet?.channelTitle ?? 'Unknown Channel',
        publishedAt: video.snippet?.publishedAt ?? new Date().toISOString()
      },
      analysis: validatedAnalysis
    });

  } catch (error) {
    console.error('Failed to process:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process video',
      type: error instanceof Error ? error.constructor.name : 'Unknown'
    }, { status: 500 });
  }
}