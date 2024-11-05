import { NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'

export async function GET() {
  try {
    const videoId = 'ehPwhlAAQ7k' // Disney Resort Hotel Guide video
    
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    console.log('Transcript segments:', transcript?.length)

    if (!transcript) {
      return NextResponse.json({
        success: false,
        error: 'No transcript found'
      })
    }

    return NextResponse.json({
      success: true,
      videoId,
      segmentCount: transcript.length,
      segments: transcript,
      fullText: transcript.map(t => t.text).join(' ')
    })

  } catch (error) {
    console.error('Failed to get transcript:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : 'Unknown'
    }, { status: 500 })
  }
}