import { NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'
import OpenAI from 'openai'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.replace(/["']/g, '')
})

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

export async function GET() {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript('ehPwhlAAQ7k')
    const mainTranscript = transcript.filter(t => t.offset < 5000)
    const transcriptText = mainTranscript.map(t => t.text).join(' ')

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system", 
          content: "Extract Disney resort tips and format them according to the schema. Use current timestamp for all tips."
        },
        {
          role: "user",
          content: `Analyze this Disney video transcript and extract tips: ${transcriptText}`
        }
      ],
      response_format: zodResponseFormat(ChannelTipsSchema, "channelTips")
    })

    const response = completion.choices[0].message.parsed
    response.tips = response.tips.map(tip => ({
      ...tip,
      timestamp: new Date().toISOString()
    }))

    return NextResponse.json([response])

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json([], { status: 500 })
  }
}