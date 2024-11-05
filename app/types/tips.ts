export interface Tip {
  text: string;
  category: 'ride' | 'dining' | 'planning' | 'savings' | 'general';
  confidence: number;
  timestamp: string;
  videoTitle: string;
  videoUrl: string;
  channelTitle: string;
}

export interface ChannelTips {
  channelName: string;
  channelTitle: string;
  videoSummary: string;
  tips: Tip[];
  keyTakeaways: string[];
} 