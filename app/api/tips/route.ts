import { NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'
import OpenAI from 'openai'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { google } from 'googleapis'

const youtube = google.youtube('v3')
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.replace(/["']/g, '')
})

// Only the channels you provided
const CHANNEL_IDS = [
  'UCnpWedLQdHpZqhgTLdB9Yyg',  // AllEars.net
  'UCfzP_CiebRdveD9rRZv5Ndw',  // DFBGuide
  'UCnYjpNazZ0ixJCXxH7Z2B7g',  // Pixie Dusted Mom
  'UCe8XA4Z14D0gCg_LO65QaYw',   // Millenial Mom on Main Street
  'UCMy03Ou7q60HYfbzWvulQHQ'   //  DisneyinDetail
];

const TipSchema = z.object({
  text: z.string(),
  category: z.enum(['ride', 'dining', 'planning', 'savings', 'general']),
  confidence: z.number(),
  timestamp: z.string().transform(val => new Date().toISOString()),
  videoTitle: z.string(),
  videoUrl: z.string(),
  channelTitle: z.string()
})

const ChannelTipsSchema = z.object({
  channelName: z.string(),
  channelTitle: z.string(),
  videoSummary: z.string(),
  tips: z.array(TipSchema),
  keyTakeaways: z.array(z.string())
})

async function getLatestVideos(channelId: string) {
  const response = await youtube.search.list({
    channelId,
    part: ['id', 'snippet'],
    order: 'date',
    maxResults: 5,
    type: ['video'],
    key: process.env.YOUTUBE_API_KEY
  });

  return response.data.items?.map(item => ({
    videoId: item.id?.videoId,
    title: item.snippet?.title,
    channelTitle: item.snippet?.channelTitle
  })).filter(item => item.videoId) || [];
}

function secondsToTimestamp(seconds: number): string {
  return Math.floor(seconds).toString();
}

export async function GET() {
  try {
    // Get latest videos from all channels
    const allVideos = await Promise.all(
      CHANNEL_IDS.map(channelId => getLatestVideos(channelId))
    );
    const videos = allVideos.flat();

    // Process videos in batches to avoid rate limits
    const batchSize = 3;
    const allChannelTips = [];

    for (let i = 0; i < videos.length; i += batchSize) {
      const batch = videos.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (video) => {
          try {
            const transcript = await YoutubeTranscript.fetchTranscript(video.videoId!)
            
            // Keep track of timestamps for each segment
            const transcriptWithTimestamps = transcript.map(t => ({
              ...t,
              offset: t.offset / 1000 // Convert to seconds
            }));

            const mainTranscript = transcriptWithTimestamps
              .filter(t => t.offset < 300) // First 5 minutes
              .map(t => t.text)
              .join(' ');

            const completion = await openai.beta.chat.completions.parse({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system", 
                  content: "Extract Disney resort tips and format them according to the schema."
                },
                {
                  role: "user",
                  content: `Analyze this Disney video transcript and extract tips: ${mainTranscript}`
                }
              ],
              response_format: zodResponseFormat(ChannelTipsSchema, "channelTips")
            });

            const response = completion.choices[0].message.parsed;
            
            // Find closest timestamp for each tip
            response.tips = response.tips.map(tip => {
              // Find transcript segment that most likely contains this tip
              const relevantSegment = transcriptWithTimestamps.find(t => 
                t.text.toLowerCase().includes(tip.text.toLowerCase().slice(0, 30))
              ) || transcriptWithTimestamps[0];

              return {
                ...tip,
                timestamp: new Date().toISOString(),
                videoTitle: video.title || '',
                videoUrl: `https://youtube.com/watch?v=${video.videoId}&t=${secondsToTimestamp(relevantSegment.offset)}`,
                channelTitle: video.channelTitle || ''
              };
            });

            return response;
          } catch (error) {
            console.error(`Error processing video ${video.videoId}:`, error);
            return null;
          }
        })
      );

      allChannelTips.push(...batchResults.filter(Boolean));
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < videos.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json(allChannelTips)

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json([], { status: 500 })
  }
}