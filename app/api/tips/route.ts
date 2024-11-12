import { google } from 'googleapis';
import { decode } from 'html-entities';
import { DISNEY_CHANNELS } from '@/lib/constants';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

function cleanText(text: string): string {
  return decode(text || '').trim();
}

export async function GET() {
  try {
    const videos = await Promise.all(
      Object.entries(DISNEY_CHANNELS).map(async ([channelName, channelId]) => {
        const response = await youtube.search.list({
          part: ['snippet'],
          channelId,
          maxResults: 10,
          type: ['video'],
          q: 'Disney World',
          order: 'date'
        });

        return response.data.items?.map(video => ({
          id: video.id?.videoId || '',
          channelName,
          title: cleanText(video.snippet?.title || ''),
          description: cleanText(video.snippet?.description || ''),
          publishedAt: video.snippet?.publishedAt || '',
          thumbnail: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url || '',
          url: `https://youtube.com/watch?v=${video.id?.videoId || ''}`
        })) || [];
      })
    );

    return Response.json(videos.flat());
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    return Response.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

// Helper functions remain the same